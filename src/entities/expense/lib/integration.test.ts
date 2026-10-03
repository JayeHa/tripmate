import { describe, expect, it } from "vitest";
import type { ExpenseWithSplits } from "@/lib/entities/expense";
import { computeNetBalances } from "./balances";
import { decimalsOf, splitEqual } from "@/lib/money";
import { minimizeTransfers } from "./settle";

/**
 * 픽스처: 3명(민수 m, 지은 j, 현우 h), 일본 여행, 100 JPY = 900 KRW
 *  1. m 이 숙소 30,000 JPY  → 3명 균등           (270,000 KRW)
 *  2. j 가 저녁 9,000 JPY   → 3명 균등            (81,000 KRW)
 *  3. h 가 교통 KRW 45,000  → 3명 균등
 *  4. m 이 입장권 4,500 JPY → m, j 만             (40,500 KRW)
 *  5. j 가 커피 1,200 JPY   → 커스텀: j 700, h 500 (10,800 KRW: j 6,300 / h 4,500)
 *  6. h 가 편의점 2,000 JPY → 3명 균등            (18,000 KRW: 667/667/666 JPY)
 */
const rates = { JPY: { unit: 100, value: 900 } };
const M = "m";
const J = "j";
const H = "h";
const members = [M, J, H];

function make(
  id: string,
  payer: string,
  amount: number,
  currency: string,
  splits: { user_id: string; share: number }[],
): ExpenseWithSplits {
  return {
    id,
    trip_id: "t",
    schedule_item_id: null,
    payer_id: payer,
    amount,
    currency,
    category: "other",
    memo: null,
    spent_on: "2026-10-29",
    split_mode: "equal",
    created_by: null,
    created_at: "",
    updated_at: "",
    splits: splits.map((s) => ({ expense_id: id, ...s })),
  };
}
const eq = (amount: number, cur: string, ids: string[]) =>
  splitEqual(amount, cur, ids).map((s) => ({ user_id: s.userId, share: s.share }));

const expenses = [
  make("1", M, 30000, "JPY", eq(30000, "JPY", members)),
  make("2", J, 9000, "JPY", eq(9000, "JPY", members)),
  make("3", H, 45000, "KRW", eq(45000, "KRW", members)),
  make("4", M, 4500, "JPY", eq(4500, "JPY", [M, J])),
  make("5", J, 1200, "JPY", [
    { user_id: J, share: 700 },
    { user_id: H, share: 500 },
  ]),
  make("6", H, 2000, "JPY", eq(2000, "JPY", members)),
];

describe("integration: 3 members, mixed currencies", () => {
  it("computes expected net and transfers", () => {
    const b = computeNetBalances(expenses, members, "KRW", rates);

    // paid (KRW): m = 270,000 + 40,500 = 310,500 ; j = 81,000 + 10,800 = 91,800 ; h = 45,000 + 18,000 = 63,000
    expect(b.paid[M]).toBeCloseTo(310500);
    expect(b.paid[J]).toBeCloseTo(91800);
    expect(b.paid[H]).toBeCloseTo(63000);
    expect(b.totalHome).toBe(465300);

    // owed (KRW):
    //  #1 90,000 each (10,000 JPY)  #2 27,000 each  #3 15,000 each
    //  #4 m,j 20,250 each (2,250 JPY)  #5 j 6,300 / h 4,500
    //  #6 splitEqual(2000 JPY, [h, j, m]) → h 667, j 667, m 666 → 6,003 / 6,003 / 5,994
    const owedM = 90000 + 27000 + 15000 + 20250 + 5994;
    const owedJ = 90000 + 27000 + 15000 + 20250 + 6300 + 6003;
    const owedH = 90000 + 27000 + 15000 + 4500 + 6003;
    expect(b.net[M]).toBe(310500 - owedM); // 152,256
    expect(b.net[J]).toBe(91800 - owedJ); // -72,753
    expect(b.net[H]).toBe(63000 - owedH); // -79,503
    expect(Object.values(b.net).reduce((a, c) => a + c, 0)).toBe(0);

    const ts = minimizeTransfers(b.net, decimalsOf("KRW"));
    expect(ts).toEqual([
      { from: H, to: M, amount: 79503 },
      { from: J, to: M, amount: 72753 },
    ]);
  });
});
