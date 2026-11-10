import { describe, expect, it } from "vitest";

import type { RouteDay, TimelineRow } from "@/entities/schedule-item";

import {
  nextStopId,
  placeProgress,
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
    expect(map.get("f")).toEqual({ tone: null, reached: true });
    expect(map.get("b")).toEqual({ tone: "current", reached: true });
    expect(nextStopId(route, tones)).toBe("b");
  });

  it("누를 수 없는 날은 다녀왔어요 자리가 없다", () => {
    expect(nextStopId(route, recordOfRoute(route, {}, "other"))).toBeNull();
  });

  it("레일 진행은 장소만 센다(패스는 다녀온 곳이 아니다)", () => {
    const rows = [row("a", "place"), row("f", "flight"), row("n", "note"), row("b", "place")];
    expect(placeProgress(rows, { a: "visited", b: "skipped", f: "visited" })).toEqual({
      done: 1,
      total: 2,
    });
  });
});
