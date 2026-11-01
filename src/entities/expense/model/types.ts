import type { Tables } from "@/shared/api/supabase/database.types";

export type Expense = Tables<"expenses">;
export type ExpenseSplit = Tables<"expense_splits">;
/** 비용을 쓴 곳(#289) — 목록 · 상세에 보일 칸만 */
export type ExpensePlace = Pick<Tables<"places">, "id" | "name" | "address" | "gmap_url">;
/**
 * 지출 + 나눔 줄 + 쓴 곳. 쓴 곳은 장소를 붙인 비용만 있고, 화면에 먼저 보인 지출 · 예전에 기기에 남은 목록에는 칸이 없다(undefined)
 */
export type ExpenseWithSplits = Expense & { splits: ExpenseSplit[]; place?: ExpensePlace | null };
/** 앱에 초대하지 않고 가계부 정산에만 넣는 사람 */
export type TripGuest = Tables<"trip_guests">;
/** 정산에서 이미 보낸 돈 한 줄 */
export type Settlement = Tables<"settlements">;

/** 지출 카테고리 7개 — 자주 쓰는 순서. 고르는 칸 · 목록 · 통계 · 필터가 모두 이 순서로 보인다 */
export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "shopping",
  "activity",
  "lodging",
  "flight",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: "식비",
  transport: "교통",
  shopping: "쇼핑",
  activity: "관광",
  lodging: "숙소",
  flight: "항공",
  other: "기타",
};

/** 결제수단 — 이 순서로 입력 칸 · PC 필터에 보인다. 여행지에서 가장 많이 쓰는 카드가 먼저 */
export const PAYMENT_METHODS = ["card", "cash", "transit"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "현금",
  card: "카드",
  transit: "교통카드",
};
