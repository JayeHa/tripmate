import type { Tables } from "@/shared/api/supabase/database.types";

export type Expense = Tables<"expenses">;
export type ExpenseSplit = Tables<"expense_splits">;
export type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };

export const EXPENSE_CATEGORIES = [
  "food",
  "transport",
  "lodging",
  "shopping",
  "activity",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: "식비",
  transport: "교통",
  lodging: "숙박",
  shopping: "쇼핑",
  activity: "관광/액티비티",
  other: "기타",
};
