import { describe, expect, it } from "vitest";

import type { Flight } from "@/entities/flight";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Stay } from "@/entities/stay";
import type { Voucher } from "@/entities/voucher";
import type { TargetSources } from "@/features/checklist";
import { FILTER_ALL } from "@/shared/ui/filter-select";

import {
  dayOptions,
  groupVouchers,
  matchesFilters,
  NO_DAY,
  ownersText,
  voucherDay,
  voucherSubText,
} from "./vouchers";

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

describe("voucherDay", () => {
  it("일정 카드 · 대체 장소는 그 날, 항공편은 탑승일, 숙소는 체크인 날, 연결이 없으면 사용일", () => {
    expect(voucherDay(v("x", { schedule_item_id: "c1" }), SRC, 3)).toBe(2);
    expect(voucherDay(v("x", { schedule_item_id: "a1" }), SRC, 3)).toBe(1);
    expect(voucherDay(v("x", { flight_id: "f1" }), SRC, 3)).toBe(1);
    expect(voucherDay(v("x", { stay_id: "s1" }), SRC, 3)).toBe(0);
    expect(voucherDay(v("x", { use_date: "2027-11-02" }), SRC, 3)).toBe(2);
  });

  it("기간 밖 · 못 찾은 대상 · 날짜 없음은 null", () => {
    expect(voucherDay(v("x", { flight_id: "f2" }), SRC, 3)).toBeNull();
    expect(voucherDay(v("x", { schedule_item_id: "gone" }), SRC, 3)).toBeNull();
    expect(voucherDay(v("x"), SRC, 3)).toBeNull();
  });
});

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

  it("주인은 이름을 잇고, 비면 모두, 아무도 못 찾으면 알 수 없음", () => {
    const nameOf = (id: string) => ({ u1: "정원", u2: "동규" })[id] ?? null;
    expect(ownersText(["u1", "u2"], nameOf)).toBe("정원, 동규");
    expect(ownersText([], nameOf)).toBe("모두");
    expect(ownersText(["gone"], nameOf)).toBe("알 수 없음");
  });

  it("날짜 옵션은 day 마다, 맨 끝 날짜 없음", () => {
    expect(dayOptions("2027-10-31", 2)).toEqual([
      { value: "0", label: "day 1 · 10.31" },
      { value: "1", label: "day 2 · 11.1" },
      { value: NO_DAY, label: "날짜 없음" },
    ]);
  });
});
