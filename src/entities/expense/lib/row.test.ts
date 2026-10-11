import { describe, expect, it } from "vitest";

import type { ExpenseWithSplits } from "../model/types";
import type { PersonRef } from "./person";
import { amountLines, expenseRowView, whoOf, withLine } from "./row";

const ctx = {
  home: "KRW",
  rates: { JPY: { unit: 100, value: 920 } },
  today: "2026-10-05",
  nameOf: (person: PersonRef) => ({ me: "나", k: "김동규" })[person.id] ?? "알 수 없음",
  linkNameOf: (id: string) => (id === "s1" ? "텐동 카네코 한노스케" : null),
};

const base = {
  id: "e1",
  name: "텐동",
  category: "food",
  amount: 3200,
  currency: "JPY",
  rate: null,
  payer_id: "k",
  payer_guest_id: null,
  split_each: false,
  paid: true,
  due_date: null,
  counted: true,
  schedule_item_id: "s1",
  splits: [
    { id: "s1", expense_id: "e1", trip_id: "t", user_id: "me", guest_id: null, share: 1600 },
    { id: "s2", expense_id: "e1", trip_id: "t", user_id: "k", guest_id: null, share: 1600 },
  ],
} as unknown as ExpenseWithSplits;

describe("expenseRowView", () => {
  it("외화 — 근사치 · 여행 기본 환율 · 사람 · 연결 일정", () => {
    expect(expenseRowView(base, ctx)).toMatchObject({
      name: "텐동",
      categoryLabel: "식비",
      amountText: "¥3,200",
      approxText: "≈ ₩29,440",
      rateText: "(¥100 = ₩920)",
      payer: { person: { kind: "member", id: "k" }, name: "김동규" },
      together: "나, 김동규",
      togetherPeople: [
        { person: { kind: "member", id: "me" }, name: "나" },
        { person: { kind: "member", id: "k" }, name: "김동규" },
      ],
      planned: false,
      overdue: false,
      excluded: false,
      linkName: "텐동 카네코 한노스케",
      fromStay: false,
    });
  });

  it("지출에 적은 환율이 있으면 그 환율로", () => {
    const row = expenseRowView({ ...base, amount: 12400, rate: 8.883 }, ctx);
    expect(row.approxText).toBe("≈ ₩110,149");
    expect(row.rateText).toBe("(¥100 = ₩888)");
    expect(row.ownRateText).toBe("엔 888.3");
    expect(row.homeText).toBe("₩110,149");
  });

  it("지출 환율이 여행 기본과 같으면 「이 비용만」 환율을 보이지 않는다", () => {
    expect(expenseRowView({ ...base, rate: 9.2 }, ctx).ownRateText).toBeNull();
    expect(expenseRowView(base, ctx).ownRateText).toBeNull();
  });

  it("기준 화폐면 근사치 · 환율이 없다, 환율을 모르면 「환율 없음」", () => {
    expect(expenseRowView({ ...base, currency: "KRW", amount: 466240 }, ctx)).toMatchObject({
      amountText: "₩466,240",
      approxText: null,
      rateText: null,
    });
    expect(expenseRowView({ ...base, currency: "USD", amount: 12.5 }, ctx)).toMatchObject({
      approxText: "환율 없음",
      rateText: null,
    });
  });

  it("결제 예정 — 예정일이 오늘보다 앞이면 지남, 합계 제외 · 연결 없음", () => {
    const row = expenseRowView(
      { ...base, paid: false, due_date: "2026-10-01", counted: false, schedule_item_id: null },
      ctx,
    );
    expect(row).toMatchObject({ planned: true, overdue: true, excluded: true, linkName: null });
    expect(expenseRowView({ ...base, paid: false, due_date: "2026-10-05" }, ctx).overdue).toBe(
      false,
    );
  });
});

describe("whoOf", () => {
  const me = { kind: "member" as const, id: "me" };
  const dong = { kind: "member" as const, id: "d" };
  const names: Record<string, string> = { me: "정원", d: "동규" };
  const display = (p: { id: string }) => names[p.id];
  const people = [
    { person: me, name: "나" },
    { person: dong, name: "동규" },
  ];
  const paidByMe = { splitEach: false, payer: { person: me, name: "나" } };

  it("결제한 사람의 표시 이름 · 함께한 사람 수, 아바타는 결제한 사람", () => {
    expect(whoOf({ ...paidByMe, togetherPeople: people }, display, 3)).toEqual({
      person: me,
      text: "정원 결제 · 2명",
    });
  });

  it("한 명이면 「혼자」, 여행의 모두면 「N명 모두」", () => {
    expect(whoOf({ ...paidByMe, togetherPeople: people.slice(0, 1) }, display, 3).text).toBe(
      "정원 결제 · 혼자",
    );
    expect(whoOf({ ...paidByMe, togetherPeople: people }, display, 2).text).toBe(
      "정원 결제 · 2명 모두",
    );
  });

  it("각자 냄 — 아바타는 함께한 첫 사람", () => {
    expect(whoOf({ splitEach: true, payer: null, togetherPeople: people }, display, 2)).toEqual({
      person: me,
      text: "각자 냄 · 2명",
    });
  });
});

describe("withLine · amountLines", () => {
  const me = { kind: "member" as const, id: "me" };
  const a = { kind: "member" as const, id: "a" };
  const b = { kind: "member" as const, id: "b" };
  const names: Record<string, string> = { me: "정원", a: "동규", b: "서연" };
  const display = (p: { id: string }) => names[p.id];
  const together = (...ps: (typeof me)[]) => ps.map((person) => ({ person, name: "" }));
  const payer = { person: me, name: "나" };

  it("혼자 · N명 모두 · 함께 · 외 N, 각자 냄은 이름들", () => {
    expect(withLine({ splitEach: false, payer, togetherPeople: together(me) }, display, 3)).toBe(
      "혼자",
    );
    expect(
      withLine({ splitEach: false, payer, togetherPeople: together(me, a, b) }, display, 3),
    ).toBe("3명 모두");
    expect(withLine({ splitEach: false, payer, togetherPeople: together(me, a) }, display, 3)).toBe(
      "함께 · 정원, 동규",
    );
    expect(
      withLine({ splitEach: false, payer, togetherPeople: together(me, a, b) }, display, 4),
    ).toBe("함께 · 정원, 동규 외 1");
    expect(
      withLine({ splitEach: true, payer: null, togetherPeople: together(me, a) }, display, 3),
    ).toBe("정원, 동규");
  });

  it("현지 금액 / 원화 — 외화만 두 줄, 이 비용만 다른 환율은 작은 줄 끝에", () => {
    const fx = {
      amountText: "¥3,200",
      approxText: "≈ ₩29,440",
      homeText: "₩29,440",
      ownRateText: null,
    };
    expect(amountLines(fx, "local")).toEqual({ big: "¥3,200", small: "≈ ₩29,440" });
    expect(amountLines(fx, "home")).toEqual({ big: "₩29,440", small: "¥3,200" });
    expect(amountLines({ ...fx, ownRateText: "엔 905" }, "home")).toEqual({
      big: "₩29,440",
      small: "¥3,200 · 엔 905",
    });
    expect(
      amountLines(
        { amountText: "₩5,000", approxText: null, homeText: null, ownRateText: null },
        "home",
      ),
    ).toEqual({ big: "₩5,000", small: null });
  });
});
