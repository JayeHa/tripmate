import {
  CATEGORY_LABEL,
  type GuidePlace,
  type Place,
  type PlaceCategory,
  placeSubtypeOf,
  type ScheduleItem,
  SUBTYPE_LABEL,
} from "@/entities/schedule-item";

import { HOME_TAB_LABEL, type HomeTab } from "./home-tabs";

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

/**
 * 가이드 카드 한 장 — 보관함 줄 + 일정에 넣은 첫날(day_index, 없으면 null) · 보일 이모지.
 * inSchedule 은 대체 장소로라도 일정에 있는가 — 있으면 보관함에서 뺄 수 없다(DB 도 막는다)
 */
export type GuideCard = GuidePlace & {
  day: number | null;
  emoji: string | null;
  inSchedule: boolean;
  /** 지역 이름(긴자 · 시부야 …). 지역이 없거나 목록을 모르면 null */
  area: string | null;
};

/**
 * 그 탭의 카드 — 보관함 순서(최근에 담은 것부터) 그대로. 일정에 넣은 장소는 가장 이른 날을 붙인다(대체 장소는 넣은 것으로 치지 않는다).
 * 이모지는 장소 것, 없으면 그 장소를 쓰는 첫 일정의 것, 그것도 없으면 대체 장소 일정의 것
 */
export function guideCards(
  rows: readonly GuidePlace[],
  items: readonly ScheduleItem[],
  tab: GuideTab,
  /** 지역 id → 이름 */
  areaNames: ReadonlyMap<string, string> = new Map(),
): GuideCard[] {
  const first = new Map<string, ScheduleItem>();
  const emoji = new Map<string, string>();
  const used = new Set<string>();
  for (const item of items) {
    if (!item.place_id) continue;
    used.add(item.place_id);
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
      const inSchedule = item !== undefined || used.has(row.place.id);
      const area = row.place.area_id ? (areaNames.get(row.place.area_id) ?? null) : null;
      return { ...row, day: item?.day_index ?? null, emoji: icon, inSchedule, area };
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

/** 탭 맨 아래 「+ ○○ 추가」 의 글자 */
export const GUIDE_ADD_LABEL: Record<GuideTab, string> = {
  sight: "관광지 추가",
  food: "식당 추가",
  shop: "쇼핑 장소 추가",
  rest: "휴식 장소 추가",
};

/** 「+ ○○ 추가」 로 연 장소 입력의 처음 카테고리 — 식당 탭은 음식점(카페는 직접 고른다) */
export const GUIDE_TAB_CATEGORY: Record<GuideTab, PlaceCategory> = {
  sight: "sight",
  food: "food",
  shop: "shop",
  rest: "rest",
};

/** 이 카테고리의 장소가 보이는 가이드 탭. 숙소 · 공항은 어느 탭에도 없어 null */
export function guideTabOf(category: string | null): GuideTab | null {
  const tabs = Object.keys(TAB_CATEGORIES) as GuideTab[];
  return tabs.find((tab) => TAB_CATEGORIES[tab].includes(category)) ?? null;
}

/**
 * 「장소 저장」 뒤 토스트 — 지금 탭에 보이면 「장소를 저장했어요」, 다른 탭이면 그 탭 이름을 알린다
 * (구글 장소를 고르면 카테고리가 바뀌어 지금 탭에 안 보일 수 있다). 이미 보관함에 있던 장소면 그렇게 알린다
 */
export function guideSavedToast(
  saved: { added: boolean; category: string | null },
  tab: GuideTab,
): string {
  if (!saved.added) return "이미 보관함에 있는 장소예요";
  const shown = guideTabOf(saved.category);
  if (shown === tab) return "장소를 저장했어요";
  if (shown === null) return "저장했어요. 숙소는 가이드 탭에 보이지 않아요";
  return `「${HOME_TAB_LABEL[shown]}」 탭에 저장했어요`;
}

/** 종류 칩 글자 — 메뉴 · 종류가 있으면 그것(「🍜 라멘 · 면」), 없으면 카테고리(「음식점」), 둘 다 없으면 null */
export function guideKindLabel(place: Pick<Place, "category" | "subtype">): string | null {
  const subtype = placeSubtypeOf(place);
  if (subtype) return SUBTYPE_LABEL[subtype];
  const category = place.category as PlaceCategory | null;
  return category && category in CATEGORY_LABEL ? CATEGORY_LABEL[category] : null;
}
