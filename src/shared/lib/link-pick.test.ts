import { describe, expect, it } from "vitest";

import {
  filterLinkGroups,
  findLinkPick,
  linkPickCategories,
  type LinkPickGroup,
} from "./link-pick";

const sight = { value: "sight", label: "관광" };
const food = { value: "food", label: "식비" };

const groups: LinkPickGroup[] = [
  {
    key: "0",
    short: "day 1",
    date: "10.31 (토)",
    items: [
      { id: "a", title: "센소지", meta: "관광명소 · 10:00", category: sight },
      { id: "b", title: "KE703", meta: "항공편", category: null },
    ],
  },
  {
    key: "1",
    short: "day 2",
    date: "11.1 (일)",
    items: [{ id: "c", title: "이치란 라멘", meta: "음식점", category: food }],
  },
];

/** 묶음별 줄 id */
function ids(result: LinkPickGroup[]): string[][] {
  return result.map((g) => g.items.map((i) => i.id));
}

describe("filterLinkGroups", () => {
  it("필터가 없으면 그대로", () => {
    expect(ids(filterLinkGroups(groups, { day: null, category: null, query: "" }))).toEqual([
      ["a", "b"],
      ["c"],
    ]);
  });

  it("날짜 · 카테고리를 함께 건다 — 줄이 없는 묶음은 빠진다", () => {
    expect(ids(filterLinkGroups(groups, { day: "0", category: "sight", query: "" }))).toEqual([
      ["a"],
    ]);
    expect(filterLinkGroups(groups, { day: "0", category: "food", query: "" })).toEqual([]);
  });

  it("검색어가 있으면 날짜 필터는 보지 않고, 제목 · 둘째 줄에서 찾는다", () => {
    expect(ids(filterLinkGroups(groups, { day: "0", category: null, query: "라멘" }))).toEqual([
      ["c"],
    ]);
    expect(ids(filterLinkGroups(groups, { day: null, category: null, query: "항공" }))).toEqual([
      ["b"],
    ]);
    expect(ids(filterLinkGroups(groups, { day: null, category: null, query: "ke7" }))).toEqual([
      ["b"],
    ]);
  });
});

describe("linkPickCategories · findLinkPick", () => {
  it("있는 카테고리만 처음 나온 순서대로", () => {
    expect(linkPickCategories(groups)).toEqual([sight, food]);
  });

  it("고른 줄과 그 묶음, 없으면 null", () => {
    expect(findLinkPick(groups, "c")?.group.short).toBe("day 2");
    expect(findLinkPick(groups, "x")).toBeNull();
    expect(findLinkPick(groups, null)).toBeNull();
  });
});
