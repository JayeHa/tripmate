import { createClient } from "@/shared/api/supabase/client";
import { type Share, splitEqual, validateCustomShares } from "@/shared/lib/money";

import type { ExpenseFormValues } from "../model/schema";
import type { ExpenseWithSplits } from "../model/types";

export async function fetchExpenses(tripId: string): Promise<ExpenseWithSplits[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*, splits:expense_splits(*)")
    .eq("trip_id", tripId)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** 폼 값 → 분배 행. custom 이면 검증 후 사용 */
export function resolveShares(values: ExpenseFormValues): Share[] {
  if (values.split_mode === "custom") {
    const shares = values.participant_ids.map((userId) => ({
      userId,
      share: values.custom_shares?.[userId] ?? 0,
    }));
    const result = validateCustomShares(values.amount, values.currency, shares);
    if (!result.ok) throw new Error(result.error);
    return result.shares;
  }
  return splitEqual(values.amount, values.currency, values.participant_ids);
}

export async function createExpense(
  tripId: string,
  values: ExpenseFormValues,
  createdBy: string,
): Promise<string> {
  const supabase = createClient();
  const shares = resolveShares(values);
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: tripId,
      payer_id: values.payer_id,
      amount: values.amount,
      currency: values.currency,
      category: values.category,
      memo: values.memo || null,
      spent_on: values.spent_on,
      split_mode: values.split_mode,
      schedule_item_id: values.schedule_item_id ?? null,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => ({ expense_id: data.id, user_id: s.userId, share: s.share })));
  if (splitError) {
    // 분배 저장 실패 시 지출도 되돌림
    await supabase.from("expenses").delete().eq("id", data.id);
    throw splitError;
  }
  return data.id;
}

export async function updateExpense(expenseId: string, values: ExpenseFormValues): Promise<void> {
  const supabase = createClient();
  const shares = resolveShares(values);
  const { error } = await supabase
    .from("expenses")
    .update({
      payer_id: values.payer_id,
      amount: values.amount,
      currency: values.currency,
      category: values.category,
      memo: values.memo || null,
      spent_on: values.spent_on,
      split_mode: values.split_mode,
      schedule_item_id: values.schedule_item_id ?? null,
    })
    .eq("id", expenseId);
  if (error) throw error;

  const { error: delError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", expenseId);
  if (delError) throw delError;
  const { error: insError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => ({ expense_id: expenseId, user_id: s.userId, share: s.share })));
  if (insError) throw insError;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}
