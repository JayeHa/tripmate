import type { PlaceCategory, PlaceSubtype } from "@/entities/schedule-item";

// 비용 입력도 쓰게 옮겼다 — 이 폼의 import 는 그대로 둔다
export { categoryFromGoogle } from "@/entities/schedule-item";
export { googleMapsUrl } from "@/shared/lib/google-places";

/** 구글 장소를 고르면 채우는 칸 */
export type Autofill = {
  name: string;
  category: PlaceCategory | null;
  subtype: PlaceSubtype | null;
  gmap: string;
};

/** 폼 값 중 자동으로 채우는 칸과, 마지막으로 화면이 채운 값 */
type AutofillFields = Autofill & { auto: Autofill };

/** 칸이 비었거나 화면이 채운 값 그대로인지(사용자가 손대지 않았는지) */
function untouched<T>(current: T, auto: T): boolean {
  return !current || current === auto || (typeof current === "string" && current.trim() === auto);
}

/**
 * 위치 검색으로 구글 장소를 고른 뒤의 이름 · 카테고리 · 메뉴/종류 · 구글맵 링크. 칸마다 비었거나 화면이 채운 값(앞서 고른 장소의 값) 그대로면
 * 고른 장소의 값으로 바꾸고, 사용자가 고친 칸은 둔다. 이미 가진 장소를 다시 담으면 적은 칸을 덮어쓰므로(create_place_schedule),
 * 다른 지점의 이름 · 링크가 그 장소를 쓰는 모든 여행에 남지 않게 한다. 고른 장소의 카테고리 · 종류를 모르면(null) 그 칸은 그대로
 */
export function fillFromPick(v: AutofillFields, pick: Autofill): AutofillFields {
  const name = untouched(v.name, v.auto.name) ? pick.name : v.name;
  const category =
    pick.category && untouched(v.category, v.auto.category) ? pick.category : v.category;
  const subtype = pick.subtype && untouched(v.subtype, v.auto.subtype) ? pick.subtype : v.subtype;
  const gmap = untouched(v.gmap, v.auto.gmap) ? pick.gmap : v.gmap;
  return { name, category, subtype, gmap, auto: pick };
}

/**
 * 고른 구글 장소와의 연결이 끊겼을 때(지도를 끌거나 주소로 옮김 · 새로 등록) 자동으로 채운 구글맵 링크를 지운다 —
 * 핀은 다른 곳인데 링크는 앞서 고른 장소를 가리키게 된다. 사용자가 적은 링크 · 이름 · 카테고리는 둔다
 */
export function dropPickedLink(
  v: Pick<AutofillFields, "gmap" | "auto">,
): Pick<AutofillFields, "gmap" | "auto"> {
  if (!v.auto.gmap || v.gmap !== v.auto.gmap) return v;
  return { gmap: "", auto: { ...v.auto, gmap: "" } };
}

/**
 * 링크가 그 구글 장소로 화면이 만든 구글맵 링크(googleMapsUrl)인지. 장소 이름은 나중에 바뀔 수 있어 장소 id 만 본다.
 * 저장된 장소를 고칠 때 이 링크를 자동으로 채운 값으로 여겨, 위치 · 고른 장소가 바뀌면 함께 지우거나 바꾸게 한다
 */
export function isPickedMapsUrl(url: string | null, placeId: string | null): url is string {
  if (!url || !placeId) return false;
  try {
    const u = new URL(url);
    return (
      u.origin === "https://www.google.com" &&
      u.pathname === "/maps/search/" &&
      u.searchParams.get("query_place_id") === placeId
    );
  } catch {
    return false;
  }
}

/** 구글 장소 종류(정확히 같은 이름) → 메뉴 · 종류. 모르는 종류는 고르지 않는다(사용자가 고른다) */
const GOOGLE_TYPE_SUBTYPE: Partial<Record<string, PlaceSubtype>> = {
  sushi_restaurant: "sushi",
  ramen_restaurant: "ramen",
  noodle_shop: "ramen",
  donburi_restaurant: "tendon",
  tempura_restaurant: "tendon",
  yakiniku_restaurant: "yakiniku",
  barbecue_restaurant: "yakiniku",
  steak_house: "yakiniku",
  yakitori_restaurant: "yakitori",
  japanese_izakaya_restaurant: "izakaya",
  izakaya: "izakaya",
  tonkatsu_restaurant: "yoshoku",
  japanese_curry_restaurant: "yoshoku",
  okonomiyaki_restaurant: "monja",
  teppanyaki_restaurant: "monja",
  cafe: "sweets",
  coffee_shop: "sweets",
  tea_house: "sweets",
  bakery: "sweets",
  dessert_shop: "sweets",
  dessert_restaurant: "sweets",
  confectionery: "sweets",
  ice_cream_shop: "sweets",
  donut_shop: "sweets",
  sporting_goods_store: "running",
  toy_store: "character",
  drugstore: "drugstore",
  pharmacy: "drugstore",
  discount_store: "drugstore",
  supermarket: "drugstore",
  grocery_store: "drugstore",
  convenience_store: "drugstore",
  duty_free_store: "dutyfree",
  spa: "onsen",
  sauna: "onsen",
  public_bath: "onsen",
  massage: "massage",
};

/** 구글 장소 종류로 고를 메뉴 · 종류 — 대표 종류(맨 앞)부터 처음 맞는 것, 없으면 null */
export function subtypeFromGoogle(types: string[]): PlaceSubtype | null {
  for (const type of types) {
    const subtype = GOOGLE_TYPE_SUBTYPE[type];
    if (subtype) return subtype;
  }
  return null;
}
