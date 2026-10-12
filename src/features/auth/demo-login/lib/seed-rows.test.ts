import { describe, expect, it } from "vitest";

import { dayIndexToDate } from "@/shared/lib/days";

import { toSeedRows } from "./seed-rows";
import { TOKYO_SEED } from "./tokyo-seed";

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
      // 날짜 메모(note)의 메모 줄은 글 아래에 합친다(0029)
      { id: "p1", day_index: 0, position: 0, kind: "note", name: "집합\n07시", trip_id: "t" },
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

  it("장소 메모 글은 줄마다 메모 하나 — 빈 줄은 버리고 「★ 」 줄은 중요, 쓴 시각은 1ms 씩 늦춰 순서를 남긴다", () => {
    const { items, memos } = toSeedRows(
      [
        {
          day_index: 0,
          position: 0,
          kind: "place",
          name: "센소지",
          lat: 1,
          lng: 1,
          memo: "07시\n\n★ 늦으면 무효",
        },
      ],
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

  it("날짜 메모(note)는 메모 줄을 글 아래에 합치고(★ 유지) 메모를 만들지 않는다", () => {
    const { items, memos } = toSeedRows(
      [{ day_index: 0, position: 0, kind: "note", name: "집합", memo: "07시\n★ 늦으면 무효" }],
      { tripId: "t", cityId: "tokyo", newId: () => "n1" },
    );
    expect(items[0]).toMatchObject({ name: "집합\n07시\n★ 늦으면 무효" });
    expect(items[0]).not.toHaveProperty("memo");
    expect(memos).toEqual([]);
  });

  it("flight 줄의 항공편은 항공편 행이 되고 그 줄이 카드로 참조한다", () => {
    const n = (() => {
      let i = 0;
      return () => `f${++i}`;
    })();
    const flight = {
      airline_name: "제주항공",
      airline_code: "7C",
      flight_no: "1181",
      dep_airport: "ICN",
      arr_airport: "NRT",
      dep_date: "2026-10-31",
      dep_time: "07:15",
      arr_date: "2026-10-31",
      arr_time: "09:40",
    };
    const { flights, items } = toSeedRows(
      [{ day_index: 0, position: 0, kind: "flight", name: "ICN 07:15 - NRT 09:40", flight }],
      { tripId: "t", cityId: "tokyo", newId: n },
    );
    expect(flights).toEqual([{ ...flight, id: "f2", trip_id: "t" }]);
    expect(items[0]).toMatchObject({ id: "f1", kind: "flight", flight_id: "f2" });
    expect(items[0]).not.toHaveProperty("flight");
  });
});

describe("TOKYO_SEED", () => {
  it("flight 줄은 모두 항공편이 있고, 탑승일 · 제목 · 설명 · 시각이 항공편과 맞다", () => {
    const rows = TOKYO_SEED.items.filter((i) => i.kind === "flight");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const f = row.flight!;
      expect(f.dep_date).toBe(dayIndexToDate(TOKYO_SEED.trip.start_date, row.day_index));
      expect(row.name).toBe(`${f.dep_airport} ${f.dep_time} - ${f.arr_airport} ${f.arr_time}`);
      expect(row.description).toBe(`${f.airline_name} · ${f.airline_code}${f.flight_no}`);
      expect(row.start_time).toBe(`${f.dep_time}:00`);
    }
  });
});
