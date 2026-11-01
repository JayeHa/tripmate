import type { PlaceCategory } from "../model/place";

/** 구글 장소 종류(정확히 같은 이름) → 장소 폼 카테고리 */
const GOOGLE_TYPE_CATEGORY: Partial<Record<string, PlaceCategory>> = {
  cafe: "cafe",
  coffee_shop: "cafe",
  tea_house: "cafe",
  bakery: "cafe",
  dessert_shop: "cafe",
  ice_cream_shop: "cafe",
  confectionery: "cafe",
  donut_shop: "cafe",
  restaurant: "food",
  food: "food",
  meal_takeaway: "food",
  bar: "food",
  pub: "food",
  izakaya: "food",
  food_court: "food",
  spa: "rest",
  sauna: "rest",
  massage: "rest",
  public_bath: "rest",
  wellness_center: "rest",
  lodging: "stay",
  hotel: "stay",
  motel: "stay",
  hostel: "stay",
  inn: "stay",
  guest_house: "stay",
  bed_and_breakfast: "stay",
  tourist_attraction: "sight",
  museum: "sight",
  park: "sight",
  art_gallery: "sight",
  amusement_park: "sight",
  aquarium: "sight",
  zoo: "sight",
  place_of_worship: "sight",
  church: "sight",
  hindu_temple: "sight",
  buddhist_temple: "sight",
  shinto_shrine: "sight",
  historical_landmark: "sight",
  cultural_landmark: "sight",
  monument: "sight",
  observation_deck: "sight",
  national_park: "sight",
  garden: "sight",
  botanical_garden: "sight",
  shopping_mall: "shop",
  department_store: "shop",
  market: "shop",
  supermarket: "shop",
  store: "shop",
};

/** 종류 하나 → 카테고리. 정확히 같은 이름을 먼저, 없으면 꼬리(`*_restaurant` 음식점 · `*_hotel` 숙소 · `*_store` 쇼핑) */
function categoryOfType(type: string): PlaceCategory | null {
  const exact = GOOGLE_TYPE_CATEGORY[type];
  if (exact) return exact;
  if (type.endsWith("_restaurant")) return "food";
  if (type.endsWith("_hotel")) return "stay";
  if (type.endsWith("_store")) return "shop";
  return null;
}

/**
 * 구글 장소 종류로 고를 카테고리. 대표 종류(맨 앞)부터 보고 처음 맞는 것. 공항 · 역처럼 폼에 없는 종류뿐이면 null(고르지 않음).
 * 카페가 「food」 도 함께 갖는 식이라 순서가 뜻을 정한다 — 구글은 대표 종류를 primaryType 으로 따로 준다
 */
export function categoryFromGoogle(types: string[]): PlaceCategory | null {
  for (const type of types) {
    const category = categoryOfType(type);
    if (category) return category;
  }
  return null;
}
