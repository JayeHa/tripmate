import type { Tables } from "@/shared/api/supabase/database.types";

/**
 * 장소 — 도시 단위로 내 여러 여행이 함께 쓰는 정보(이름 · 위치 · 카테고리 · 별점 · 설명 · 링크).
 * 만든 사람만 고칠 수 있다(0013). 가이드(#17)가 장소를 따로 다루게 되면 entities/place 로 뺀다.
 */
export type Place = Tables<"places">;

/**
 * 일정 한 줄과 그 일정이 쓰는 장소. place 일정만 `place` 가 있고, note · flight 는 제목을 일정이 직접 갖는다.
 * 이름 · 좌표처럼 둘 중 어디에 있는지 갈리는 값은 model/place.ts 의 itemName · itemCoords 로 읽는다.
 */
export type ScheduleItem = Tables<"schedule_items"> & { place: Place | null };

export type TravelMode = "WALK" | "TRANSIT";

export type RouteLeg = {
  fromId: string;
  toId: string;
  durationSec: number;
  distanceM: number;
};

/** 하루치 일정 사이의 경로. schedule_items 에서 파생되는 read model 이다. */
export type DayRoute = {
  polyline: string | null;
  legs: RouteLeg[];
};
