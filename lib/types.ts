import type { Tables } from "./supabase/database.types";

/** 100 JPY = 900 KRW  =>  { JPY: { unit: 100, value: 900 } } */
export type ExchangeRates = Record<string, { unit: number; value: number }>;

export type Trip = Omit<Tables<"trips">, "exchange_rates"> & { exchange_rates: ExchangeRates };
export type Profile = Tables<"profiles">;
export type TripMember = Tables<"trip_members"> & { profile: Profile };
export type ScheduleItem = Tables<"schedule_items">;
export type Expense = Tables<"expenses">;
export type ExpenseSplit = Tables<"expense_splits">;
export type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };

export type TravelMode = "WALK" | "TRANSIT";

export type RouteLeg = {
  fromId: string;
  toId: string;
  durationSec: number;
  distanceM: number;
};

export type DayRoute = {
  polyline: string | null;
  legs: RouteLeg[];
};

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

export const CURRENCY_OPTIONS = ["KRW", "JPY", "USD", "EUR", "TWD", "THB", "VND", "CNY"] as const;
