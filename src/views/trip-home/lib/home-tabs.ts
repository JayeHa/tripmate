/** 여행 홈 탭 — 요약 · 관광지 · 식당 · 쇼핑 · 휴식 · 교통(시안 순서) */
export const HOME_TABS = ["summary", "sight", "food", "shop", "rest", "transport"] as const;
export type HomeTab = (typeof HOME_TABS)[number];

/** 탭 이름 */
export const HOME_TAB_LABEL: Record<HomeTab, string> = {
  summary: "요약",
  sight: "관광지",
  food: "식당",
  shop: "쇼핑",
  rest: "휴식",
  transport: "교통",
};

/** 주소의 tab 값 → 탭. 없거나 모르는 값이면 요약 */
export function parseHomeTab(value: string | null): HomeTab {
  return HOME_TABS.find((t) => t === value) ?? "summary";
}
