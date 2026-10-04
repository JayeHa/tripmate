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
});
