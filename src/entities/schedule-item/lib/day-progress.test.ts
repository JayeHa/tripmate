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

  it("들른 수와 지난 시각 중 큰 쪽, 장소 수를 넘지 않는다", () => {
    expect(nextPlaceIndex(ITEMS, 1, 0, null)).toBe(0);
    expect(nextPlaceIndex(ITEMS, 1, 1, "09:00")).toBe(1);
    expect(nextPlaceIndex(ITEMS, 1, 0, "15:30")).toBe(2);
    expect(nextPlaceIndex(ITEMS, 1, 9, null)).toBe(3);
  });
});

describe("dayProgress", () => {
  it("앞의 날은 모두, 오늘은 다음 장소보다 앞 줄(항공편 · 메모 포함), 대체 장소는 원래 일정을 따른다", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, 2, null);
    expect(nextId).toBe("c");
    expect([...past].sort()).toEqual(["a", "b", "b-alt", "flight", "note", "y1"]);
  });

  it("아직 아무 데도 안 갔으면 다음 장소 앞의 항공편만", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, 0, null);
    expect(nextId).toBe("a");
    expect([...past].sort()).toEqual(["flight", "y1"]);
  });

  it("다 마쳤으면 그날 모두, 다음 장소는 없다", () => {
    const { past, nextId } = dayProgress(ITEMS, 1, 3, null);
    expect(nextId).toBeNull();
    expect(past.has("c")).toBe(true);
    expect(past.has("t1")).toBe(false);
  });
});
