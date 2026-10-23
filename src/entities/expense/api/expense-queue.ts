import { createClient } from "@/shared/api/supabase/client";
import { isDuplicateKey, isNetworkError } from "@/shared/api/sync";

import { insertColumns } from "../lib/columns";
import { withLinkGone } from "../lib/link-gone";
import { resolveShares, splitRow } from "../lib/shares";
import type { ExpenseCreateVars } from "../model/expense-sync";

/**
 * 영수증 없는 보통 비용을 만든다 — 오프라인 대기열로 올라온다. id 는 화면에서 만들어 같은 저장이 두 번 올라가도 하나만 생긴다.
 * 지출 · 나눔 순서로 넣는다. 지출은 들어갔는데 나눔을 넣다 서버에 닿지 못하면 지출을 남겨 두고, 다음에 올라올 때 나눔만 이어서 넣는다.
 * 나눔이 다른 이유로 실패하면 지출도 되돌린다(createExpense 와 같다)
 */
export async function createExpenseOnce(v: ExpenseCreateVars): Promise<void> {
  const supabase = createClient();
  const shares = resolveShares(v.values);
  const { error } = await supabase.from("expenses").insert({
    ...insertColumns(v.values),
    id: v.id,
    trip_id: v.tripId,
    created_by: v.createdBy,
    created_at: v.createdAt,
  });
  if (error && !isDuplicateKey(error)) throw withLinkGone(error);
  if (error && (await hasSplits(v.id))) return;

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => splitRow(v.id, s)));
  if (!splitError) return;
  if (isNetworkError(splitError)) throw splitError;
  await supabase.from("expenses").delete().eq("id", v.id);
  throw splitError;
}

/** 앞서 올라간 지출에 나눔까지 들어갔는가 */
async function hasSplits(expenseId: string): Promise<boolean> {
  const { data, error } = await createClient()
    .from("expense_splits")
    .select("id")
    .eq("expense_id", expenseId)
    .limit(1);
  if (error) throw error;
  return data.length > 0;
}
