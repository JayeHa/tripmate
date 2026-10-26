import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits, Settlement } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";

import { postSettleBand, tripSummary } from "./post-board";

const me = { kind: "member" as const, id: "me" };
const u2 = { kind: "member" as const, id: "u2" };
const home = "KRW";
const rates = { JPY: { unit: 100, value: 920 } };

/** 테스트용 비용 — payer 가 내고 둘이 반씩 */
function spend(amount: number, payer: string, currency = "KRW"): ExpenseWithSplits {
  return {
    id: `${payer}${amount}`,
    amount,
    currency,
    rate: null,
    counted: true,
    paid: true,
    payer_id: payer,
    payer_guest_id: null,
    split_each: false,
    splits: [
      { user_id: "me", guest_id: null, share: amount / 2 },
      { user_id: "u2", guest_id: null, share: amount / 2 },
    ],
  } as unknown as ExpenseWithSplits;
}

/** 테스트용 송금 기록 */
function sent(from: string, to: string, amount: number): Settlement {
  return {
    id: `${from}-${to}`,
    from_user_id: from,
    from_guest_id: null,
    to_user_id: to,
    to_guest_id: null,
    amount,
  } as Settlement;
}

describe("tripSummary", () => {
  it("총 지출 · 1인당 · 같은 장소는 한 번 센 다녀온 곳 · 바우처", () => {
    const items = [
      { kind: "place", place_id: "a" },
      { kind: "place", place_id: "stay" },
      { kind: "place", place_id: "stay" },
      { kind: "note", place_id: null },
    ] as ScheduleItem[];
    expect(
      tripSummary(
        { expenses: [spend(10000, "me"), spend(1000, "u2", "JPY")], items, voucherCount: 6 },
        { home, rates, peopleCount: 2 },
      ),
    ).toEqual([
      { label: "총 지출", value: "₩19,200" },
      { label: "1인당", value: "₩9,600" },
      { label: "다녀온 곳", value: "2곳" },
      { label: "바우처", value: "6장" },
    ]);
  });
});

describe("postSettleBand", () => {
  const ctx = { home, rates, people: [me, u2], me: "m:me" as const };

  it("받을 돈이 있으면 받을 띠", () => {
    expect(postSettleBand([spend(10000, "me")], [], ctx)).toEqual({
      kind: "recv",
      people: ["m:u2"],
      amount: 5000,
    });
  });

  it("이미 다 보냈거나 나눠 낸 비용이 없으면 띠를 숨긴다", () => {
    expect(postSettleBand([spend(10000, "me")], [sent("u2", "me", 5000)], ctx)).toBeNull();
    expect(postSettleBand([], [], ctx)).toBeNull();
  });

  it("환율을 모르는 비용이 있으면 숨긴다", () => {
    expect(postSettleBand([spend(10, "me", "USD")], [], ctx)).toBeNull();
  });
});
