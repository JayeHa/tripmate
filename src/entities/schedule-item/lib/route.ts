import type { MoveMode } from "../model/move";
import { haversineKm, SAME_PLACE_KM, transitMinutes, WALK_MAX_KM, walkMinutes } from "./distance";

/**
 * 노선도의 구간(역 사이 이동) — 목록의 선 · 이동 칩과 지도의 선이 같은 값을 쓴다.
 * 이동 기록(moves)에 수단이 있으면 그 수단, 없으면 직선거리로 추정한다(도보 1.2km 이하 · 그 외 대중교통).
 */

/** 선 종류 — 대중교통(지하철 · 버스 · 기차 · 택시 · 추정) · 도보 · 항공 · 좌표 없는 구간 */
export type RouteMode = "transit" | "walk" | "flight" | "none";

/** 계획 · 기록 모드의 지나온 구간 · 남은 구간 */
export type RouteTone = "plan" | "done" | "todo";

type LatLng = { lat: number; lng: number };

/** 구간 하나의 화면 값 */
export type RouteSegment = {
  mode: RouteMode;
  /** 칩 앞 아이콘 「🚇」. 좌표 없는 구간은 "" */
  icon: string;
  /** 걸리는 분. 좌표 없는 구간 · 같은 자리는 null */
  minutes: number | null;
  /** 수단을 적지 않아 직선거리로 추정했다 — 칩에 「약」 */
  estimated: boolean;
  /** 「10:55」 — 다음 역 시각 − 걸리는 분, 항공은 편명 출발 시각. 모르면 null */
  depTime: string | null;
  /** 옆 글자의 수단 이름 「공항버스」 대신 「버스」 처럼 적은 수단 · 추정은 「대중교통」 · 항공은 「비행」 */
  modeName: string;
  /** 이동 기록의 상세(60자) */
  detail: string | null;
  /** 이동 방법 창에서 고른 수단. 고르지 않았거나 항공편 일정이면 null */
  picked: MoveMode | null;
};

/** 적은 수단 → 선 종류 · 아이콘 · 이름 */
const MODE_VIEW: Record<MoveMode, { mode: RouteMode; icon: string; name: string }> = {
  subway: { mode: "transit", icon: "🚇", name: "지하철" },
  bus: { mode: "transit", icon: "🚌", name: "버스" },
  train: { mode: "transit", icon: "🚆", name: "기차" },
  taxi: { mode: "transit", icon: "🚕", name: "택시" },
  walk: { mode: "walk", icon: "🚶", name: "도보" },
  flight: { mode: "flight", icon: "✈️", name: "비행" },
};

/** 추정 대중교통이 이보다 멀면 아이콘을 버스로(공항 · 근교) */
const FAR_KM = 20;

/** 「HH:mm」 → 분. 모양이 다르면 null */
function toMinutes(time: string | null): number | null {
  const m = time ? /^(\d{1,2}):(\d{2})/.exec(time) : null;
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** 분 → 「HH:mm」(하루를 넘거나 앞서면 24시간으로 돌린다) */
function toHHmm(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** 다음 역 시각 − 걸리는 분. 다음 역 시각을 모르면 null */
function departure(arrive: string | null, minutes: number): string | null {
  const at = toMinutes(arrive);
  return at === null ? null : toHHmm(at - minutes);
}

/** 좌표 없는 구간(장소 → 항공편 등) — 2px 회색 선, 칩 없음 */
const NONE: RouteSegment = {
  mode: "none",
  icon: "",
  minutes: null,
  estimated: false,
  depTime: null,
  modeName: "",
  detail: null,
  picked: null,
};

/** 같은 자리(50m 이하) — 짧은 도보 선만, 칩 없음 */
const SAME_PLACE: RouteSegment = { ...NONE, mode: "walk", icon: "🚶", modeName: "도보" };

/** 수단을 적지 않은 구간 — 1.2km 이하 도보, 그 외 대중교통(20km 넘으면 버스 아이콘) */
function estimated(km: number, arrive: string | null, detail: string | null): RouteSegment {
  if (km <= WALK_MAX_KM) {
    const minutes = walkMinutes(km);
    return {
      mode: "walk",
      icon: "🚶",
      minutes,
      estimated: true,
      depTime: departure(arrive, minutes),
      modeName: "도보",
      detail,
      picked: null,
    };
  }
  const minutes = transitMinutes(km);
  return {
    mode: "transit",
    icon: km > FAR_KM ? "🚌" : "🚇",
    minutes,
    estimated: true,
    depTime: departure(arrive, minutes),
    modeName: "대중교통",
    detail,
    picked: null,
  };
}

/** 이동 방법 창에 적은 값 — 수단 · 상세 · 직접 정한 소요 시간(분) */
export type MoveChoice = { mode: MoveMode | null; detail: string | null; minutes?: number | null };

/**
 * 두 장소 사이 구간. from · to 는 좌표(없으면 null), arrive 는 다음 역 시각(「HH:mm」).
 * move 는 그 쌍에 적은 이동 기록 — 수단이 있으면 그 수단의 선 · 아이콘이고 시간도 그 수단 식으로 센다(도보 = 13분/km, 그 밖 = 대중교통 식).
 * 수단이 없으면 추정이다. 직접 정한 소요 시간이 있으면 시간만 그 값으로 바꾼다(「약」 없이) — 수단만 고르면 시간은 자동, 시간만 정하면 수단은 자동.
 * 50m 이하(같은 자리)는 시간 없이 선만, 항공으로 적은 구간은 소요 시간을 정했을 때만 시간이 있다
 */
export function placeSegment(
  from: LatLng | null,
  to: LatLng | null,
  arrive: string | null,
  move: MoveChoice | null = null,
): RouteSegment {
  if (!from || !to) return NONE;
  const km = haversineKm(from, to);
  const detail = move?.detail || null;
  const base = move?.mode ? pickedBase(move.mode, detail) : null;
  if (km <= SAME_PLACE_KM) return base ? { ...NONE, ...base } : { ...SAME_PLACE, detail };
  const seg = base ? pickedSegment(base, km, arrive) : estimated(km, arrive, detail);
  const set = move?.minutes ?? null;
  return set === null
    ? seg
    : { ...seg, minutes: set, estimated: false, depTime: departure(arrive, set) };
}

type PickedBase = Pick<RouteSegment, "mode" | "icon" | "modeName" | "detail" | "picked">;

/** 고른 수단의 선 종류 · 아이콘 · 이름 */
function pickedBase(mode: MoveMode, detail: string | null): PickedBase {
  const view = MODE_VIEW[mode];
  return { mode: view.mode, icon: view.icon, modeName: view.name, detail, picked: mode };
}

/** 고른 수단의 구간 — 항공은 편명이 없으면 시간을 모른다(대중교통 식으로 세면 880km 가 「17시간 30분」) — 칩 없이 파선만 */
function pickedSegment(base: PickedBase, km: number, arrive: string | null): RouteSegment {
  if (base.mode === "flight") return { ...NONE, ...base };
  const minutes = base.mode === "walk" ? walkMinutes(km) : transitMinutes(km);
  return { ...base, minutes, estimated: false, depTime: departure(arrive, minutes) };
}

/**
 * 항공편 → 다음 역 구간. 편명의 출발 · 도착 날짜 · 시각(현지 시각 그대로)으로 비행 시간을 센다 —
 * 시차가 있는 노선은 실제 비행 시간과 다를 수 있다. 출발 시각이 곧 「07:15 출발」
 */
export function flightSegment(flight: {
  dep_date: string;
  dep_time: string;
  arr_date: string;
  arr_time: string;
}): RouteSegment {
  const dep = toMinutes(flight.dep_time);
  const arr = toMinutes(flight.arr_time);
  const days = Math.round(
    (Date.parse(`${flight.arr_date}T00:00:00Z`) - Date.parse(`${flight.dep_date}T00:00:00Z`)) /
      86_400_000,
  );
  const minutes = dep === null || arr === null ? null : Math.max(0, arr - dep + days * 1440);
  return {
    mode: "flight",
    icon: "✈️",
    minutes,
    estimated: false,
    depTime: dep === null ? null : toHHmm(dep),
    modeName: "비행",
    detail: null,
    picked: null,
  };
}

/**
 * 하루 요약 칩 — 대중교통 · 도보 · 택시 분의 합(그날 구간 합, 항공 · 좌표 없는 구간은 빼고).
 * 택시로 고른 구간은 대중교통에 넣지 않고 따로 센다(2026-11-21 사용자 결정)
 */
export function routeTotals(segments: readonly (RouteSegment | null)[]): {
  transit: number;
  walk: number;
  taxi: number;
} {
  const sum = { transit: 0, walk: 0, taxi: 0 };
  for (const seg of segments) {
    if (!seg || seg.minutes === null) continue;
    if (seg.picked === "taxi") sum.taxi += seg.minutes;
    else if (seg.mode === "transit") sum.transit += seg.minutes;
    else if (seg.mode === "walk") sum.walk += seg.minutes;
  }
  return sum;
}
