import { describe, expect, it } from "vitest";

import { toSeedRows } from "./seed-rows";

const opts = (() => {
  let n = 0;
  return { tripId: "t", cityId: "tokyo", newId: () => `p${++n}` };
})();

describe("toSeedRows", () => {
  it("place 줄은 장소 + 장소를 참조하는 일정으로, note 는 일정만", () => {
    const { places, items } = toSeedRows(
      [
        { day_index: 0, position: 0, kind: "note", name: "집합", memo: "07시" },
        {
          day_index: 0,
          position: 1,
          kind: "place",
          name: "센소지",
          lat: 1,
          lng: 2,
          category: "sight",
          status: "ok",
        },
      ],
      opts,
    );
    expect(places).toEqual([
      expect.objectContaining({
        id: "p1",
        city_id: "tokyo",
        name: "센소지",
        lat: 1,
        lng: 2,
        category: "sight",
      }),
    ]);
    expect(items).toEqual([
      { day_index: 0, position: 0, kind: "note", name: "집합", memo: "07시", trip_id: "t" },
      expect.objectContaining({ trip_id: "t", place_id: "p1", name: null, status: "ok" }),
    ]);
    expect(items[1]).not.toHaveProperty("lat");
  });

  it("이름과 좌표가 같은 place 줄은 장소 하나를 함께 쓴다", () => {
    const { places, items } = toSeedRows(
      [
        { day_index: 0, position: 0, kind: "place", name: "호텔", lat: 1, lng: 1 },
        { day_index: 1, position: 0, kind: "place", name: "호텔", lat: 1, lng: 1 },
        { day_index: 1, position: 1, kind: "place", name: "호텔", lat: 9, lng: 9 },
      ],
      {
        tripId: "t",
        cityId: "tokyo",
        newId: (() => {
          let n = 0;
          return () => `q${++n}`;
        })(),
      },
    );
    expect(places.map((p) => p.id)).toEqual(["q1", "q2"]);
    expect(items.map((i) => i.place_id)).toEqual(["q1", "q1", "q2"]);
  });

  it("대체 장소는 장소 + 붙은 일정 id 를 참조하는 줄로, 일정과 따로 돌려준다", () => {
    const { places, items, alternatives } = toSeedRows(
      [
        {
          day_index: 2,
          position: 6,
          kind: "place",
          name: "머메이드 커피",
          lat: 1,
          lng: 1,
          alternatives: [{ name: "아시츠보", lat: 2, lng: 2, description: "발 지압" }],
        },
      ],
      {
        tripId: "t",
        cityId: "tokyo",
        newId: (() => {
          let n = 0;
          return () => `r${++n}`;
        })(),
      },
    );
    expect(items).toEqual([expect.objectContaining({ id: "r1", place_id: "r3" })]);
    expect(items[0]).not.toHaveProperty("alternatives");
    expect(places.map((p) => [p.id, p.name])).toEqual([
      ["r2", "아시츠보"],
      ["r3", "머메이드 커피"],
    ]);
    expect(alternatives).toEqual([
      {
        trip_id: "t",
        day_index: 2,
        position: 0,
        kind: "place",
        place_id: "r2",
        alternative_of: "r1",
      },
    ]);
  });
});
