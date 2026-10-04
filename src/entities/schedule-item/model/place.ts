import { z } from "zod";

import { RESERVATION_STATUSES, type ReservationStatus } from "./reservation-status";
import type { ScheduleItem } from "./types";

/**
 * 일정 한 줄의 종류. 번호 마커와 지도 핀은 place 에만 붙는다.
 * flight 는 (e) 항공편 단계에서 자동으로 생기고, 지금은 샘플에만 있다.
 * 이동(move)은 일정이 아니라 장소 쌍에 붙는 기록이다(model/move.ts, 0011).
 */
export const ITEM_KINDS = ["place", "flight", "note"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const PLACE_CATEGORIES = ["sight", "food", "cafe", "shop", "rest", "stay", "air"] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const CATEGORY_LABEL = {
  sight: "관광명소",
  food: "음식점",
  cafe: "카페",
  shop: "쇼핑",
  rest: "휴식",
  stay: "숙소",
  air: "공항·교통",
} satisfies Record<PlaceCategory, string>;

/** 제목 앞 이모지 기본값. 사용자가 고른 이모지가 있으면 그쪽이 먼저다 */
export const CATEGORY_EMOJI = {
  sight: "🏯",
  food: "🍜",
  cafe: "☕",
  shop: "🛍️",
  rest: "♨️",
  stay: "🏨",
  air: "✈️",
} satisfies Record<PlaceCategory, string>;

export const DEFAULT_PLACE_EMOJI = "📍";

/**
 * href 로 그릴 수 있는 링크인지. http(s) 만 허용한다.
 * React 가 `javascript:` 를 막아 주지만, 사용자가 적은 값이라 `data:` 등도 화면에 닿기 전에 거른다.
 */
export function isHttpUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

const httpUrl = z.string().refine(isHttpUrl);
const linkSchema = z.object({ title: z.string(), url: httpUrl });
const alternativeSchema = z.object({
  name: z.string().min(1),
  gmap: httpUrl,
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
export function kindOf(item: Pick<ScheduleItem, "kind">): ItemKind {
  return oneOf(ITEM_KINDS, item.kind) ?? "place";
}

type Coords = { lat: number; lng: number };
type WithPlaceCoords = Pick<ScheduleItem, "kind"> & {
  place: { lat: number | null; lng: number | null } | null;
};

/** 일정의 좌표. 장소에 좌표가 있을 때만(note · flight 는 늘 null) */
export function itemCoords(item: WithPlaceCoords): Coords | null {
  const at = item.place;
  return at?.lat != null && at.lng != null ? { lat: at.lat, lng: at.lng } : null;
}

/**
 * 번호 · 지도 핀 · 경로 경유점이 되는 일정인지. 좌표가 있는 place 만 해당한다.
 * 세 곳이 같은 기준을 써야 선이 핀 없는 곳에서 꺾이지 않는다. 서버 경로 API 도 이것을 쓴다.
 */
export function isMappedPlace(item: WithPlaceCoords): boolean {
  return kindOf(item) === "place" && itemCoords(item) !== null;
}

/** 화면에 보일 이름. place 는 장소 이름, note · flight 는 일정 제목 */
export function itemName(item: Pick<ScheduleItem, "name" | "place">): string {
  return item.place?.name ?? item.name ?? "";
}

/** 예약 상태. 없거나 모르는 값이면 null(「상태 없음」) */
export function statusOf(item: ScheduleItem): ReservationStatus | null {
  return oneOf(RESERVATION_STATUSES, item.status);
}

/** 장소 카테고리. 없거나 모르는 값이면 null */
export function categoryOf(item: ScheduleItem): PlaceCategory | null {
  return oneOf(PLACE_CATEGORIES, item.place?.category ?? null);
}

/**
 * 구글맵 외 링크: 일정 링크(이번 방문의 예약 · 티켓)를 먼저, 장소 링크를 뒤에. 모양이 틀린 원소는 버린다.
 * 일정 링크가 이 일정에만 해당해 더 구체적이라 앞에 둔다.
 */
export function linksOf(item: ScheduleItem): PlaceLink[] {
  return [...arrayOf(linkSchema, item.links), ...arrayOf(linkSchema, item.place?.links)];
}

/** 대체 장소. name · gmap 이 없는 원소는 버린다 */
export function alternativesOf(item: ScheduleItem): Alternative[] {
  return arrayOf(alternativeSchema, item.alternatives);
}
