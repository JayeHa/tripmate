import { describe, expect, it } from "vitest";

import type { Flight } from "@/entities/flight";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Stay } from "@/entities/stay";
import type { Voucher } from "@/entities/voucher";
import type { TargetSources } from "@/features/checklist";
import { dayParts } from "@/shared/lib/days";

import { dayText, ownersText, targetDay, voucherDay } from "./voucher-day";

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

describe("dayText", () => {
  it("연결한 대상의 날짜 글 — 「day N · M.D」, 없으면 「날짜 없음」", () => {
    expect(dayText(SRC.startDate, targetDay({ kind: "stay", id: "s1" }, SRC, 3))).toBe(
      `day 1 · ${dayParts(SRC.startDate, 0).date}`,
    );
    expect(dayText(SRC.startDate, targetDay({ kind: "flight", id: "f2" }, SRC, 3))).toBe(
      "날짜 없음",
    );
  });
});

describe("주인 글", () => {
  it("주인은 이름을 잇고, 비면 모두, 아무도 못 찾으면 알 수 없음", () => {
    const nameOf = (id: string) => ({ u1: "정원", u2: "동규" })[id] ?? null;
    expect(ownersText(["u1", "u2"], nameOf)).toBe("정원, 동규");
    expect(ownersText([], nameOf)).toBe("모두");
    expect(ownersText(["gone"], nameOf)).toBe("알 수 없음");
  });
});
