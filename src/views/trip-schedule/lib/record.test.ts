import { describe, expect, it } from "vitest";

import type { RouteDay, TimelineRow } from "@/entities/schedule-item";

import {
  nextStopId,
  placeProgress,
  planStops,
  recordDay,
  recordOfRoute,
  recordStops,
  routeMapRecord,
} from "./record";

const stops = [
  { id: "a", place: true },
  { id: "f", place: false },
  { id: "b", place: true },
  { id: "c", place: true },
];

describe("recordStops", () => {
  it("표시 없는 첫 장소가 지금 여기, 다녀온 역으로 들어오는 구간만 지나왔다", () => {
    const r = recordStops(stops, { a: "visited" }, "today");
    expect(r.map((s) => s.tone)).toEqual(["done", "plan", "current", "todo"]);
    expect(r.map((s) => s.next)).toEqual([false, false, true, false]);
    expect(r.map((s) => s.reached)).toEqual([true, false, false, false]);
  });

  it("패스는 따로 모양을 두고, 그 역으로 들어오는 구간은 지나오지 않았다", () => {
    const r = recordStops(stops, { a: "visited", b: "skipped" }, "today");
    expect(r.map((s) => s.tone)).toEqual(["done", "plan", "pass", "current"]);
    expect(r.map((s) => s.reached)).toEqual([true, false, false, false]);
  });

  it("순서와 상관없다 — 뒤를 먼저 다녀와도 앞의 표시 없는 곳이 지금 여기, 항공편은 그 뒤를 다녀왔으면 지나왔다", () => {
    const r = recordStops(stops, { c: "visited" }, "today");
    expect(r.map((s) => s.tone)).toEqual(["current", "plan", "todo", "done"]);
    expect(r.map((s) => s.reached)).toEqual([false, true, false, true]);
  });

  it("다 마쳤으면 지금 여기가 없다", () => {
    const r = recordStops(stops, { a: "visited", b: "visited", c: "skipped" }, "today");
    expect(r.some((s) => s.tone === "current" || s.next)).toBe(false);
  });

  it("누를 수 없는 날은 지금 여기 · 버튼이 없다", () => {
    const r = recordStops(stops, { b: "visited" }, "other");
    expect(r.map((s) => s.tone)).toEqual(["todo", "plan", "done", "todo"]);
    expect(r.some((s) => s.next)).toBe(false);
  });

  it("지난 날은 지금 여기 모양 없이 표시 없는 첫 장소에 버튼만", () => {
    const r = recordStops(stops, { a: "visited" }, "past");
    expect(r.map((s) => s.tone)).toEqual(["done", "plan", "todo", "todo"]);
    expect(r.map((s) => s.next)).toEqual([false, false, true, false]);
  });
});

describe("planStops", () => {
  it("다녀옴은 ✓ 표식 · 패스는 회색 줄, 흐림은 여행 중 오늘만", () => {
    const marks = { a: "visited", b: "skipped", f: "visited" } as const;
    const today = planStops(stops, marks, "today");
    expect(today.map((s) => s.tone)).toEqual(["visited", "plan", "pass", "plan"]);
    expect(today.map((s) => s.dim)).toEqual([true, false, false, false]);
    expect(planStops(stops, marks, "past").some((s) => s.dim)).toBe(false);
    expect(planStops(stops, marks, "other").some((s) => s.dim)).toBe(false);
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

/** 테스트용 줄 — id 와 종류만 */
function row(id: string, kind: "place" | "flight" | "note"): TimelineRow {
  return { item: { id }, kind } as unknown as TimelineRow;
}

/** 테스트용 하루 노선도 — 역 줄만 */
function routeOf(rows: TimelineRow[]): RouteDay {
  return { stops: rows.map((r) => ({ row: r })) } as unknown as RouteDay;
}

describe("기록 모드 지도 · 레일", () => {
  const route = routeOf([row("a", "place"), row("f", "flight"), row("b", "place")]);

  it("지도에는 장소별 모양 · 지나왔는지, 항공편은 계획 모양(null)", () => {
    const tones = recordOfRoute(route, { a: "visited" }, "today");
    const map = routeMapRecord(route, tones);
    expect(map.get("a")).toEqual({ tone: "done", reached: true });
    expect(map.get("f")).toEqual({ tone: null, reached: false });
    expect(map.get("b")).toEqual({ tone: "current", reached: false });
    expect(nextStopId(route, tones)).toBe("b");
  });

  it("누를 수 없는 날은 다녀왔어요 자리가 없다", () => {
    expect(nextStopId(route, recordOfRoute(route, {}, "other"))).toBeNull();
  });

  it("지도는 패스를 아직 남은 모양으로", () => {
    const tones = recordOfRoute(route, { a: "skipped" }, "today");
    expect(routeMapRecord(route, tones).get("a")).toEqual({ tone: "todo", reached: false });
  });

  it("진행은 장소만 센다 — 다녀옴 · 패스 따로", () => {
    const rows = [row("a", "place"), row("f", "flight"), row("n", "note"), row("b", "place")];
    expect(placeProgress(rows, { a: "visited", b: "skipped", f: "visited" })).toEqual({
      done: 1,
      passed: 1,
      total: 2,
    });
  });
});
