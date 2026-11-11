import type { Tables } from "@/shared/api/supabase/database.types";

/** 다녀온 장소의 별점 한 줄(0084) — 일정 × 사람에 하나, 1~5점 */
export type PlaceRating = Tables<"place_ratings">;

/** 한 사람의 별점 — 일정 id → 1~5. 없는 일정은 아직 매기지 않았다 */
export type RatingStars = Readonly<Record<string, number>>;

/** 점수마다의 문구(1~5). 0 · 범위 밖은 없다 */
const RATING_TEXT: Readonly<Record<number, string>> = {
  1: "별로예요",
  2: "그저 그래요",
  3: "괜찮아요",
  4: "좋아요",
  5: "최고예요",
};

/** 점수의 문구 — 「4 → 좋아요」. 매기지 않았으면 null */
export function ratingText(stars: number): string | null {
  return RATING_TEXT[stars] ?? null;
}

/** 그 사람이 매긴 별점만 일정 id 별로. 사람을 모르면(로그인 확인 전) 빈 값 */
export function starsOf(ratings: readonly PlaceRating[], userId: string | null): RatingStars {
  if (!userId) return {};
  return Object.fromEntries(
    ratings.filter((r) => r.user_id === userId).map((r) => [r.item_id, r.stars]),
  );
}

/** 별을 눌렀을 때 남길 점수 — 같은 점수를 다시 누르면 0(지우기) */
export function nextStars(current: number, tapped: number): number {
  return current === tapped ? 0 : tapped;
}
