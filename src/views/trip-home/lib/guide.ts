import type { GuidePlace, Place, ScheduleItem } from "@/entities/schedule-item";

import type { HomeTab } from "./home-tabs";

/** 가이드 탭 — 홈 탭 중 장소 보관함을 보이는 넷 */
export type GuideTab = Extract<HomeTab, "sight" | "food" | "shop" | "rest">;

/** 가이드 탭인가 */
export function isGuideTab(tab: HomeTab): tab is GuideTab {
  return tab === "sight" || tab === "food" || tab === "shop" || tab === "rest";
}

/**
 * 탭마다 보이는 장소 카테고리 — 식당은 음식점 + 카페. 숙소 · 공항은 어느 탭에도 없다.
 * 카테고리가 빈 옛 장소는 관광지에 보인다(어디에도 안 보이면 보관함에서 사라진 것처럼 보인다)
 */
const TAB_CATEGORIES: Record<GuideTab, (string | null)[]> = {
  sight: ["sight", null],
  food: ["food", "cafe"],
  shop: ["shop"],
  rest: ["rest"],
};

/** 한 번에 그리는 카드 수 — 끝에 닿으면 이만큼 더 */
export const GUIDE_PAGE = 15;

/** 가이드 카드 한 장 — 보관함 줄 + 일정에 넣은 첫날(day_index, 없으면 null) · 보일 이모지 */
export type GuideCard = GuidePlace & { day: number | null; emoji: string | null };

/**
 * 그 탭의 카드 — 보관함 순서(최근에 담은 것부터) 그대로. 일정에 넣은 장소는 가장 이른 날을 붙인다(대체 장소는 넣은 것으로 치지 않는다).
 * 이모지는 장소 것, 없으면 그 장소를 쓰는 첫 일정의 것, 그것도 없으면 대체 장소 일정의 것
 */
export function guideCards(
  rows: readonly GuidePlace[],
  items: readonly ScheduleItem[],
  tab: GuideTab,
): GuideCard[] {
  const first = new Map<string, ScheduleItem>();
  const emoji = new Map<string, string>();
  for (const item of items) {
    if (!item.place_id) continue;
    if (item.emoji && !emoji.has(item.place_id)) emoji.set(item.place_id, item.emoji);
    if (item.alternative_of) continue;
    const seen = first.get(item.place_id);
    if (!seen || item.day_index < seen.day_index) first.set(item.place_id, item);
  }
  return rows
    .filter((row) => TAB_CATEGORIES[tab].includes(row.place.category))
    .map((row) => {
      const item = first.get(row.place.id);
      const icon = row.place.emoji || item?.emoji || emoji.get(row.place.id) || null;
      return { ...row, day: item?.day_index ?? null, emoji: icon };
    });
}

/** 「★ 4.2 (5,541)」 의 리뷰 수 글자 — 없으면 빈 글자 */
export function reviewsLabel(place: Pick<Place, "review_count">): string {
  return place.review_count ? `(${place.review_count.toLocaleString("ko-KR")})` : "";
}

/** 카드에서 3줄로 잘리는 글인가 — 「자세히 보기」 를 붙인다 */
export function isLongText(text: string | null): boolean {
  if (!text) return false;
  return text.split("\n").length > 3 || text.length > 90;
}
