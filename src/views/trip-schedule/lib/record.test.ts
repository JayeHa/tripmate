import { describe, expect, it } from "vitest";

import { recordDay, recordStops } from "./record";

const stops = [
  { id: "a", place: true },
  { id: "f", place: false },
  { id: "b", place: true },
  { id: "c", place: true },
];

describe("recordStops", () => {
  it("표시 없는 첫 장소가 지금 여기, 그 앞은 지나왔다", () => {
    const r = recordStops(stops, { a: "visited" }, "today");
    expect(r.map((s) => s.tone)).toEqual(["done", "plan", "current", "todo"]);
    expect(r.map((s) => s.next)).toEqual([false, false, true, false]);
    expect(r.map((s) => s.reached)).toEqual([true, true, true, false]);
  });

  it("패스한 곳은 남은 모양이지만 지나간 것으로 본다", () => {
    const r = recordStops(stops, { a: "visited", b: "skipped" }, "today");
    expect(r.map((s) => s.tone)).toEqual(["done", "plan", "todo", "current"]);
    expect(r.map((s) => s.reached)).toEqual([true, true, true, true]);
  });

  it("다 마쳤으면 지금 여기가 없고 모두 지나왔다", () => {
    const r = recordStops(stops, { a: "visited", b: "visited", c: "skipped" }, "today");
    expect(r.some((s) => s.tone === "current" || s.next)).toBe(false);
    expect(r.every((s) => s.reached)).toBe(true);
  });

  it("누를 수 없는 날은 지금 여기가 없고 다녀온 곳만 지나왔다", () => {
    const r = recordStops(stops, { b: "visited" }, "other");
    expect(r.map((s) => s.tone)).toEqual(["todo", "plan", "done", "todo"]);
    expect(r.map((s) => s.reached)).toEqual([false, false, true, false]);
    expect(r.some((s) => s.next)).toBe(false);
  });

  it("지난 날은 지금 여기 모양 없이 표시 없는 첫 장소에 버튼만", () => {
    const r = recordStops(stops, { a: "visited" }, "past");
    expect(r.map((s) => s.tone)).toEqual(["done", "plan", "todo", "todo"]);
    expect(r.map((s) => s.next)).toEqual([false, false, true, false]);
    expect(r.map((s) => s.reached)).toEqual([true, true, true, false]);
  });
});

describe("recordDay", () => {
  it("오늘 · 오늘 앞 · 오늘 뒤", () => {
    expect(recordDay(2, 2)).toBe("today");
    expect(recordDay(0, 2)).toBe("past");
    expect(recordDay(3, 2)).toBe("other");
  });

  it("여행 중이 아니면 그 밖", () => {
    expect(recordDay(0, null)).toBe("other");
  });
});
