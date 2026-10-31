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

  it("표시한 마지막 장소 다음과 지난 시각 중 큰 쪽, 장소 수를 넘지 않는다", () => {
    expect(nextPlaceIndex(ITEMS, 1, {}, null)).toBe(0);
    expect(nextPlaceIndex(ITEMS, 1, { a: "visited" }, "09:00")).toBe(1);
    expect(nextPlaceIndex(ITEMS, 1, {}, "15:30")).toBe(2);
    expect(nextPlaceIndex(ITEMS, 1, { c: "skipped" }, null)).toBe(3);
  });

  it("뒤의 장소를 표시하면 그 앞의 표시 없는 장소는 지나간 것으로 본다", () => {
    expect(nextPlaceIndex(ITEMS, 1, { b: "visited" }, null)).toBe(2);
  });

  it("다른 날의 표시는 보지 않는다", () => {
    expect(nextPlaceIndex(ITEMS, 1, { y1: "visited", t1: "visited" }, null)).toBe(0);
  });
});

describe("dayProgress", () => {
  it("앞의 날은 모두, 오늘은 다음 장소보다 앞 줄(항공편 · 메모 포함), 대체 장소는 원래 일정을 따른다", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, { b: "visited" }, null);
    expect(nextId).toBe("c");
    expect([...past.keys()].sort()).toEqual(["a", "b", "b-alt", "flight", "note", "y1"]);
  });

  it("아직 아무 데도 안 갔으면 다음 장소 앞의 항공편만", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, {}, null);
    expect(nextId).toBe("a");
    expect([...past.keys()].sort()).toEqual(["flight", "y1"]);
  });

  it("다 마쳤으면 그날 모두, 다음 장소는 없다", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, { c: "visited" }, null);
    expect(nextId).toBeNull();
    expect(past.has("c")).toBe(true);
    expect(past.has("t1")).toBe(false);
  });

  it("패스한 줄은 skipped — 대체 장소도 따른다, 지난 날도 표시를 보고, 뒤의 날은 넣지 않는다", () => {
    const { past } = dayProgress(
      ITEMS,
      1,
      { y1: "skipped", b: "skipped", c: "visited", t1: "skipped" },
      null,
    );
    expect(past.get("y1")).toBe("skipped");
    expect(past.get("b")).toBe("skipped");
    expect(past.get("b-alt")).toBe("skipped");
    expect(past.get("a")).toBe("done");
    expect(past.get("c")).toBe("done");
    expect(past.has("t1")).toBe(false);
  });
});
