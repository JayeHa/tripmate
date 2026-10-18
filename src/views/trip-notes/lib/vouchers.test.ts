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
    expect(groupVouchers(list).map((g) => [g.group, g.items.map((x) => x.id)])).toEqual([
      ["flight", ["flight"]],
      ["stay", ["stay"]],
      ["schedule", ["card"]],
      ["etc", ["etc"]],
    ]);
    expect(groupVouchers([v("only")]).map((g) => g.group)).toEqual(["etc"]);
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
