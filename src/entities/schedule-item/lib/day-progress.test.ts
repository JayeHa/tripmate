import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "../model/types";
import { dayPlaces, dayProgress, nextPlaceIndex } from "./day-progress";

/** 테스트용 일정 한 줄 */
function item(
  id: string,
  day: number,
  position: number,
  patch: Partial<ScheduleItem> = {},
): ScheduleItem {
  return {
    id,
    day_index: day,
    position,
    kind: "place",
    alternative_of: null,
    start_time: null,
    ...patch,
  } as ScheduleItem;
}

const ITEMS = [
  item("y1", 0, 0),
  item("flight", 1, 0, { kind: "flight" }),
  item("a", 1, 1, { start_time: "10:00:00" }),
  item("note", 1, 2, { kind: "note" }),
  item("b", 1, 3),
  item("c", 1, 4, { start_time: "15:00:00" }),
  item("b-alt", 1, 0, { alternative_of: "b" }),
  item("t1", 2, 0),
];

describe("dayPlaces · nextPlaceIndex", () => {
  it("그날 장소만 순서대로(대체 장소 · 메모 · 항공편 제외)", () => {
    expect(dayPlaces(ITEMS, 1).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("표시가 없는 첫 장소 — 다 표시했으면 장소 수", () => {
    expect(nextPlaceIndex(ITEMS, 1, {})).toBe(0);
    expect(nextPlaceIndex(ITEMS, 1, { a: "visited" })).toBe(1);
    expect(nextPlaceIndex(ITEMS, 1, { a: "visited", b: "skipped", c: "visited" })).toBe(3);
  });

  it("뒤의 장소를 먼저 표시해도 앞의 표시 없는 장소가 다음이다 — 시각으로 건너뛰지 않는다", () => {
    expect(nextPlaceIndex(ITEMS, 1, { b: "visited" })).toBe(0);
    expect(nextPlaceIndex(ITEMS, 1, { a: "visited", c: "skipped" })).toBe(1);
  });

  it("다른 날의 표시는 보지 않는다", () => {
    expect(nextPlaceIndex(ITEMS, 1, { y1: "visited", t1: "visited" })).toBe(0);
  });
});

describe("dayProgress", () => {
  it("표시한 줄만 다녀온 것 — 표시 없는 앞의 날 · 항공편 · 메모는 넣지 않고, 대체 장소는 원래 일정을 따른다", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, { b: "visited" });
    expect(nextId).toBe("a");
    expect([...past.keys()].sort()).toEqual(["b", "b-alt"]);
  });

  it("아무 표시도 없으면 다녀온 줄이 없다", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, {});
    expect(nextId).toBe("a");
    expect(past.size).toBe(0);
  });

  it("다 표시했으면 다음 장소는 없다", () => {
    const { nextId } = dayProgress(ITEMS, 1, { a: "visited", b: "visited", c: "visited" });
    expect(nextId).toBeNull();
  });

  it("패스한 줄은 skipped — 대체 장소도 따른다, 지난 날도 표시를 보고, 뒤의 날은 넣지 않는다", () => {
    const { past } = dayProgress(ITEMS, 1, {
      y1: "skipped",
      a: "visited",
      b: "skipped",
      c: "visited",
      t1: "skipped",
    });
    expect(past.get("y1")).toBe("skipped");
    expect(past.get("b")).toBe("skipped");
    expect(past.get("b-alt")).toBe("skipped");
    expect(past.get("a")).toBe("done");
    expect(past.get("c")).toBe("done");
    expect(past.has("t1")).toBe(false);
  });
});
