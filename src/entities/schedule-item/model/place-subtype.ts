import type { PlaceCategory } from "./place";
import type { Place } from "./types";

/** 장소의 메뉴 · 종류(0071) — 카테고리 아래 한 단계. DB check 와 같은 값 */
export const PLACE_SUBTYPES = [
  "sushi",
  "ramen",
  "tendon",
  "unagi",
  "yakiniku",
  "yakitori",
  "izakaya",
  "yoshoku",
  "monja",
  "sweets",
  "running",
  "character",
  "drugstore",
  "dutyfree",
  "onsen",
  "massage",
  "foot",
] as const;
export type PlaceSubtype = (typeof PLACE_SUBTYPES)[number];

export const SUBTYPE_LABEL = {
  sushi: "🍣 스시",
  ramen: "🍜 라멘 · 면",
  tendon: "🍤 텐동 · 덮밥",
  unagi: "🐟 장어",
  yakiniku: "🥩 고기 · 야키니쿠",
  yakitori: "🍢 야키토리 · 꼬치",
  izakaya: "🍶 이자카야",
  yoshoku: "🍛 돈카츠 · 카레 · 양식",
  monja: "🥘 몬자 · 철판",
  sweets: "🍰 카페 · 디저트 · 빵",
  running: "🏃 러닝 · 스포츠",
  character: "🐹 캐릭터 · 굿즈",
  drugstore: "🛒 드럭 · 잡화 · 마트",
  dutyfree: "✈️ 면세 · 공항",
  onsen: "♨️ 온천 · 스파",
  massage: "💆 마사지",
  foot: "🦶 발 마사지",
} satisfies Record<PlaceSubtype, string>;

const FOOD: readonly PlaceSubtype[] = PLACE_SUBTYPES.slice(0, 10);

/** 카테고리마다 고를 수 있는 종류(보이는 순서). 음식점 · 카페는 같은 식당 목록, 관광지 · 숙소 · 공항은 없다 */
const BY_CATEGORY: Partial<Record<PlaceCategory, readonly PlaceSubtype[]>> = {
  food: FOOD,
  cafe: FOOD,
  shop: ["running", "character", "drugstore", "dutyfree"],
  rest: ["onsen", "massage", "foot"],
};

/** 이 카테고리에서 고를 수 있는 종류. 없으면 빈 배열(칸 · 필터를 숨긴다) */
export function subtypesFor(category: string | null): readonly PlaceSubtype[] {
  return BY_CATEGORY[category as PlaceCategory] ?? [];
}

/** 저장할 종류 — 그 카테고리에 있는 값만, 아니면 null(카테고리를 바꾸면 맞지 않는 종류가 남지 않게) */
export function subtypeForCategory(
  category: string | null,
  subtype: string | null,
): PlaceSubtype | null {
  return subtypesFor(category).find((s) => s === subtype) ?? null;
}

/** 장소에 보일 종류 — 저장된 값(카테고리에 맞을 때), 없으면 null(「기타」) */
export function placeSubtypeOf(place: Pick<Place, "category" | "subtype">): PlaceSubtype | null {
  return subtypeForCategory(place.category, place.subtype);
}
