import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { draftOf, editChanges, moveSelected, removeSelected, reorder } from "./edit-draft";

/** 날 · 순서만 있는 일정 */
const item = (id: string, day_index: number, position: number) =>
  ({ id, day_index, position }) as ScheduleItem;

describe("편집 초안", () => {
  const initial = draftOf([item("b", 0, 1), item("a", 0, 0), item("c", 0, 2), item("d", 1, 0)], 3);

  it("날마다 position 순 id", () => {
    expect(initial).toEqual([["a", "b", "c"], ["d"], []]);
  });

  it("그날 안에서 옮기기 · 고른 것 지우기 · 다른 날 끝으로 옮기기", () => {
    expect(reorder(initial, 0, 2, 0)).toEqual([["c", "a", "b"], ["d"], []]);
    expect(removeSelected(initial, new Set(["b"]))).toEqual([["a", "c"], ["d"], []]);
    expect(moveSelected(initial, new Set(["c", "a"]), 1)).toEqual([["b"], ["d", "a", "c"], []]);
  });

  it("저장할 것: 순서가 달라진 날만 · 사라진 일정", () => {
    expect(editChanges(initial, initial)).toEqual({ days: {}, deletes: [] });
    const moved = moveSelected(reorder(initial, 0, 2, 0), new Set(["a"]), 2);
    expect(editChanges(initial, removeSelected(moved, new Set(["d"])))).toEqual({
      days: { 0: ["c", "b"], 1: [], 2: ["a"] },
      deletes: ["d"],
    });
  });
});
