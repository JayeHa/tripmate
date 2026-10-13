import { describe, expect, it } from "vitest";

import type { Flight } from "@/entities/flight";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Stay } from "@/entities/stay";

import { targetGroups, targetLabel, type TargetSources } from "./target-options";

/** 일정 한 줄 — 장소면 이름 · 카테고리, 아니면 제목 */
function item(patch: Record<string, unknown>) {
  return {
    kind: "place",
    name: null,
    place: null,
    start_time: null,
    flight_id: null,
    ...patch,
  } as unknown as ScheduleItem;
}

const SRC: TargetSources = {
  startDate: "2027-10-31",
  alternatives: [item({ id: "a1", day_index: 1, place: { name: "이치란", category: "food" } })],
  items: [
    item({ id: "p2", day_index: 1, position: 0, place: { name: "모구모구", category: "food" } }),
    item({
      id: "c1",
      kind: "flight",
      day_index: 0,
      position: 0,
      name: "ICN 07:15 - NRT 09:40",
      flight_id: "f1",
    }),
    item({ id: "n1", kind: "note", day_index: 0, position: 1, name: "환전" }),
    item({
      id: "h1",
      day_index: 0,
      position: 3,
      stay_id: "s1",
      place: { name: "호텔 몬토레 긴자", category: "stay" },
    }),
    item({
      id: "p1",
      day_index: 0,
      position: 2,
      start_time: "13:00:00",
      place: { name: "센소지", category: "sight" },
    }),
  ],
  flights: [{ id: "f1", airline_code: "7C", flight_no: "1181", dep_date: "2027-10-31" } as Flight],
  stays: [
    {
      id: "s1",
      check_in_date: "2027-10-31",
      check_out_date: "2027-11-02",
      place: { name: "호텔 몬토레 긴자" },
    } as Stay,
  ],
};

describe("checklist target options", () => {
  it("날마다 일정 카드(항공편 카드는 그 항공편, 메모 · 숙소 밤 카드는 빼고) + 맨 끝 숙소 묶음", () => {
    const groups = targetGroups(SRC, new Set());
    expect(groups.map((g) => [g.key, g.short, g.items.map((i) => i.id)])).toEqual([
      ["0", "day 1", ["flight:f1", "schedule_item:p1"]],
      ["1", "day 2", ["schedule_item:p2"]],
      ["stays", "숙소", ["stay:s1"]],
    ]);
    expect(groups[0].items[1]).toMatchObject({ title: "센소지", meta: "관광명소 · 13:00" });
    expect(groups[2].items[0]).toMatchObject({ meta: "10.31 - 11.2" });
  });

  it("이미 고른 대상은 빼고, 비는 묶음은 없앤다", () => {
    const groups = targetGroups(SRC, new Set(["schedule_item:p2", "stay:s1"]));
    expect(groups.map((g) => g.key)).toEqual(["0"]);
  });

  it("이름 — 일정 「날짜 · 이름」(대체 장소가 됐으면 표시) · 항공 · 숙소, 못 찾으면 「찾을 수 없는 일정」", () => {
    expect(targetLabel({ kind: "schedule_item", id: "p2" }, SRC)).toBe("11.1 · 모구모구");
    expect(targetLabel({ kind: "flight", id: "f1" }, SRC)).toBe("항공 · 7C1181 (10/31)");
    expect(targetLabel({ kind: "stay", id: "s1" }, SRC)).toBe("숙소 · 호텔 몬토레 긴자");
    expect(targetLabel({ kind: "schedule_item", id: "a1" }, SRC)).toBe("11.1 · 이치란 (대체 장소)");
    expect(targetLabel({ kind: "stay", id: "gone" }, SRC)).toBe("찾을 수 없는 일정");
  });
});
