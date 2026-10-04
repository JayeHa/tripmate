import type { TablesInsert } from "@/shared/api/supabase/database.types";

type PlaceFields = Pick<
  TablesInsert<"places">,
  | "lat"
  | "lng"
  | "address"
  | "category"
  | "rating"
  | "review_count"
  | "hours"
  | "gmap_url"
  | "links"
>;

/**
 * 시안 데이터 한 줄. 시안은 장소와 일정을 나누지 않아서 place 줄에 장소 칸이 함께 있다.
 * 시딩할 때 toSeedRows 가 장소 · 일정으로 나눈다. trip_id · place_id 는 그때 붙는다.
 */
export type SeedItem = Omit<TablesInsert<"schedule_items">, "trip_id" | "place_id"> &
  Partial<PlaceFields>;

type SeedRows = {
  places: TablesInsert<"places">[];
  items: TablesInsert<"schedule_items">[];
};

/**
 * 시안 줄들을 장소 · 일정 행으로 나눈다. 장소 id 는 미리 만들어(`newId`) 일정이 바로 참조한다.
 * 이름과 좌표가 같은 place 줄은 장소 하나를 함께 쓴다(숙소처럼 여러 날 나오는 곳 — 장소 1 · 일정 N).
 * 장소 정보는 처음 나온 줄의 값을 쓴다.
 */
export function toSeedRows(
  seed: SeedItem[],
  { tripId, cityId, newId }: { tripId: string; cityId: string; newId: () => string },
): SeedRows {
  const places = new Map<string, TablesInsert<"places">>();
  const items = seed.map((row): TablesInsert<"schedule_items"> => {
    const { lat, lng, address, category, rating, review_count, hours, gmap_url, links, ...item } =
      row;
    if ((item.kind ?? "place") !== "place") return { ...item, trip_id: tripId };

    const key = `${item.name ?? ""}|${lat ?? ""}|${lng ?? ""}`;
    let place = places.get(key);
    if (!place) {
      place = {
        id: newId(),
        city_id: cityId,
        name: item.name ?? "",
        description: item.description,
        emoji: item.emoji,
        lat,
        lng,
        address,
        category,
        rating,
        review_count,
        hours,
        gmap_url,
        links,
      };
      places.set(key, place);
    }
    return {
      ...item,
      trip_id: tripId,
      place_id: place.id,
      // 장소 일정의 제목 · 설명 · 아이콘은 장소 쪽 값을 쓴다
      name: null,
      description: null,
      emoji: null,
    };
  });
  return { places: [...places.values()], items };
}
