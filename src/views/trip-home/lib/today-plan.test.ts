import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { boardDayIndex, todayPlan } from "./today-plan";

/** 테스트용 장소 일정 — 위치가 있어 번호가 붙는다 */
function place(id: string, day: number, pos: number, time: string | null = null): ScheduleItem {
  return {
    id,
    day_index: day,
    position: pos,
    kind: "place",
    name: null,
    status: null,
    start_time: time ? `${time}:00` : null,
    description: null,
    alternative_of: null,
    place: { name: id, lat: 35.7, lng: 139.8, category: "sight" },
  } as ScheduleItem;
}

describe("boardDayIndex", () => {
  it("여행 중이면 오늘, 전이면 첫날, 뒤면 마지막 날", () => {
    expect(boardDayIndex("2026-10-31", "2026-11-04", "2026-11-01")).toBe(1);
    expect(boardDayIndex("2026-10-31", "2026-11-04", "2026-10-01")).toBe(0);
    expect(boardDayIndex("2026-10-31", "2026-11-04", "2026-12-01")).toBe(4);
  });
});

describe("todayPlan", () => {
  const day = [place("a", 1, 0, "09:00"), place("b", 1, 1), place("c", 1, 2, "13:30")];
  const tomorrow = place("t", 2, 0, "17:30");
  const items = [...day, tomorrow, place("other", 0, 0)];

  it("장소가 없는 날은 자유 일정", () => {
    expect(todayPlan(items, 3, {}, null)).toEqual({ kind: "free" });
  });

  it("표시한 마지막 장소 다음 일정이 다음 장소, 이후는 두 곳", () => {
    const plan = todayPlan(items, 1, { a: "visited" }, null);
    expect(plan).toMatchObject({
      kind: "next",
      index: 1,
      label: "다음 장소 · 오늘 2번째",
      place: { id: "b", num: 2, sub: "관광명소" },
    });
    expect(plan.kind === "next" && plan.after.map((a) => [a.id, a.sub])).toEqual([
      ["c", "13:30 · 관광명소"],
    ]);
  });

  it("첫 일정 · 시각 있는 일정의 파란 글", () => {
    expect(todayPlan([place("x", 0, 0)], 0, {}, null)).toMatchObject({ label: "오늘 첫 일정" });
    expect(todayPlan(items, 1, {}, null)).toMatchObject({ label: "다음 장소 · 09:00" });
  });

  it("시각이 지난 일정이 있으면 그 앞의 일정은 건너뛴다", () => {
    expect(todayPlan(items, 1, {}, "14:32")).toMatchObject({ index: 2 });
    expect(todayPlan(items, 1, {}, "08:00")).toMatchObject({ index: 0 });
  });

  it("다 들르면 내일 첫 일정을 알려 준다 — 되돌릴 곳은 마지막으로 표시한 장소", () => {
    expect(todayPlan(items, 1, { b: "visited", c: "skipped" }, null)).toEqual({
      kind: "done",
      tomorrow: "내일 첫 일정 · day 3 t 17:30",
      reopenId: "c",
    });
    expect(todayPlan(items, 2, { t: "visited" }, null)).toEqual({
      kind: "done",
      tomorrow: null,
      reopenId: "t",
    });
  });
});
