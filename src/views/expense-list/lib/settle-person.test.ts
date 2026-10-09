import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "@/entities/expense";

import { netBox, personExpenses, personTransfers, settleState, settleSub } from "./settle-person";

describe("personTransfers", () => {
  it("그 사람이 주고받는 줄만, 그 사람 입장으로 — 보낸 기록은 id 로 취소", () => {
    const rows = [
      { from: "m:b", to: "m:a", amount: 100, done: false, key: "m:b>m:a" },
      { from: "m:c", to: "m:b", amount: 50, done: false, key: "m:c>m:b" },
      { from: "m:a", to: "m:c", amount: 30, done: true, key: "s1" },
    ];
    expect(personTransfers(rows, "m:a")).toEqual([
      { key: "m:b>m:a", other: "m:b", receive: true, amount: 100, settlementId: null },
      { key: "s1", other: "m:c", receive: false, amount: 30, settlementId: "s1" },
    ]);
  });
});

describe("netBox", () => {
  it("받을 돈 · 보낼 돈 · 반올림 오차는 정산 없음", () => {
    expect(netBox(1200, 0)).toEqual({ kind: "recv", amount: 1200 });
    expect(netBox(-300, 0)).toEqual({ kind: "send", amount: 300 });
    expect(netBox(0.4, 0)).toEqual({ kind: "none", amount: 0 });
  });
});

describe("personExpenses", () => {
  /** 테스트 지출 — 결제자 a, 나눈 사람 몫 */
  const expense = (id: string, opts: Partial<ExpenseWithSplits> = {}) =>
    ({
      id,
      amount: 3000,
      currency: "KRW",
      rate: null,
      counted: true,
      split_each: false,
      payer_id: "a",
      payer_guest_id: null,
      splits: [
        { user_id: "a", guest_id: null, share: 1000 },
        { user_id: "b", guest_id: null, share: 2000 },
      ],
      ...opts,
    }) as unknown as ExpenseWithSplits;
  const list = [
    expense("e1"),
    expense("e2", { counted: false }),
    expense("e3", { split_each: true, payer_id: null }),
  ];
  const a = { kind: "member", id: "a" } as const;
  const b = { kind: "member", id: "b" } as const;

  it("결제한 비용 — 결제자의 총액, 합계 제외 · 각자 냄은 빼고", () => {
    expect(personExpenses(list, a, "paid", "KRW", {}).map((r) => [r.expense.id, r.amount])).toEqual(
      [["e1", 3000]],
    );
  });

  it("함께한 비용 — 그 사람 몫, 각자 냄도 넣는다", () => {
    expect(personExpenses(list, b, "with", "KRW", {}).map((r) => [r.expense.id, r.amount])).toEqual(
      [
        ["e1", 2000],
        ["e3", 2000],
      ],
    );
  });
});

describe("settleState · settleSub", () => {
  const sent = [{ settlementId: "x" }];
  const money = (n: number) => `₩${n}`;

  it("남은 돈이 있고 보낸 기록도 있으면 남은 금액", () => {
    const state = settleState(500, 0, sent);
    expect(state).toEqual({ kind: "recv", amount: 500, partial: true });
    expect(settleSub(state, money)).toBe("받을 돈 ₩500 · 남은 금액");
  });

  it("남은 돈이 없고 보낸 기록이 있으면 정산 끝, 없으면 정산 없음", () => {
    expect(settleSub(settleState(0, 0, sent), money)).toBe("정산 끝");
    expect(settleSub(settleState(0, 0, []), money)).toBe("정산 없음");
  });

  it("보낸 기록이 없으면 그대로", () => {
    expect(settleSub(settleState(-300, 0, [{ settlementId: null }]), money)).toBe("보낼 돈 ₩300");
  });
});
