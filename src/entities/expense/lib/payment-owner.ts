import type { Expense, ExpenseCategory } from "../model/types";

/** 비용이 누구의 결제인지 — 숙소(`stay_id`, 0051) · 항공편(`flight_id`, 0055) */
export type PaymentOwnerKind = "stay" | "flight";

/** 결제가 붙는 곳 */
export type PaymentOwner = { kind: PaymentOwnerKind; id: string };

/** 종류마다 화면 글자 · 카테고리 — 이름 · 카테고리는 DB 트리거가 정하고, 화면은 같은 값을 미리 보인다 */
export const PAYMENT_OWNER: Record<
  PaymentOwnerKind,
  {
    /** 「숙소 결제」 배지 · 「이 숙소」 */
    noun: string;
    /** 가계부 상세 · 목록의 「연결」 */
    linkLabel: string;
    category: ExpenseCategory;
    categoryLabel: string;
    /** 결제 칸 아래 안내 — 가계부에서 기록되는 곳 */
    ledgerLabel: string;
  }
> = {
  stay: {
    noun: "숙소",
    linkLabel: "숙소 정보",
    category: "lodging",
    categoryLabel: "숙소",
    ledgerLabel: "여행준비 · 숙소",
  },
  flight: {
    noun: "항공편",
    linkLabel: "항공편 정보",
    category: "flight",
    categoryLabel: "항공",
    ledgerLabel: "여행준비 · 항공",
  },
};

/** 비용이 숙소 · 항공편의 결제면 그 종류, 아니면 null */
export function paymentOwnerOf(e: Pick<Expense, "stay_id" | "flight_id">): PaymentOwnerKind | null {
  if (e.stay_id) return "stay";
  return e.flight_id ? "flight" : null;
}

/** 넣을 비용 행의 결제 칸 — 숙소 · 항공편 중 하나만 */
export function ownerColumns(owner: PaymentOwner | null) {
  return {
    stay_id: owner?.kind === "stay" ? owner.id : null,
    flight_id: owner?.kind === "flight" ? owner.id : null,
  };
}

/** 결제 비용 입력이 보일 것 — 어느 쪽의 결제인지 · 그 이름(새 비용의 이름) */
export type PayFor = { kind: PaymentOwnerKind; name: string };
