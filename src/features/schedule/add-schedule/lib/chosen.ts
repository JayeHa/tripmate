import {
  CATEGORY_LABEL,
  type Place,
  type PlaceCategory,
  type ScheduleEntry,
  type ScheduleItem,
} from "@/entities/schedule-item";

/**
 * 하단 트레이에 고른 한 곳. `key` 로 같은 곳을 두 번 고르지 않게 한다 —
 * 구글 장소면 구글 장소 id(저장한 장소여도), 아니면 저장한 장소는 장소 id, 이름만 입력은 이름.
 * 저장한 장소와 추천(구글) 결과가 같은 곳이면 같은 key 라, 두 탭에서 따로 골라 두 번 담기지 않는다.
 */
export type Chosen = { key: string; name: string; entry: ScheduleEntry };

/** 저장한 장소의 고르기 key. 구글 장소면 추천 결과와 같은 key 를 쓴다 */
export function savedKey(place: Pick<Place, "id" | "google_place_id">): string {
  return place.google_place_id ? `google:${place.google_place_id}` : `place:${place.id}`;
}

/** 저장한 장소를 트레이에 담을 모양으로. 담을 때는 그 장소를 그대로 쓴다 */
export function chooseSaved(place: Pick<Place, "id" | "name" | "google_place_id">): Chosen {
  return { key: savedKey(place), name: place.name, entry: { place_id: place.id } };
}

/** 「내 숙소」 를 트레이에 담을 모양으로. 담으면 그 숙소의 연결 카드가 된다 */
export function chooseStay(stay: { id: string; place: { name: string } }): Chosen {
  return { key: `stay:${stay.id}`, name: stay.place.name, entry: { stay_id: stay.id } };
}

/** 구글 검색 · 이름만 입력으로 고른 곳을 트레이에 담을 모양으로 */
export function chooseNew(entry: Extract<ScheduleEntry, { name: string }>): Chosen {
  const key = entry.google_place_id ? `google:${entry.google_place_id}` : `name:${entry.name}`;
  return { key, name: entry.name, entry };
}

/** 이미 고른 것이면 빼고, 아니면 끝에 더한다(고른 순서대로 담긴다) */
export function toggleChosen(list: Chosen[], one: Chosen): Chosen[] {
  return list.some((c) => c.key === one.key)
    ? list.filter((c) => c.key !== one.key)
    : [...list, one];
}

/** 여행 일정에 이미 있는 장소 · 구글 장소. 「일정에 있음」 배지용(날짜 무관) */
export function scheduledKeys(items: ScheduleItem[]) {
  const placeIds = new Set<string>();
  const googleIds = new Set<string>();
  for (const it of items) {
    if (!it.place) continue;
    placeIds.add(it.place.id);
    if (it.place.google_place_id) googleIds.add(it.place.google_place_id);
  }
  return { placeIds, googleIds };
}

export type CategoryFilter = PlaceCategory | "all";

/** 「저장한 장소」 목록 거르기 — 카테고리, 그리고 검색어가 이름 · 주소 · 설명에 들어 있는지 */
export function filterSaved(places: Place[], category: CategoryFilter, query: string): Place[] {
  const q = query.trim().toLowerCase();
  return places.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (!q || [p.name, p.address, p.description].some((v) => v?.toLowerCase().includes(q))),
  );
}

/** 저장한 장소 줄의 둘째 줄: 「음식점 · 도쿄도 주오구 …」. 비면 null */
export function savedMeta(place: Pick<Place, "category" | "address">): string | null {
  const label =
    place.category && place.category in CATEGORY_LABEL
      ? CATEGORY_LABEL[place.category as PlaceCategory]
      : null;
  return [label, place.address].filter(Boolean).join(" · ") || null;
}
