import {
  type Alternative,
  alternativesOf,
  CATEGORY_EMOJI,
  CATEGORY_LABEL,
  categoryOf,
  DEFAULT_PLACE_EMOJI,
  isHttpUrl,
  isMappedPlace,
  type ItemKind,
  kindOf,
  linksOf,
  type PlaceCategory,
  statusOf,
} from "../model/place";
import type { ReservationStatus } from "../model/reservation-status";
import type { ScheduleItem } from "../model/types";
import { etaLabel, formatKm, haversineKm, SAME_PLACE_KM, transitRouteUrl } from "./distance";

export type TimelineLink = { title: string; url: string; gmap: boolean };

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
  /** 직전 번호 장소에서 오는 길. 50m 이하면 없다 */
  leg: { label: string; url: string } | null;
  /** memo 의 줄들. 펼치면 `·` 목록으로 보인다 */
  notes: string[];
  hours: string | null;
  links: TimelineLink[];
  alternatives: Alternative[];
};

type Located = { lat: number; lng: number };

function located(item: ScheduleItem): Located | null {
  return item.lat != null && item.lng != null ? { lat: item.lat, lng: item.lng } : null;
}

function emojiOf(item: ScheduleItem, kind: ItemKind, category: PlaceCategory | null) {
  if (item.emoji != null) return item.emoji || null;
  if (kind !== "place") return null;
  return category ? CATEGORY_EMOJI[category] : DEFAULT_PLACE_EMOJI;
}

/** place 는 「음식점 · ★ 4.7 (1,355) · 설명」, 나머지는 설명만 */
function metaOf(item: ScheduleItem, kind: ItemKind, category: PlaceCategory | null) {
  if (kind !== "place") return item.description || null;
  const rating =
    item.rating != null
      ? `★ ${item.rating.toFixed(1)}${item.review_count ? ` (${item.review_count.toLocaleString("ko-KR")})` : ""}`
      : null;
  const parts = [category && CATEGORY_LABEL[category], rating, item.description];
  return parts.filter(Boolean).join(" · ") || null;
}

function linksFor(item: ScheduleItem): TimelineLink[] {
  const gmap = isHttpUrl(item.gmap_url)
    ? [{ title: "구글맵", url: item.gmap_url, gmap: true }]
    : [];
  return [
    ...gmap,
    ...linksOf(item).map((l) => ({ title: l.title || "링크", url: l.url, gmap: false })),
  ];
}

function notesOf(memo: string | null): string[] {
  return (memo ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * 하루치 일정(position 순)의 장소 번호. 좌표가 있는 place 에만 1부터 붙는다.
 * 타임라인 마커 · 지도 핀 · 지도 칩이 모두 이 값을 써야 「3번 장소」가 어디서나 같다.
 */
export function placeNumbers(items: ScheduleItem[]): Map<string, number> {
  const numbered = items.filter(isMappedPlace);
  return new Map(numbered.map((item, i) => [item.id, i + 1]));
}

/** 하루치 일정(position 순)을 타임라인 줄로 바꾼다 */
export function buildTimeline(items: ScheduleItem[]): TimelineRow[] {
  const numbers = placeNumbers(items);
  let prev: Located | null = null;

  return items.map((item) => {
    const kind = kindOf(item);
    const category = categoryOf(item);
    const rowNum = numbers.get(item.id) ?? null;
    const here = rowNum ? located(item) : null;

    let leg: TimelineRow["leg"] = null;
    if (here) {
      const km = prev ? haversineKm(prev, here) : 0;
      if (prev && km > SAME_PLACE_KM) {
        leg = { label: `${formatKm(km)} · ${etaLabel(km)}`, url: transitRouteUrl(prev, here) };
      }
      prev = here;
    }

    return {
      item,
      kind,
      num: rowNum,
      time: item.start_time?.slice(0, 5) ?? null,
      status: statusOf(item),
      category,
      emoji: emojiOf(item, kind, category),
      meta: metaOf(item, kind, category),
      isMeal: kind === "place" && category === "food",
      leg,
      notes: notesOf(item.memo),
      hours: item.hours,
      links: linksFor(item),
      alternatives: alternativesOf(item),
    };
  });
}
