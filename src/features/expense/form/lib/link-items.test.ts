import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { expenseCategoryOf, linkRows } from "./link-items";

type Patch = Partial<Omit<ScheduleItem, "place">> & {
  category?: string | null;
  lat?: number | null;
};

/** 일정 한 줄. 장소면 이름 · 카테고리 · 좌표를 장소 쪽에 둔다 — 화면이 받는 모양 그대로 */
function item({ category = null, lat = 1, ...patch }: Patch): ScheduleItem {
  const row = {
    id: patch.name ?? crypto.randomUUID(),
    trip_id: "t",
    day_index: 0,
    position: 0,
    kind: "place",
    place_id: null,
    name: "장소",
    description: null,
    emoji: null,
    start_time: null,
    status: null,
    alternative_of: null,
    links: [],
    created_by: null,
    created_at: "",
    updated_at: "",
    ...patch,
  };
  if (row.kind !== "place") return { ...row, place: null };
  return {
    ...row,
    name: null,
    place: { name: row.name, category, lat, lng: lat === null ? null : 1 } as ScheduleItem["place"],
  };
}

const all = { day: "all" as const, category: "all" as const, query: "" };

describe("linkRows", () => {
  const items = [
    item({ name: "라멘", category: "food", day_index: 1, position: 1, start_time: "12:30:00" }),
    item({ name: "신주쿠", category: "sight", day_index: 0, position: 1 }),
    item({ name: "메모", kind: "note", day_index: 0, position: 2 }),
    item({ name: "숙소", category: "stay", day_index: 0, position: 0, lat: null }),
    item({ name: "KE703", kind: "flight", day_index: 0, position: 3 }),
    item({ name: "카페", category: "cafe", day_index: 1, position: 0 }),
  ];
  const alternatives = [
    item({ name: "츠케멘", category: "food", day_index: 1, alternative_of: "라멘" }),
  ];

  it("날짜 · 순서대로, 메모는 빼고, 대체 장소는 붙은 일정 바로 아래 — 번호는 그날 좌표 있는 장소만", () => {
    expect(linkRows(items, alternatives, all).map((r) => [r.name, r.n, r.sub])).toEqual([
      ["숙소", null, "day 1 · 숙소"],
      ["신주쿠", 1, "day 1 · 관광명소"],
      ["KE703", null, "day 1 · 항공편"],
      ["카페", 1, "day 2 · 카페"],
      ["라멘", 2, "day 2 · 음식점 · 12:30"],
      ["츠케멘", null, "day 2 · 대체 장소 · 음식점"],
    ]);
  });

  it("날짜를 고르면 그날만, 줄에 날짜를 빼고 — 걸러도 번호는 그대로", () => {
    const rows = linkRows(items, alternatives, { ...all, day: 1 });
    expect(rows.map((r) => [r.name, r.n, r.sub])).toEqual([
      ["카페", 1, "카페"],
      ["라멘", 2, "음식점 · 12:30"],
      ["츠케멘", null, "대체 장소 · 음식점"],
    ]);
  });

  it("종류 — 식당은 음식점 · 카페, 항공은 항공편", () => {
    expect(linkRows(items, alternatives, { ...all, category: "food" }).map((r) => r.name)).toEqual([
      "카페",
      "라멘",
      "츠케멘",
    ]);
    expect(
      linkRows(items, alternatives, { ...all, category: "flight" }).map((r) => r.name),
    ).toEqual(["KE703"]);
  });

  it("검색어가 있으면 날짜 필터를 보지 않고 모든 날에서 찾는다", () => {
    const rows = linkRows(items, alternatives, { day: 0, category: "all", query: "멘" });
    expect(rows.map((r) => r.name)).toEqual(["라멘", "츠케멘"]);
    expect(rows[0].sub).toBe("day 2 · 음식점 · 12:30");
  });
});

describe("expenseCategoryOf", () => {
  it("일정 종류를 비용 카테고리로 — 맞는 것이 없으면 null", () => {
    expect(expenseCategoryOf(item({ category: "cafe" }))).toBe("food");
    expect(expenseCategoryOf(item({ category: "sight" }))).toBe("activity");
    expect(expenseCategoryOf(item({ category: "stay" }))).toBe("lodging");
    expect(expenseCategoryOf(item({ kind: "flight" }))).toBe("flight");
    expect(expenseCategoryOf(item({ category: "rest" }))).toBeNull();
    expect(expenseCategoryOf(item({ category: null }))).toBeNull();
  });
});
