import { describe, expect, it } from "vitest";

import type { ExpenseFormValues } from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import { startValues } from "./start-values";

const trip = { start_date: "2026-10-31" } as Trip;
const base = { trip, currencies: ["KRW", "JPY"], me: "m:a" };

const saved: ExpenseFormValues = {
  name: "숙소",
  amount: 466240,
  currency: "KRW",
  rate: null,
  payment_method: "card",
  payer: { kind: "member", id: "b" },
  split_each: false,
  participants: [
    { kind: "member", id: "a" },
    { kind: "member", id: "b" },
  ],
  split_mode: "custom",
  custom_shares: { a: 200000, b: 266240 },
  category: "lodging",
  memo: undefined,
  spent_on: null,
  schedule_item_id: null,
  counted: false,
  paid: false,
  due_date: "2026-10-20",
};

describe("startValues", () => {
  it("새 지출 — 마지막 통화 · 카드 · 내가 결제 · 모두와 나눔(null) · 여행 첫날, 카테고리는 비운다", () => {
    expect(startValues(base)).toEqual({
      name: "",
      amount: "",
      currency: "JPY",
      rate: null,
      paymentMethod: "card",
      payer: "m:a",
      splitEach: false,
      participants: null,
      category: null,
      memo: "",
      spentOn: "2026-10-31",
      itemId: "",
      paid: true,
      dueDate: "",
      counted: true,
    });
  });

  it("저장된 지출 — 금액은 문자열로, 날짜 없음(여행준비 · 예정일 없음)은 빈 글로", () => {
    expect(startValues({ ...base, initial: saved })).toEqual({
      name: "숙소",
      amount: "466240",
      currency: "KRW",
      rate: null,
      paymentMethod: "card",
      payer: "m:b",
      splitEach: false,
      participants: ["m:a", "m:b"],
      category: "lodging",
      memo: "",
      spentOn: "",
      itemId: "",
      paid: false,
      dueDate: "2026-10-20",
      counted: false,
    });
  });

  it("일정에서 연 새 지출 — 그 일정의 날 · 카테고리로, 대체 장소면 합계에서 뺀다", () => {
    const ramen = {
      id: "s1",
      kind: "place",
      day_index: 1,
      alternative_of: null,
      place: { name: "라멘", category: "food" },
    } as unknown as ScheduleItem;
    expect(startValues({ ...base, presetItem: ramen })).toMatchObject({
      itemId: "s1",
      spentOn: "2026-11-01",
      category: "food",
      counted: true,
    });
    expect(startValues({ ...base, presetItem: { ...ramen, alternative_of: "s0" } })).toMatchObject({
      counted: false,
    });
  });

  it("숙소 결제 — 숙소 이름 · 카테고리 숙소 · 고른 날(여행준비), 일정 연결 없음", () => {
    expect(
      startValues({
        ...base,
        defaultSpentOn: "",
        payFor: { kind: "stay", name: "호텔 몬토레 긴자" },
      }),
    ).toMatchObject({ name: "호텔 몬토레 긴자", category: "lodging", spentOn: "", itemId: "" });
  });

  it("항공편 결제 — 「제주항공 7C1181」 · 카테고리 항공", () => {
    expect(
      startValues({
        ...base,
        defaultSpentOn: "",
        payFor: { kind: "flight", name: "제주항공 7C1181" },
      }),
    ).toMatchObject({ name: "제주항공 7C1181", category: "flight", spentOn: "" });
  });

  it("각자 냄 — 결제한 사람이 없다", () => {
    const each = startValues({ ...base, initial: { ...saved, payer: null, split_each: true } });
    expect(each).toMatchObject({ payer: null, splitEach: true });
  });
});
