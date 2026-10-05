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
 * `alternatives` 는 그 일정의 대체 장소 — 장소 칸이 있는 줄로 적고, 시딩할 때 대체 장소 일정 줄이 된다(0024).
 * `memo` 는 시안처럼 줄마다 메모 하나 — 시딩할 때 메모 목록(memos, 0027)이 된다. 「★ 」 줄은 중요
 */
export type SeedItem = Omit<TablesInsert<"schedule_items">, "trip_id" | "place_id"> &
  Partial<PlaceFields> & { alternatives?: SeedAlternative[]; memo?: string | null };

/** 대체 장소 한 줄 — 장소 칸과 이름 · 설명만. 날짜 · 순서는 붙은 일정을 따른다 */
export type SeedAlternative = Pick<SeedItem, "name" | "description" | "emoji"> &
  Partial<PlaceFields>;

type SeedRows = {
  places: TablesInsert<"places">[];
  items: TablesInsert<"schedule_items">[];
  /** 대체 장소 줄. 붙을 일정이 먼저 있어야 해서(트리거가 확인한다) items 다음에 넣는다 */
  alternatives: TablesInsert<"schedule_items">[];
  /** 메모. 붙을 일정이 먼저 있어야 해서(FK) items 다음에 넣는다 */
  memos: TablesInsert<"memos">[];
};

type SeedOptions = {
  tripId: string;
  cityId: string;
  newId: () => string;
  /** 메모를 쓴 시각의 기준. 한 번에 넣어도 줄 순서가 남게 메모마다 1ms 씩 늦춘다 */
  at?: Date;
};

/** 시안 메모 글을 메모 줄들로 — 빈 줄은 버리고, 「★ 」로 시작하면 중요(★ 는 뗀다) */
function memoLinesOf(memo: string | null | undefined): { body: string; starred: boolean }[] {
  return (memo ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ body: line.replace(/^★\s*/, ""), starred: line.startsWith("★") }));
}

/**
 * 시안 줄들을 장소 · 일정 행으로 나눈다. 장소 id 는 미리 만들어(`newId`) 일정이 바로 참조한다.
 * 이름과 좌표가 같은 place 줄은 장소 하나를 함께 쓴다(숙소처럼 여러 날 나오는 곳 — 장소 1 · 일정 N).
 * 장소 정보는 처음 나온 줄의 값을 쓴다. 일정 id 도 미리 만들어 대체 장소 줄 · 메모가 참조한다.
 */
export function toSeedRows(
  seed: SeedItem[],
  { tripId, cityId, newId, at = new Date() }: SeedOptions,
): SeedRows {
  const places = new Map<string, TablesInsert<"places">>();
  const alternatives: TablesInsert<"schedule_items">[] = [];
  const memos: TablesInsert<"memos">[] = [];

  /** 장소 칸으로 장소를 찾거나 만들어 id 를 돌려준다 */
  function placeIdOf(row: SeedAlternative): string {
    const { lat, lng, address, category, rating, review_count, hours, gmap_url, links } = row;
    const key = `${row.name ?? ""}|${lat ?? ""}|${lng ?? ""}`;
    let place = places.get(key);
    if (!place) {
      place = {
        id: newId(),
        city_id: cityId,
        name: row.name ?? "",
        description: row.description,
        emoji: row.emoji,
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
    return place.id ?? "";
  }

  const items = seed.map((row): TablesInsert<"schedule_items"> => {
    const { lat, lng, address, category, rating, review_count, hours, gmap_url, links, ...rest } =
      row;
    const { alternatives: alts = [], memo, ...item } = rest;
    const id = newId();
    for (const line of memoLinesOf(memo)) {
      memos.push({
        trip_id: tripId,
        schedule_item_id: id,
        ...line,
        created_at: new Date(at.getTime() + memos.length).toISOString(),
      });
    }
    const placeFields = {
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
    if ((item.kind ?? "place") !== "place") return { ...item, id, trip_id: tripId };
    alts.forEach((alt, position) =>
      alternatives.push({
        trip_id: tripId,
        day_index: item.day_index,
        position,
        kind: "place",
        place_id: placeIdOf(alt),
        alternative_of: id,
      }),
    );
    return {
      ...item,
      id,
      trip_id: tripId,
      place_id: placeIdOf({
        ...placeFields,
        name: item.name,
        description: item.description,
        emoji: item.emoji,
      }),
      // 장소 일정의 제목 · 설명 · 아이콘은 장소 쪽 값을 쓴다
      name: null,
      description: null,
      emoji: null,
    };
  });
  return { places: [...places.values()], items, alternatives, memos };
}
