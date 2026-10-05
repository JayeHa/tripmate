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
        id: "p3",
        city_id: "tokyo",
        name: "센소지",
        lat: 1,
        lng: 2,
        category: "sight",
      }),
    ]);
    expect(items).toEqual([
      { id: "p1", day_index: 0, position: 0, kind: "note", name: "집합", trip_id: "t" },
      expect.objectContaining({ id: "p2", trip_id: "t", place_id: "p3", name: null, status: "ok" }),
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
    expect(places.map((p) => p.id)).toEqual(["q2", "q5"]);
    expect(items.map((i) => i.place_id)).toEqual(["q2", "q2", "q5"]);
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

  it("메모 글은 줄마다 메모 하나 — 빈 줄은 버리고 「★ 」 줄은 중요, 쓴 시각은 1ms 씩 늦춰 순서를 남긴다", () => {
    const { items, memos } = toSeedRows(
      [{ day_index: 0, position: 0, kind: "note", name: "집합", memo: "07시\n\n★ 늦으면 무효" }],
      { tripId: "t", cityId: "tokyo", newId: () => "m1", at: new Date("2026-10-05T00:00:00Z") },
    );
    expect(items[0]).not.toHaveProperty("memo");
    expect(memos).toEqual([
      {
        trip_id: "t",
        schedule_item_id: "m1",
        body: "07시",
        starred: false,
        created_at: "2026-10-05T00:00:00.000Z",
      },
      {
        trip_id: "t",
        schedule_item_id: "m1",
        body: "늦으면 무효",
        starred: true,
        created_at: "2026-10-05T00:00:00.001Z",
      },
    ]);
  });
});
