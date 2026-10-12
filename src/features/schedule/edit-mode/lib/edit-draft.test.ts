import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import {
  draftOf,
  editChanges,
  exceedsTripDays,
  isSelectable,
  keepLive,
  moveSelected,
  removeSelected,
  reorder,
  summariesOf,
  summaryChanges,
  tripDaysChange,
} from "./edit-draft";

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

  it("편집 중 기간이 늘어 초안에 없는 날로 옮기면 날을 늘려 담는다(지우지 않는다)", () => {
    const moved = moveSelected(initial, new Set(["b"]), 4);
    expect(moved).toEqual([["a", "c"], ["d"], [], [], ["b"]]);
    expect(editChanges(initial, moved).deletes).toEqual([]);
  });

  it("저장할 것: 순서가 달라진 날만 · 사라진 일정", () => {
    expect(editChanges(initial, initial)).toEqual({ days: {}, deletes: [] });
    const moved = moveSelected(reorder(initial, 0, 2, 0), new Set(["a"]), 2);
    expect(editChanges(initial, removeSelected(moved, new Set(["d"])))).toEqual({
      days: { 0: ["c", "b"], 1: [], 2: ["a"] },
      deletes: ["d"],
    });
  });

  it("편집 중 일행이 지운 일정(b)은 초안 · 처음 모두에서 빼서 저장 목록에 넣지 않는다", () => {
    const live = new Set(["a", "c", "d"]);
    const draft = keepLive(reorder(initial, 0, 2, 0), live);
    expect(draft).toEqual([["c", "a"], ["d"], []]);
    expect(editChanges(keepLive(initial, live), draft)).toEqual({
      days: { 0: ["c", "a"] },
      deletes: [],
    });
  });
});

describe("하루 요약", () => {
  it("저장된 배열을 날 수만큼 글로 — 없는 날 · null 은 빈 글", () => {
    expect(summariesOf([null, "라멘"], 3)).toEqual(["", "라멘", ""]);
  });

  it("공백만 다르면 그대로, 달라진 날만 다듬어서", () => {
    const initial = ["도착", "", "라멘"];
    expect(summaryChanges(initial, ["도착 ", "", "라멘"])).toEqual({});
    expect(summaryChanges(initial, ["", " 파크 ", "라멘"])).toEqual({ 0: "", 1: "파크" });
  });
});

describe("편집 중 여행 기간이 바뀜", () => {
  it("초안 · 하루 요약이 지금 기간보다 길면(기간이 줄었다) true, 같거나 늘었으면 false", () => {
    const draft = [["a"], ["b"], [], []];
    expect(exceedsTripDays(draft, ["", "", "", ""], 3)).toBe(true);
    expect(exceedsTripDays(draft, ["", "", "", ""], 4)).toBe(false);
    expect(exceedsTripDays(draft, ["", "", "", ""], 5)).toBe(false);
    // 늘어난 날로 옮겨 초안이 길어진 뒤 다시 줄면
    expect(exceedsTripDays([...draft, ["c"]], ["", "", "", ""], 4)).toBe(true);
  });

  it("초안은 맞는데 보고 있던 날만 사라졌으면 마지막 날로, 둘 다 괜찮으면 null", () => {
    const draft = [["a"], [], [], []];
    const sums = ["", "", "", ""];
    expect(tripDaysChange(draft, sums, 3, 1)).toBe("close");
    // 6일로 늘었을 때 day 6(5) 을 보다가 다시 4일로 — 초안은 4일 그대로
    expect(tripDaysChange(draft, sums, 4, 5)).toBe("lastDay");
    expect(tripDaysChange(draft, sums, 4, 2)).toBeNull();
  });
});

describe("isSelectable", () => {
  it("항공편 카드(연결된 줄)만 잠그고, 연결 없는 옛 flight 줄은 고른다", () => {
    expect(isSelectable({ flight_id: "f1" })).toBe(false);
    expect(isSelectable({ flight_id: null })).toBe(true);
  });
});
