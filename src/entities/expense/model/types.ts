import type { Tables } from "@/shared/api/supabase/database.types";

export type Expense = Tables<"expenses">;
export type ExpenseSplit = Tables<"expense_splits">;
export type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };
/** 앱에 초대하지 않고 가계부 정산에만 넣는 사람 */
export type TripGuest = Tables<"trip_guests">;
/** 정산에서 이미 보낸 돈 한 줄 */
export type Settlement = Tables<"settlements">;

/** 지출 카테고리 7개 — 고르는 칸 · 통계에 이 순서로 보인다 */
export const EXPENSE_CATEGORIES = [
  "lodging",
  "flight",
  "transport",
  "activity",
  "food",
  "shopping",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  lodging: "숙소",
  flight: "항공",
  transport: "교통",
  activity: "관광",
  food: "식비",
  shopping: "쇼핑",
  other: "기타",
};

/** 결제수단 */
export const PAYMENT_METHODS = ["cash", "card", "transit"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "현금",
  card: "카드",
  transit: "교통카드",
};
