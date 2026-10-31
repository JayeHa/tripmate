import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";
import type { Flight } from "@/entities/flight";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Stay } from "@/entities/stay";
import type { Voucher } from "@/entities/voucher";

import { todaySpend, todayVouchers, tonightStay } from "./now-board";

/** 테스트용 바우처 — 연결 칸 하나와 주인 */
function voucher(id: string, owners: string[], link: Partial<Voucher>): Voucher {
  return {
    id,
    owners,
    schedule_item_id: null,
    flight_id: null,
    stay_id: null,
    use_date: null,
    used_at: null,
    ...link,
  } as Voucher;
}

/** 테스트용 숙소 */
function stay(id: string, checkIn: string, checkOut: string): Stay {
  return {
    id,
    check_in_date: checkIn,
    check_out_date: checkOut,
    place: { address: "다이토구 아사쿠사" },
  } as Stay;
}

describe("todayVouchers", () => {
  const day = {
    items: [
      { id: "i2", day_index: 1, position: 2, flight_id: null, stay_id: null },
      { id: "i3", day_index: 2, position: 0, flight_id: null, stay_id: null },
      { id: "fc", day_index: 1, position: 0, flight_id: "f", stay_id: null },
      { id: "sc", day_index: 1, position: 5, flight_id: null, stay_id: "s" },
    ] as ScheduleItem[],
    flights: [{ id: "f", dep_date: "2026-11-01" }] as Flight[],
    stays: [stay("s", "2026-10-31", "2026-11-02")],
    dayIndex: 1,
    date: "2026-11-01",
  };

  it("일정 · 탑승일 · 숙박 기간 · 사용일로 그날 것만, 그날 일정 순서대로(자리 없는 것은 뒤)", () => {
    const list = todayVouchers(
      [
        voucher("etc", ["me"], { use_date: "2026-11-01" }),
        voucher("stay", ["me"], { stay_id: "s" }),
        voucher("other", ["u2"], { schedule_item_id: "i2" }),
        voucher("flight", [], { flight_id: "f" }),
        voucher("nextDay", ["me"], { schedule_item_id: "i3" }),
        voucher("noDate", ["me"], {}),
      ],
      day,
      "me",
    );
    expect(list.map((v) => v.id)).toEqual(["flight", "other", "stay", "etc"]);
  });

  it("같은 일정에 여럿이면 내 것 → 모두 → 일행 것", () => {
    const list = todayVouchers(
      [
        voucher("other", ["u2"], { schedule_item_id: "i2" }),
        voucher("all", [], { schedule_item_id: "i2" }),
        voucher("mine", ["me"], { schedule_item_id: "i2" }),
      ],
      day,
      "me",
    );
    expect(list.map((v) => v.id)).toEqual(["mine", "all", "other"]);
  });

  it("이미 쓴 바우처는 뺀다", () => {
    const list = todayVouchers(
      [
        voucher("used", ["me"], { schedule_item_id: "i2", used_at: "2026-11-01T03:00:00Z" }),
        voucher("left", ["me"], { flight_id: "f" }),
      ],
      day,
      "me",
    );
    expect(list.map((v) => v.id)).toEqual(["left"]);
  });
});

describe("todaySpend", () => {
  const me = { kind: "member" as const, id: "me" };
  const ctx = {
    home: "KRW",
    rates: { JPY: { unit: 100, value: 920 } },
    people: [me, { kind: "member" as const, id: "u2" }],
    me,
  };
  /** 테스트용 비용 — 내가 내고 둘이 반씩 */
  function spend(amount: number, currency: string, spentOn: string): ExpenseWithSplits {
    return {
      id: `${amount}${currency}`,
      amount,
      currency,
      rate: null,
      counted: true,
      paid: true,
      spent_on: spentOn,
      payer_id: "me",
      payer_guest_id: null,
      split_each: false,
      split_mode: "equal",
      splits: [
        { user_id: "me", guest_id: null, share: amount / 2 },
        { user_id: "u2", guest_id: null, share: amount / 2 },
      ],
    } as unknown as ExpenseWithSplits;
  }

  it("그날 비용의 합 · 외화 · 건수 · 내가 쓴 돈", () => {
    const view = todaySpend(
      [spend(1000, "JPY", "2026-11-01"), spend(10000, "KRW", "2026-11-01"), spend(5, "KRW", "x")],
      "2026-11-01",
      ctx,
    );
    expect(view.total).toBe("₩19,200");
    expect(view.sub).toBe("¥1,000 · 2건 · 내가 쓴 돈 ₩9,600");
  });

  it("혼자거나 그날 비용이 없으면 내가 쓴 돈을 뺀다", () => {
    const one = [spend(10000, "KRW", "2026-11-01")];
    expect(todaySpend(one, "2026-11-01", { ...ctx, people: [me] }).sub).toBe("1건");
    expect(todaySpend([], "2026-11-01", ctx)).toEqual({ total: "₩0", sub: "0건" });
  });
});

describe("tonightStay", () => {
  it("체크인 ≤ 그날 < 체크아웃인 숙소와 몇째 밤인지", () => {
    const stays = [stay("s", "2026-10-31", "2026-11-04")];
    expect(tonightStay(stays, "2026-11-01")).toMatchObject({
      sub: "숙박 2/4박 · 다이토구 아사쿠사",
    });
    expect(tonightStay(stays, "2026-11-04")).toBeNull();
  });
});
