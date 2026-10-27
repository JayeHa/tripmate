import { describe, expect, it } from "vitest";

import type { ScheduleItem } from "@/entities/schedule-item";

import { expenseCategoryOf, linkGroups } from "./link-items";

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
    stay_id: null,
    flight_id: null,
    pinned_by: null,
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

describe("linkGroups", () => {
  const items = [
    item({ name: "라멘", category: "food", day_index: 1, position: 1, start_time: "12:30:00" }),
    item({ name: "신주쿠", category: "sight", day_index: 0, position: 1 }),
    item({ name: "메모", kind: "note", day_index: 0, position: 2 }),
    item({ name: "숙소", category: "stay", day_index: 0, position: 0, lat: null }),
    item({ name: "KE703", kind: "flight", day_index: 0, position: 3 }),
    item({ name: "온천", category: "rest", day_index: 3, position: 0 }),
  ];
  const alternatives = [
    item({ name: "츠케멘", category: "food", day_index: 1, alternative_of: "라멘" }),
  ];
  const groups = linkGroups("2026-10-31", items, alternatives);

  it("날짜 묶음 · 순서대로, 메모는 빼고, 대체 장소는 붙은 일정 바로 아래 — 일정이 없는 날은 묶음이 없다", () => {
    expect(groups.map((g) => [g.key, g.short, g.date])).toEqual([
      ["0", "day 1", "10.31 (토)"],
      ["1", "day 2", "11.1 (일)"],
      ["3", "day 4", "11.3 (화)"],
    ]);
    expect(groups.map((g) => g.items.map((i) => [i.title, i.meta]))).toEqual([
      [
        ["숙소", "숙소"],
        ["신주쿠", "관광명소"],
        ["KE703", "항공편"],
      ],
      [
        ["라멘", "음식점 · 12:30"],
        ["츠케멘", "대체 장소 · 음식점"],
      ],
      [["온천", "휴식"]],
    ]);
  });

  it("카테고리 필터 값 · 썸네일 — 항공편은 항공, 휴식은 필터 없음", () => {
    const flat = groups.flatMap((g) => g.items);
    const of = (title: string) => flat.find((i) => i.title === title);
    expect(of("KE703")).toMatchObject({ category: { value: "flight" }, thumbCategory: "air" });
    expect(of("라멘")).toMatchObject({ category: { value: "food", label: "식비" } });
    expect(of("온천")).toMatchObject({ category: null, thumbCategory: "rest" });
  });
});

describe("expenseCategoryOf", () => {
  it("일정 종류를 비용 카테고리로 — 휴식은 관광, 카테고리가 없으면 null", () => {
    expect(expenseCategoryOf(item({ category: "cafe" }))).toBe("food");
    expect(expenseCategoryOf(item({ category: "sight" }))).toBe("activity");
    expect(expenseCategoryOf(item({ category: "stay" }))).toBe("lodging");
    expect(expenseCategoryOf(item({ kind: "flight" }))).toBe("flight");
    expect(expenseCategoryOf(item({ category: "rest" }))).toBe("activity");
    expect(expenseCategoryOf(item({ category: null }))).toBeNull();
  });
});
