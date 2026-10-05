import { hoursOnDay } from "../model/hours";
import { type Memo, memosByItem } from "../model/memo";
import { type Move, MOVE_MODE_LABEL, moveKey, type MoveMode, moveModeOf } from "../model/move";
import {
  CATEGORY_LABEL,
  categoryOf,
  isHttpUrl,
  isMappedPlace,
  itemCoords,
  type ItemKind,
  itemName,
  kindOf,
  linksOf,
  type PlaceCategory,
  statusOf,
} from "../model/place";
import type { ReservationStatus } from "../model/reservation-status";
import type { ScheduleItem } from "../model/types";
import { etaLabel, formatKm, haversineKm, SAME_PLACE_KM, transitRouteUrl } from "./distance";

export type TimelineLink = { title: string; url: string; gmap: boolean };

/** 직전 번호 장소 → 이 장소. 거리 pill 과 그 쌍에 적은 이동 방법 */
export type TimelineLeg = {
  label: string;
  url: string;
  fromItemId: string;
  fromName: string;
  mode: MoveMode | null;
  /** 「🚇 지하철」. 수단 없이 상세만 적었으면 null */
  modeLabel: string | null;
  detail: string | null;
  /** 적어 둔 기록이 있는지 (수정 · 지우기) */
  hasMove: boolean;
};

/** 타임라인 한 줄을 그리는 데 필요한 값. 계산은 여기서 끝내고 컴포넌트는 그리기만 한다 */
export type TimelineRow = {
  item: ScheduleItem;
  kind: ItemKind;
  /** 좌표가 있는 place 에만 붙는 번호. 지도 핀 번호와 같다 */
  num: number | null;
  /** HH:mm */
  time: string | null;
  status: ReservationStatus | null;
  category: PlaceCategory | null;
  emoji: string | null;
  meta: string | null;
  isMeal: boolean;
  /** 직전 번호 장소에서 오는 길. 50m 이하면 없다(이동 방법도 그때만 적을 수 있다) */
  leg: TimelineLeg | null;
  /** 이 일정의 메모(쓴 순서). ★ 중요는 접어도 보인다 */
  memos: Memo[];
  /** 그날의 운영시간(요일별이면 그 요일 값, 「일 10:00–22:00」). 펼친 메모 칸에 「운영 …」 으로 */
  hours: string | null;
  /** 그날 휴무 — 카드에 경고 칩으로(메모를 접어도 보인다) */
  hoursOff: boolean;
  links: TimelineLink[];
  /** 이 일정의 대체 장소(일정 줄, 장소 포함 — 0024). 만든 순서 */
  alternatives: ScheduleItem[];
};

type Located = { lat: number; lng: number };

/**
 * 제목 앞 이모지. 이 일정에서 바꾼 아이콘 → 장소의 아이콘 순이고, 둘 다 없으면 두지 않는다
 * (카테고리 기본 아이콘으로 채우지 않는다 — 고른 사람만 아이콘을 단다). 빈 문자열로 바꿔 두면 숨긴다.
 */
function emojiOf(item: ScheduleItem) {
  return (item.emoji ?? item.place?.emoji) || null;
}

/** place 는 「음식점 · ★ 4.7 (1,355) · 설명」(장소 정보), 나머지는 일정의 설명만 */
function metaOf(item: ScheduleItem, kind: ItemKind, category: PlaceCategory | null) {
  const place = item.place;
  if (kind !== "place" || !place) return item.description || null;
  const rating =
    place.rating != null
      ? `★ ${place.rating.toFixed(1)}${place.review_count ? ` (${place.review_count.toLocaleString("ko-KR")})` : ""}`
      : null;
  const parts = [category && CATEGORY_LABEL[category], rating, place.description];
  return parts.filter(Boolean).join(" · ") || null;
}

/** 링크 칩: 장소의 구글맵 + 일정 링크 + 장소 링크 */
function linksFor(item: ScheduleItem): TimelineLink[] {
  const gmapUrl = item.place?.gmap_url;
  const gmap = isHttpUrl(gmapUrl) ? [{ title: "구글맵", url: gmapUrl, gmap: true }] : [];
  return [
    ...gmap,
    ...linksOf(item).map((l) => ({ title: l.title || "링크", url: l.url, gmap: false })),
  ];
}

/**
 * 하루치 일정(position 순)의 장소 번호. 좌표가 있는 place 에만 1부터 붙는다.
 * 타임라인 마커 · 지도 핀 · 지도 칩이 모두 이 값을 써야 「3번 장소」가 어디서나 같다.
 */
export function placeNumbers(items: ScheduleItem[]): Map<string, number> {
  const numbered = items.filter(isMappedPlace);
  return new Map(numbered.map((item, i) => [item.id, i + 1]));
}

/** 직전 장소와의 거리 pill + 그 쌍의 이동 방법 */
function legOf(
  prev: { item: ScheduleItem; at: Located },
  item: ScheduleItem,
  here: Located,
  moves: ReadonlyMap<string, Move>,
): TimelineLeg | null {
  const km = haversineKm(prev.at, here);
  if (km <= SAME_PLACE_KM) return null;
  const move = moves.get(moveKey(prev.item.id, item.id));
  const mode = move ? moveModeOf(move) : null;
  return {
    label: `${formatKm(km)} · ${etaLabel(km)}`,
    url: transitRouteUrl(prev.at, here),
    fromItemId: prev.item.id,
    fromName: itemName(prev.item),
    mode,
    modeLabel: mode ? MOVE_MODE_LABEL[mode] : null,
    detail: move?.detail || null,
    hasMove: !!move,
  };
}

/** 그날의 운영시간 칸(hours · hoursOff). 장소가 없거나 그날 값을 모르면 비어 있다 */
function hoursOf(item: ScheduleItem, dow: number | null): Pick<TimelineRow, "hours" | "hoursOff"> {
  const day = item.place ? hoursOnDay(item.place, dow) : null;
  return { hours: day?.text ?? null, hoursOff: day?.off ?? false };
}

/**
 * 하루치 일정(position 순)과 여행의 이동 기록을 타임라인 줄로 바꾼다.
 * dow 는 그날의 요일(Date.getDay(), 0 = 일요일) — 요일별 운영시간에서 그날 값을 고른다. 모르면 null.
 * alternatives 는 여행의 대체 장소 줄들 — 붙은 일정(alternative_of)마다 모아 그 줄에 단다.
 * memos 는 여행의 메모들 — 일정마다 모아 단다
 */
export function buildTimeline(
  items: ScheduleItem[],
  moves: Move[] = [],
  dow: number | null = null,
  alternatives: ScheduleItem[] = [],
  memos: Memo[] = [],
): TimelineRow[] {
  const memosOf = memosByItem(memos);
  const numbers = placeNumbers(items);
  const altsByItem = new Map<string, ScheduleItem[]>();
  for (const alt of alternatives) {
    if (!alt.alternative_of) continue;
    altsByItem.set(alt.alternative_of, [...(altsByItem.get(alt.alternative_of) ?? []), alt]);
  }
  const moveByPair = new Map(moves.map((m) => [moveKey(m.from_item_id, m.to_item_id), m]));
  let prev: { item: ScheduleItem; at: Located } | null = null;

  return items.map((item) => {
    const kind = kindOf(item);
    const category = categoryOf(item);
    const rowNum = numbers.get(item.id) ?? null;
    const here = rowNum ? itemCoords(item) : null;

    let leg: TimelineLeg | null = null;
    if (here) {
      if (prev) leg = legOf(prev, item, here, moveByPair);
      prev = { item, at: here };
    }

    return {
      item,
      kind,
      num: rowNum,
      time: item.start_time?.slice(0, 5) ?? null,
      status: statusOf(item),
      category,
      emoji: emojiOf(item),
      meta: metaOf(item, kind, category),
      isMeal: kind === "place" && category === "food",
      leg,
      memos: memosOf.get(item.id) ?? [],
      ...hoursOf(item, dow),
      links: linksFor(item),
      alternatives: altsByItem.get(item.id) ?? [],
    };
  });
}
