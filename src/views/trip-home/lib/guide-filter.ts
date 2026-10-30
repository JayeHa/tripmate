import type { GuideCard } from "./guide";

/** 정렬 — 추천순(보관함 순서: 최근에 담은 것부터) · 평점순 */
export type GuideSort = "rec" | "rating";

/** 일정 포함 여부 — 전체 · 일정에 있음 · 아직 안 넣음 */
export type GuideStatus = "all" | "in" | "out";

export type GuideFilters = { sort: GuideSort; status: GuideStatus };

export const GUIDE_FILTERS_DEFAULT: GuideFilters = { sort: "rec", status: "all" };

/**
 * 필터 · 정렬을 건 카드. 「일정에 있음」 은 일정에 넣은 날이 있는 것(카드의 「day N 배치됨」 과 같은 기준 — 대체 장소로만 넣은 것은 안 넣음).
 * 평점순은 별점 높은 것부터, 별점이 없으면 뒤로, 같으면 보관함 순서 그대로
 */
export function filterGuideCards(cards: readonly GuideCard[], f: GuideFilters): GuideCard[] {
  const shown = cards.filter((c) => f.status === "all" || (f.status === "in") === (c.day !== null));
  if (f.sort !== "rating") return shown;
  return shown.toSorted((a, b) => (b.place.rating ?? -1) - (a.place.rating ?? -1));
}

/** 정렬 말고 필터가 걸렸는가 — 「초기화」 를 보인다 */
export function hasGuideFilter(f: GuideFilters): boolean {
  return f.status !== "all";
}

/** 필터를 건 결과가 비었을 때의 안내 */
export function guideFilteredEmptyText(status: GuideStatus): string {
  if (status === "out") return "모든 장소가 일정에 들어갔어요.";
  if (status === "in") return "아직 일정에 넣은 곳이 없어요.";
  return "조건에 맞는 장소가 없어요.";
}
