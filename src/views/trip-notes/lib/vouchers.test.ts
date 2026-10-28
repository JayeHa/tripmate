import { describe, expect, it } from "vitest";

import type { Flight } from "@/entities/flight";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Stay } from "@/entities/stay";
import type { Voucher } from "@/entities/voucher";
import type { TargetSources } from "@/features/checklist";
import { FILTER_ALL } from "@/shared/ui/filter-select";
import { voucherDay } from "@/widgets/trip-voucher";

import { dayOptions, groupVouchers, matchesFilters, NO_DAY, voucherSubText } from "./vouchers";

const SRC: TargetSources = {
  startDate: "2027-10-31",
  items: [{ id: "c1", day_index: 2 } as ScheduleItem],
  alternatives: [{ id: "a1", day_index: 1 } as ScheduleItem],
  flights: [
    { id: "f1", dep_date: "2027-11-01" } as Flight,
    { id: "f2", dep_date: "2027-12-01" } as Flight,
  ],
  stays: [{ id: "s1", check_in_date: "2027-10-31" } as Stay],
};

/** 바우처 한 줄 */
function v(id: string, patch: Partial<Voucher> = {}): Voucher {
  return {
    id,
    owners: [],
    numbers: [],
    schedule_item_id: null,
    flight_id: null,
    stay_id: null,
    use_date: null,
    ...patch,
  } as Voucher;
}

describe("필터 · 묶음", () => {
  const list = [
    v("etc"),
    v("stay", { stay_id: "s1", owners: ["u2"] }),
    v("flight", { flight_id: "f1", owners: ["u1"] }),
    v("card", { schedule_item_id: "c1" }),
  ];
  const dayOf = (x: Voucher) => voucherDay(x, SRC, 3);
  const all = { who: FILTER_ALL, day: FILTER_ALL, group: FILTER_ALL };
  const ids = (filters: typeof all) =>
    list.filter((x) => matchesFilters(x, filters, dayOf, FILTER_ALL)).map((x) => x.id);

  it("사람 필터는 「모두」 바우처를 포함한다", () => {
    expect(ids({ ...all, who: "u1" })).toEqual(["etc", "flight", "card"]);
  });

  it("날짜 · 종류 필터", () => {
    expect(ids({ ...all, day: "1" })).toEqual(["flight"]);
    expect(ids({ ...all, day: NO_DAY })).toEqual(["etc"]);
    expect(ids({ ...all, group: "stay" })).toEqual(["stay"]);
  });

  it("묶음은 항공편 · 숙소 · 일정 · 기타 순, 빈 묶음은 뺀다", () => {
    expect(groupVouchers(list, null).map((g) => [g.group, g.items.map((x) => x.id)])).toEqual([
      ["flight", ["flight"]],
      ["stay", ["stay"]],
      ["schedule", ["card"]],
      ["etc", ["etc"]],
    ]);
    expect(groupVouchers([v("only")], null).map((g) => g.group)).toEqual(["etc"]);
  });
});

describe("묶음 안의 순서", () => {
  const item = (id: string, day: number, position: number, alternativeOf: string | null = null) =>
    ({ id, day_index: day, position, alternative_of: alternativeOf }) as ScheduleItem;
  const src: TargetSources = {
    startDate: "2026-10-31",
    // day 2: 라멘(0) → 파크(1) → 레스토랑(2), day 1: 공항(0)
    items: [item("airport", 0, 0), item("ramen", 1, 0), item("park", 1, 1), item("rest", 1, 2)],
    alternatives: [item("alt-ramen", 1, 0, "ramen")],
    flights: [
      { id: "f-back", dep_date: "2026-11-04", dep_time: "18:00" } as Flight,
      { id: "f-go", dep_date: "2026-10-31", dep_time: "07:15" } as Flight,
    ],
    stays: [
      { id: "s2", check_in_date: "2026-11-02" } as Stay,
      { id: "s1", check_in_date: "2026-10-31" } as Stay,
    ],
  };
  const ids = (list: Voucher[]) =>
    groupVouchers(list, src).map((g) => [g.group, g.items.map((x) => x.id)]);

  it("일정은 날짜 → 그날 일정 순서, 같은 일정이면 넣은 순서, 대체 장소는 원래 일정 바로 뒤", () => {
    const list = [
      v("park", { schedule_item_id: "park" }),
      v("ramen-1", { schedule_item_id: "ramen" }),
      v("rest", { schedule_item_id: "rest" }),
      v("ramen-2", { schedule_item_id: "ramen" }),
      v("alt", { schedule_item_id: "alt-ramen" }),
      v("airport", { schedule_item_id: "airport" }),
      v("gone", { schedule_item_id: "deleted" }),
    ];
    expect(ids(list)).toEqual([
      ["schedule", ["airport", "ramen-1", "ramen-2", "alt", "park", "rest", "gone"]],
    ]);
  });

  it("묶음이 섞여 들어와도 묶음마다 정렬한다(넣은 순서: 파크 · 라멘 · 항공권 · 레스토랑 · 숙소 · 라멘)", () => {
    const list = [
      v("park", { schedule_item_id: "park" }),
      v("ramen-1", { schedule_item_id: "ramen" }),
      v("go", { flight_id: "f-go" }),
      v("rest", { schedule_item_id: "rest" }),
      v("stay1", { stay_id: "s1" }),
      v("ramen-2", { schedule_item_id: "ramen" }),
    ];
    expect(ids(list)).toEqual([
      ["flight", ["go"]],
      ["stay", ["stay1"]],
      ["schedule", ["ramen-1", "ramen-2", "park", "rest"]],
    ]);
  });

  it("항공편은 출발, 숙소는 체크인, 연결 없음은 사용일(없으면 뒤) 순", () => {
    const list = [
      v("back", { flight_id: "f-back" }),
      v("go", { flight_id: "f-go" }),
      v("stay2", { stay_id: "s2" }),
      v("stay1", { stay_id: "s1" }),
      v("no-date"),
      v("nov2", { use_date: "2026-11-02" }),
      v("nov1", { use_date: "2026-11-01" }),
    ];
    expect(ids(list)).toEqual([
      ["flight", ["go", "back"]],
      ["stay", ["stay1", "stay2"]],
      ["etc", ["nov1", "nov2", "no-date"]],
    ]);
  });
});

describe("줄 글", () => {
  it("보조 글은 연결 이름 · 첫 번호, 둘 다 없으면 안내", () => {
    const numbers = [{ label: "예약번호", owner: "", value: "K7QX2M" }];
    expect(voucherSubText(v("x", { numbers }), "항공 · 7C1181 (11/1)")).toBe(
      "항공 · 7C1181 (11/1) · K7QX2M",
    );
    expect(voucherSubText(v("x", { numbers }), null)).toBe("K7QX2M");
    expect(voucherSubText(v("x"), null)).toBe("연결된 일정 없음");
  });

  it("날짜 옵션은 day 마다, 맨 끝 날짜 없음", () => {
    expect(dayOptions("2027-10-31", 2)).toEqual([
      { value: "0", label: "day 1 · 10.31" },
      { value: "1", label: "day 2 · 11.1" },
      { value: NO_DAY, label: "날짜 없음" },
    ]);
  });
});
