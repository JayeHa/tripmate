import { currencyName, formatMoney } from "@/shared/lib/money";

import { WIDGET_KEYS, type WidgetKey, type WidgetSlots, type WidgetTile } from "./widgets";

/**
 * 「홈 위젯 편집」 에서 고른 것 — 순서와, 사용자가 직접 켜거나 끈 위젯. 기기 하나에 하나(모든 여행에 같이 쓴다).
 * shown 에 없는 위젯은 여행마다 자동으로 정한다(시차 없음 → 시간 숨김 등)
 */
export type WidgetPrefs = { order: WidgetKey[]; shown: Partial<Record<WidgetKey, boolean>> };

export const DEFAULT_WIDGET_PREFS: WidgetPrefs = { order: [...WIDGET_KEYS], shown: {} };

/** 위젯 이름인가 */
function isKey(v: unknown): v is WidgetKey {
  return WIDGET_KEYS.includes(v as WidgetKey);
}

/**
 * 저장된 값을 읽는다. 모양이 다르면 기본값. 순서에서 모르는 이름 · 겹친 이름은 빼고 빠진 위젯은 뒤에 붙인다
 * (나중에 위젯이 늘어도 옛 저장값이 그대로 쓰인다)
 */
export function parseWidgetPrefs(value: unknown): WidgetPrefs {
  if (typeof value !== "object" || value === null) return DEFAULT_WIDGET_PREFS;
  const { order, shown } = value as Record<string, unknown>;
  const kept = Array.isArray(order) ? [...new Set(order.filter(isKey))] : [];
  const entries = typeof shown === "object" && shown !== null ? Object.entries(shown) : [];
  return {
    order: [...kept, ...WIDGET_KEYS.filter((k) => !kept.includes(k))],
    shown: Object.fromEntries(entries.filter(([k, v]) => isKey(k) && typeof v === "boolean")),
  };
}

/** 그 위젯이 켜져 있는가 — 사용자가 고른 것이 우선, 아니면 자동 */
export function isWidgetOn(prefs: WidgetPrefs, slots: WidgetSlots, key: WidgetKey): boolean {
  return prefs.shown[key] ?? slots[key].auto;
}

/** 위젯 줄에 그릴 타일 — 고른 순서대로, 켜져 있고 그릴 것이 있는 것만 */
export function visibleTiles(slots: WidgetSlots, prefs: WidgetPrefs): WidgetTile[] {
  return prefs.order.flatMap((key) => {
    const tile = slots[key].tile;
    return tile && isWidgetOn(prefs, slots, key) ? [tile] : [];
  });
}

/**
 * 스위치를 누른 결과 — 지금 보이는 상태를 뒤집는다. 뒤집은 값이 이 여행의 자동과 같으면 사용자 선택을 지운다.
 * 설정은 모든 여행에 하나라, 껐다 켜서 제자리로 돌린 것까지 남기면 다른 여행에서 자동 숨김이 풀린다
 */
export function toggleWidget(prefs: WidgetPrefs, slots: WidgetSlots, key: WidgetKey): WidgetPrefs {
  const next = !isWidgetOn(prefs, slots, key);
  const shown = { ...prefs.shown };
  delete shown[key];
  if (next !== slots[key].auto) shown[key] = next;
  return { ...prefs, shown };
}

/** 끌어서 놓은 결과 — from 자리의 위젯을 to 자리로 */
export function moveWidget(prefs: WidgetPrefs, from: number, to: number): WidgetPrefs {
  const order = [...prefs.order];
  const [moved] = order.splice(from, 1);
  order.splice(to, 0, moved);
  return { ...prefs, order };
}

/** 편집 줄 이름 */
export const WIDGET_NAME: Record<WidgetKey, string> = {
  weather: "날씨",
  rate: "환율",
  holiday: "달력 · 공휴일",
  time: "현지 시간 · 시차",
};

/** 편집 줄 설명에 필요한 여행 정보 — 첫 도시 이름 · 여행지 통화 · 기준 화폐 · 여행 환율(없으면 null) */
export type WidgetInfo = {
  city: string;
  currency: string;
  home: string;
  rate: { unit: number; value: number } | null;
};

/**
 * 편집 줄 하나 — 이름 · 설명 · 켜짐 · 막힘(켜도 보일 것이 없는 환율).
 * needsRate 면 여행 환율이 없어 막힌 것 — 스위치 대신 설정의 환율 창으로 가는 「넣기」
 */
export type WidgetEditRow = {
  key: WidgetKey;
  name: string;
  sub: string;
  on: boolean;
  disabled: boolean;
  needsRate: boolean;
};

/** 위젯이 무엇을 보이는지, 자동으로 숨긴 이유 */
function describe(key: WidgetKey, slots: WidgetSlots, info: WidgetInfo): string {
  const auto = slots[key].auto;
  if (key === "weather") return `${info.city} · 여행 10일 전부터 예보`;
  // 자동으로 숨긴 공휴일은 켰을 때 보일 「없음」 타일의 설명(여행 전 · 여행 중에 따라 다름)을 그대로 쓴다
  if (key === "holiday")
    return auto ? "여행 기간에 현지 공휴일이 있을 때" : (slots.holiday.tile?.sub ?? "");
  if (key === "time") return auto ? (slots.time.tile?.sub ?? "") : "한국과 시차가 없어요";
  if (info.rate) {
    const unit = `${info.rate.unit.toLocaleString("ko-KR")}${currencyName(info.currency)}`;
    return `${unit} = ${formatMoney(info.rate.value, info.home)} · 설정의 여행 환율`;
  }
  if (info.currency === info.home) return "여행지 통화가 기준 화폐와 같아요";
  return "여행 환율이 없어요 · 넣으면 보여요";
}

/**
 * 편집 화면의 줄 — 고른 순서대로. 자동으로 숨겼고 사용자가 아직 손대지 않았으면 설명 뒤에 「자동으로 숨겼어요」.
 * 환율은 그릴 것이 없으면(국내 · 여행 환율 없음) 스위치를 막고 끈 것으로 보인다
 */
export function widgetEditRows(
  slots: WidgetSlots,
  prefs: WidgetPrefs,
  info: WidgetInfo,
): WidgetEditRow[] {
  return prefs.order.map((key) => {
    const disabled = key === "rate" && slots.rate.tile === null;
    const autoHidden = !disabled && !slots[key].auto && prefs.shown[key] === undefined;
    const sub = describe(key, slots, info);
    return {
      key,
      name: WIDGET_NAME[key],
      sub: autoHidden ? `${sub} · 자동으로 숨겼어요` : sub,
      on: !disabled && isWidgetOn(prefs, slots, key),
      disabled,
      needsRate: disabled && info.rate === null && info.currency !== info.home,
    };
  });
}
