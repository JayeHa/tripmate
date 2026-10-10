import { describe, expect, it } from "vitest";

import {
  linkedCardCount,
  nightsOf,
  pushedOutCount,
  stayDayRange,
  stayMomentLabel,
  stayRangeLabel,
} from "./stay-days";

const trip = { start_date: "2027-10-31", end_date: "2027-11-04" };
const dates = { check_in_date: "2027-11-01", check_out_date: "2027-11-03" };
/** 연결 카드 줄 */
const card = (day: number, stay = "s1", alt: string | null = null) => ({
  stay_id: stay,
  alternative_of: alt,
  day_index: day,
});

describe("stay-days", () => {
  it("박 수 · 날 번호 범위(여행 기간으로 자른다, 밖이면 null)", () => {
    expect(nightsOf(dates)).toBe(2);
    expect(stayDayRange(dates, trip)).toEqual({ from: 1, to: 3 });
    expect(
      stayDayRange({ check_in_date: "2027-10-29", check_out_date: "2027-11-01" }, trip),
    ).toEqual({ from: 0, to: 1 });
    expect(
      stayDayRange({ check_in_date: "2027-11-10", check_out_date: "2027-11-12" }, trip),
    ).toBeNull();
  });

  it("연결 카드 수는 타임라인 줄만", () => {
    expect(linkedCardCount([card(1), card(2, "s1", "x"), card(3, "s2")], "s1")).toBe(1);
  });

  it("밀려나는 카드 — 옛 범위에 있고 새 범위에 없는 날만, 범위 밖으로 옮긴 카드는 세지 않는다", () => {
    const items = [card(0), card(1), card(2), card(3)];
    const shorter = { check_in_date: "2027-11-01", check_out_date: "2027-11-02" };
    expect(pushedOutCount(items, "s1", dates, shorter, trip)).toBe(1);
    const away = { check_in_date: "2027-11-10", check_out_date: "2027-11-12" };
    expect(pushedOutCount(items, "s1", dates, away, trip)).toBe(3);
    expect(pushedOutCount(items, "s1", away, dates, trip)).toBe(0);
  });

  it("기간 글", () => {
    expect(stayRangeLabel(dates)).toBe("11.1(월) – 11.3(수) · 2박");
    expect(stayMomentLabel("2027-11-01", "15:00:00")).toBe("11.1(월) 15:00");
    expect(stayMomentLabel("2027-11-01", null)).toBe("11.1(월)");
  });
});
