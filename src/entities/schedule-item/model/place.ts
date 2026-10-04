import { z } from "zod";

import { RESERVATION_STATUSES, type ReservationStatus } from "./reservation-status";
import type { ScheduleItem } from "./types";

/**
 * 일정 한 줄의 종류. 번호 마커와 지도 핀은 place 에만 붙는다.
 * flight 는 (e) 항공편 단계에서 자동으로 생기고, 지금은 샘플에만 있다.
 */
export const ITEM_KINDS = ["place", "flight", "note", "move"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const PLACE_CATEGORIES = ["sight", "food", "cafe", "shop", "stay", "air"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const CATEGORY_LABEL = {
  sight: "관광명소",
  food: "음식점",
  cafe: "카페",
  shop: "쇼핑",
  stay: "숙소",
  air: "공항·교통",
} satisfies Record<PlaceCategory, string>;

/** 제목 앞 이모지 기본값. 사용자가 고른 이모지가 있으면 그쪽이 먼저다 */
export const CATEGORY_EMOJI = {
  sight: "🏯",
  food: "🍜",
  cafe: "☕",
  shop: "🛍️",
  stay: "🏨",
  air: "✈️",
} satisfies Record<PlaceCategory, string>;

export const DEFAULT_PLACE_EMOJI = "📍";

const linkSchema = z.object({ title: z.string(), url: z.string().min(1) });
const alternativeSchema = z.object({
  name: z.string().min(1),
  gmap: z.string().min(1),
  sub: z.string().optional(),
  hours: z.string().optional(),
});

export type PlaceLink = z.infer<typeof linkSchema>;
export type Alternative = z.infer<typeof alternativeSchema>;

/*
 * DB 의 text · jsonb 칸을 좁힌다. text 는 check 제약이 값을 보장하지만 타입 생성기는 string 으로 내보내고,
 * jsonb 는 배열이라는 것만 보장한다. 모양이 맞지 않는 원소는 화면을 깨뜨리지 않게 버린다.
 */

/** 허용 목록에 있는 값이면 그 값, 아니면 null */
function oneOf<T extends string>(values: readonly T[], value: string | null): T | null {
  return values.find((v) => v === value) ?? null;
}

/** 배열에서 스키마에 맞는 원소만 남긴다. 배열이 아니면 빈 배열 */
function arrayOf<T>(schema: z.ZodType<T>, value: unknown): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) => {
    const parsed = schema.safeParse(v);
    return parsed.success ? [parsed.data] : [];
  });
}

/** 일정 종류. 모르는 값이면 place 로 본다 */
export function kindOf(item: ScheduleItem): ItemKind {
  return oneOf(ITEM_KINDS, item.kind) ?? "place";
}

/** 예약 상태. 없거나 모르는 값이면 null(「상태 없음」) */
export function statusOf(item: ScheduleItem): ReservationStatus | null {
  return oneOf(RESERVATION_STATUSES, item.status);
}

/** 장소 카테고리. 없거나 모르는 값이면 null */
export function categoryOf(item: ScheduleItem): PlaceCategory | null {
  return oneOf(PLACE_CATEGORIES, item.category);
}

/** 구글맵 외 추가 링크. 모양이 틀린 원소는 버린다 */
export function linksOf(item: ScheduleItem): PlaceLink[] {
  return arrayOf(linkSchema, item.links);
}

/** 대체 장소. name · gmap 이 없는 원소는 버린다 */
export function alternativesOf(item: ScheduleItem): Alternative[] {
  return arrayOf(alternativeSchema, item.alternatives);
}
