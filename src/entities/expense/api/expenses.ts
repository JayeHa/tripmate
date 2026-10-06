import { createClient } from "@/shared/api/supabase/client";
import { type Share, splitEqual, validateCustomShares } from "@/shared/lib/money";

import { insertColumns, updateColumns } from "../lib/columns";
import { personKey, personOfKey, type PersonRef } from "../lib/person";
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

/**
 * 폼 값 → 나눠 낸 몫. 사람은 멤버이거나 정산 인원이라 키(`m:…` · `g:…`)로 나눈 뒤 다시 사람으로 되돌린다.
 * custom 이면 검증 후 사용
 */
export function resolveShares(values: ExpenseFormValues): { person: PersonRef; share: number }[] {
  const keys = values.participants.map(personKey);
  const shares = sharesOf(values, keys);
  return shares.flatMap((s) => {
    const person = personOfKey(s.userId);
    return person ? [{ person, share: s.share }] : [];
  });
}

/** 키마다의 몫 — 직접 나누기면 적은 값을 검증하고, 아니면 똑같이 나눈다 */
function sharesOf(values: ExpenseFormValues, keys: string[]): Share[] {
  if (values.split_mode !== "custom") return splitEqual(values.amount, values.currency, keys);
  const shares = keys.map((key) => ({ userId: key, share: values.custom_shares?.[key] ?? 0 }));
  const result = validateCustomShares(values.amount, values.currency, shares);
  if (!result.ok) throw new Error(result.error);
  return result.shares;
}

/** 나눠 낸 몫 한 줄 — 멤버면 user_id, 정산 인원이면 guest_id */
function splitRow(expenseId: string, s: { person: PersonRef; share: number }) {
  return {
    expense_id: expenseId,
    user_id: s.person.kind === "member" ? s.person.id : null,
    guest_id: s.person.kind === "guest" ? s.person.id : null,
    share: s.share,
  };
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
    .insert({ ...insertColumns(values), trip_id: tripId, created_by: createdBy })
    .select("id")
    .single();
  if (error) throw error;

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => splitRow(data.id, s)));
  if (splitError) {
    // 분배 저장 실패 시 지출도 되돌림
    await supabase.from("expenses").delete().eq("id", data.id);
    throw splitError;
  }
  return data.id;
}

/**
 * 지출을 고친다. `opened` 는 폼을 연 때의 값 — 그때와 달라진 칸만 보낸다(`updateColumns`).
 * 바뀐 칸이 없으면 지출 줄은 건드리지 않는다
 */
export async function updateExpense(
  expenseId: string,
  values: ExpenseFormValues,
  opened: ExpenseFormValues,
): Promise<void> {
  const supabase = createClient();
  const shares = resolveShares(values);
  const columns = updateColumns(values, opened);
  if (Object.keys(columns).length > 0) {
    const { error } = await supabase.from("expenses").update(columns).eq("id", expenseId);
    if (error) throw error;
  }

  const { error: delError } = await supabase
    .from("expense_splits")
    .delete()
    .eq("expense_id", expenseId);
  if (delError) throw delError;
  const { error: insError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => splitRow(expenseId, s)));
  if (insError) throw insError;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}

/**
 * 결제 예정인 지출을 결제 완료로 — 예정일도 비운다. 다른 칸은 건드리지 않는다.
 * 0행이면(그사이 지워졌거나 권한이 없다 — RLS 는 오류 없이 0행으로 끝난다) 던진다
 */
export async function markExpensePaid(expenseId: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .update({ paid: true, due_date: null })
    .eq("id", expenseId)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error("expense not found");
}

/** date 이후(포함)의 지출 수. 기간을 줄일 때 마지막 날로 모일 지출을 미리 센다. 여행준비(날짜 없음)는 세지 않는다 */
export async function countExpensesFrom(tripId: string, date: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .gte("spent_on", date);
  if (error) throw error;
  return count ?? 0;
}
