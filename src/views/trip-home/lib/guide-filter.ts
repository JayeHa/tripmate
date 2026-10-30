import type { CityArea } from "@/entities/city";
import { placeSubtypeOf, SUBTYPE_LABEL, subtypesFor } from "@/entities/schedule-item";

import { type GuideCard, type GuideTab } from "./guide";

/** 정렬 — 추천순(보관함 순서: 최근에 담은 것부터) · 평점순 */
export type GuideSort = "rec" | "rating";

/** 일정 포함 여부 — 전체 · 일정에 있음 · 아직 안 넣음 */
export type GuideStatus = "all" | "in" | "out";

/** 지역 — 전체 · 지역 id · 「기타」(지역 없음) */
export type GuideArea = "all" | "none" | (string & {});

/** 메뉴 · 종류 — 전체 · 종류 값 · 「기타」(종류 없음) */
export type GuideType = "all" | "none" | (string & {});

export type GuideFilters = {
  sort: GuideSort;
  status: GuideStatus;
  area: GuideArea;
  type: GuideType;
};

export const GUIDE_FILTERS_DEFAULT: GuideFilters = {
  sort: "rec",
  status: "all",
  area: "all",
  type: "all",
};

/** 그 종류에 드는 카드인가 */
function ofType(card: GuideCard, type: GuideType): boolean {
  if (type === "all") return true;
  return (placeSubtypeOf(card.place) ?? "none") === type;
}

/** 그 지역에 드는 카드인가 */
function inArea(card: GuideCard, area: GuideArea): boolean {
  if (area === "all") return true;
  if (area === "none") return card.place.area_id === null;
  return card.place.area_id === area;
}

/**
 * 필터 · 정렬을 건 카드. 「일정에 있음」 은 일정에 넣은 날이 있는 것(카드의 「day N 배치됨」 과 같은 기준 — 대체 장소로만 넣은 것은 안 넣음).
 * 평점순은 별점 높은 것부터, 별점이 없으면 뒤로, 같으면 보관함 순서 그대로
 */
export function filterGuideCards(cards: readonly GuideCard[], f: GuideFilters): GuideCard[] {
  const shown = cards.filter(
    (c) =>
      inArea(c, f.area) &&
      ofType(c, f.type) &&
      (f.status === "all" || (f.status === "in") === (c.day !== null)),
  );
  if (f.sort !== "rating") return shown;
  return shown.toSorted((a, b) => (b.place.rating ?? -1) - (a.place.rating ?? -1));
}

/** 정렬 말고 필터가 걸렸는가 — 「초기화」 를 보인다 */
export function hasGuideFilter(f: GuideFilters): boolean {
  return f.status !== "all" || f.area !== "all" || f.type !== "all";
}

/** 「메뉴 ⌄」(식당) · 「종류 ⌄」(쇼핑 · 휴식) 칩 이름. 관광지는 칩이 없다 */
export function guideTypeName(tab: GuideTab): string {
  return tab === "food" ? "메뉴" : "종류";
}

/**
 * 「메뉴 ⌄」 · 「종류 ⌄」 의 옵션 — 이 탭 카드가 있는 종류만, 목록 순서대로 「🍜 라멘 · 면 4」, 종류 없는 카드는 끝에 「기타 N」.
 * 관광지이거나 가를 것이 하나뿐이면(모두 같은 종류) 빈 배열 — 칩을 숨긴다(시안 그대로)
 */
export function guideTypeOptions(
  cards: readonly GuideCard[],
  tab: GuideTab,
): { value: string; label: string }[] {
  const list = subtypesFor(tab === "food" ? "food" : tab);
  if (list.length === 0) return [];
  const count = new Map<string, number>();
  for (const c of cards) {
    const key = placeSubtypeOf(c.place) ?? "none";
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  if (count.size < 2) return [];
  const listed = list
    .filter((t) => count.has(t))
    .map((t) => ({ value: t, label: `${SUBTYPE_LABEL[t]} ${count.get(t)}` }));
  const none = count.get("none");
  return none ? [...listed, { value: "none", label: `기타 ${none}` }] : listed;
}

/**
 * 「전 지역 ⌄」 의 옵션 — 이 탭 카드가 있는 지역만, 목록 순서대로 「시부야 5」. 지역 없는 카드가 있으면 끝에 「기타 N」.
 * 지역 목록이 없는 여행(도시)이면 빈 배열 — 칩을 숨긴다
 */
export function guideAreaOptions(
  cards: readonly GuideCard[],
  areas: readonly CityArea[],
): { value: string; label: string }[] {
  if (areas.length === 0) return [];
  const count = new Map<string, number>();
  for (const c of cards) {
    const key = c.place.area_id ?? "none";
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const listed = areas
    .filter((a) => count.has(a.id))
    .map((a) => ({ value: a.id, label: `${a.name} ${count.get(a.id)}` }));
  const none = count.get("none");
  return none ? [...listed, { value: "none", label: `기타 ${none}` }] : listed;
}

/** 필터를 건 결과가 비었을 때의 안내 */
export function guideFilteredEmptyText(status: GuideStatus): string {
  if (status === "out") return "모든 장소가 일정에 들어갔어요.";
  if (status === "in") return "아직 일정에 넣은 곳이 없어요.";
  return "조건에 맞는 장소가 없어요.";
}
