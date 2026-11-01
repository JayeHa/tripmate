import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "../model/types";
import { dayCities, itemsByDay } from "./day-cities";

/** 그 도시 장소의 일정(도시가 null 이면 장소 없는 일정) — 쓰는 칸만 채운다 */
const at = (city: string | null) => ({ place: city ? { city_id: city } : null });

describe("dayCities", () => {
  it("그날 장소가 가장 많은 도시, 같으면 먼저 나온 도시", () => {
    const days = [
      [at("osaka"), at("kyoto"), at("kyoto")],
      [at("kyoto"), at("osaka")],
    ];
    expect(dayCities(days, "osaka")).toEqual(["kyoto", "kyoto"]);
  });

  it("장소가 없는 날은 전날 도시, 첫날이면 여행의 첫 도시", () => {
    expect(dayCities([[at(null)], [at("kyoto")], []], "osaka")).toEqual([
      "osaka",
      "kyoto",
      "kyoto",
    ]);
    expect(dayCities([[]], null)).toEqual([null]);
  });
});

describe("itemsByDay", () => {
  it("날마다 나누고 대체 장소 · 기간 밖의 날은 뺀다", () => {
    const item = (id: string, day: number, alt: string | null = null) =>
      ({ id, day_index: day, alternative_of: alt }) as unknown as ScheduleItem;
    const days = itemsByDay([item("a", 0), item("b", 1), item("c", 1, "b"), item("d", 3)], 2);
    expect(days.map((d) => d.map((i) => i.id))).toEqual([["a"], ["b"]]);
  });
});
