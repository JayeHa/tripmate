import { describe, expect, it } from "vitest";

import type { Place, ScheduleItem } from "@/entities/schedule-item";

import {
  chooseNew,
  chooseSaved,
  filterSaved,
  savedMeta,
  scheduledKeys,
  toggleChosen,
} from "./chosen";

const place = (patch: Partial<Place>) =>
  ({
    id: "p",
    name: "장소",
    category: null,
    address: null,
    description: null,
    google_place_id: null,
    ...patch,
  }) as Place;

describe("고르기", () => {
  it("저장한 장소는 장소 id, 구글은 구글 id, 이름만은 이름으로 구분한다", () => {
    expect(chooseSaved(place({ id: "a", name: "센료" })).key).toBe("place:a");
    const g = { name: "센소지", google_place_id: "g1", lat: 1, lng: 2, address: null };
    expect(chooseNew(g)).toEqual({ key: "google:g1", name: "센소지", entry: g });
    expect(chooseNew({ ...g, google_place_id: null }).key).toBe("name:센소지");
  });

  it("구글 장소인 저장한 장소는 추천 결과와 같은 key — 두 탭에서 따로 골라 두 번 담기지 않는다", () => {
    const saved = chooseSaved(place({ id: "a", name: "센소지", google_place_id: "g1" }));
    const fromGoogle = chooseNew({
      name: "센소지",
      google_place_id: "g1",
      lat: 1,
      lng: 2,
      address: null,
    });
    expect(saved.key).toBe(fromGoogle.key);
    expect(saved.entry).toEqual({ place_id: "a" });
    expect(toggleChosen([saved], fromGoogle)).toEqual([]);
  });

  it("다시 고르면 빼고, 새로 고르면 끝에 더한다", () => {
    const a = chooseSaved(place({ id: "a" }));
    const b = chooseSaved(place({ id: "b" }));
    expect(toggleChosen([a], b).map((c) => c.key)).toEqual(["place:a", "place:b"]);
    expect(toggleChosen([a, b], a).map((c) => c.key)).toEqual(["place:b"]);
  });
});

describe("scheduledKeys", () => {
  it("일정이 쓰는 장소 id 와 구글 id 를 모은다. note 는 건너뛴다", () => {
    const items = [
      { place: place({ id: "a", google_place_id: "g-a" }) },
      { place: place({ id: "b" }) },
      { place: null },
    ] as ScheduleItem[];
    const keys = scheduledKeys(items);
    expect([...keys.placeIds]).toEqual(["a", "b"]);
    expect([...keys.googleIds]).toEqual(["g-a"]);
  });
});

describe("filterSaved · savedMeta", () => {
  const list = [
    place({ id: "1", name: "긴자 센료", category: "food", address: "도쿄 주오구" }),
    place({ id: "2", name: "센소지", category: "sight", description: "도쿄 최고(最古) 사찰" }),
  ];

  it("카테고리와 검색어(이름 · 주소 · 설명)로 거른다", () => {
    expect(filterSaved(list, "food", "").map((p) => p.id)).toEqual(["1"]);
    expect(filterSaved(list, "all", "사찰").map((p) => p.id)).toEqual(["2"]);
    expect(filterSaved(list, "all", "주오").map((p) => p.id)).toEqual(["1"]);
  });

  it("둘째 줄은 카테고리 · 주소, 둘 다 없으면 null", () => {
    expect(savedMeta(list[0])).toBe("음식점 · 도쿄 주오구");
    expect(savedMeta(place({}))).toBeNull();
  });
});
