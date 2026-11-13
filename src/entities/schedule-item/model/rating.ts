import type { Tables } from "@/shared/api/supabase/database.types";

import type { ScheduleItem } from "./types";

/** 다녀온 장소의 별점 한 줄(0087) — 여행의 장소(장소키) × 사람에 하나, 1~5점 */
export type PlaceRating = Tables<"place_ratings">;

/** 한 사람의 별점 — 일정 id → 1~5. 같은 장소의 일정은 모두 같은 값, 없는 일정은 아직 매기지 않았다 */
export type RatingStars = Readonly<Record<string, number>>;

/**
 * 별점을 묶는 장소키 — 구글 장소 ID, 없으면(직접 입력 장소) 장소 행 id. 장소가 없는 일정(항공편 · 노트)은 null.
 * DB 의 rate_place · place_rating_guard 와 같은 규칙이다(0087)
 */
export function placeKeyOf(item: Pick<ScheduleItem, "place">): string | null {
  return item.place ? item.place.google_place_id || item.place.id : null;
}

/** 일정 id → 그 장소를 이 여행에서 들르는 횟수(장소 일정만). 「🔁 이 여행에서 3번 들러요」 */
export function visitCountsOf(
  items: readonly Pick<ScheduleItem, "id" | "place">[],
): Readonly<Record<string, number>> {
  const byKey = new Map<string, number>();
  for (const item of items) {
    const key = placeKeyOf(item);
    if (key) byKey.set(key, (byKey.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(
    items.flatMap((item) => {
      const key = placeKeyOf(item);
      return key ? [[item.id, byKey.get(key) ?? 0]] : [];
    }),
  );
}

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

/**
 * 그 사람이 매긴 별점을 일정 id 별로 — 같은 장소의 일정은 모두 같은 값. 사람을 모르면(로그인 확인 전) 빈 값
 */
export function starsOf(
  ratings: readonly PlaceRating[],
  userId: string | null,
  items: readonly Pick<ScheduleItem, "id" | "place">[],
): RatingStars {
  if (!userId) return {};
  const byKey = new Map(
    ratings.filter((r) => r.user_id === userId).map((r) => [r.place_key, r.stars]),
  );
  return Object.fromEntries(
    items.flatMap((item) => {
      const stars = byKey.get(placeKeyOf(item) ?? "");
      return stars ? [[item.id, stars]] : [];
    }),
  );
}

/** 한 장소의 사람별 별점 — 사용자 id → 1~5. 안 매긴 사람은 없다 */
export type PeopleStars = Readonly<Record<string, number>>;

/** 일정 id → 그 장소의 사람별 별점(일행 것까지). 같은 장소의 일정은 같은 값, 아무도 안 매긴 일정은 없다 */
export function ratingsByItem(
  ratings: readonly PlaceRating[],
  items: readonly Pick<ScheduleItem, "id" | "place">[],
): Readonly<Record<string, PeopleStars>> {
  const byKey = new Map<string, Record<string, number>>();
  for (const r of ratings) {
    const people = byKey.get(r.place_key) ?? {};
    people[r.user_id] = r.stars;
    byKey.set(r.place_key, people);
  }
  return Object.fromEntries(
    items.flatMap((item) => {
      const people = byKey.get(placeKeyOf(item) ?? "");
      return people ? [[item.id, people]] : [];
    }),
  );
}

/** 별을 눌렀을 때 남길 점수 — 같은 점수를 다시 누르면 0(지우기) */
export function nextStars(current: number, tapped: number): number {
  return current === tapped ? 0 : tapped;
}
