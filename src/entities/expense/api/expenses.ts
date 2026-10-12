import { createClient } from "@/shared/api/supabase/client";
import { type Share, splitEqual, validateCustomShares } from "@/shared/lib/money";

import { insertColumns, sharesChanged, updateColumns } from "../lib/columns";
import { withLinkGone } from "../lib/link-gone";
import { ownerColumns, PAYMENT_OWNER, type PaymentOwner } from "../lib/payment-owner";
import { personKey, personOfKey, type PersonRef } from "../lib/person";
import type { ExpenseFormValues } from "../model/schema";
import type { ExpenseWithSplits } from "../model/types";
import { attachReceipts, removeReceiptFiles, type UploadedReceipt } from "./receipts";

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

/**
 * 지출을 만든다 — 지출 · 나눔 · 영수증 줄 순서로. 나눔이나 영수증 줄을 저장하지 못하면 지출도 되돌린다
 * (다시 저장해도 두 번 생기지 않게). 영수증 파일은 이미 저장소에 올라가 있다.
 * owner 면 그 숙소 · 항공편의 결제 — 이름 · 카테고리는 DB 가 그것에 맞추고, 숙소 · 항공편마다 하나뿐이다
 */
export async function createExpense(
  tripId: string,
  values: ExpenseFormValues,
  createdBy: string,
  receipts: UploadedReceipt[] = [],
  owner: PaymentOwner | null = null,
): Promise<string> {
  const supabase = createClient();
  const shares = resolveShares(values);
  const { data, error } = await supabase
    .from("expenses")
    .insert({
      ...insertColumns(values),
      ...ownerColumns(owner),
      trip_id: tripId,
      created_by: createdBy,
    })
    .select("id")
    .single();
  if (error) throw paidAlready(error, owner) ?? ownerGone(error, owner) ?? withLinkGone(error);

  const { error: splitError } = await supabase
    .from("expense_splits")
    .insert(shares.map((s) => splitRow(data.id, s)));
  if (splitError) {
    // 분배 저장 실패 시 지출도 되돌림
    await supabase.from("expenses").delete().eq("id", data.id);
    throw splitError;
  }
  try {
    await attachReceipts(tripId, data.id, receipts);
  } catch (e) {
    await supabase.from("expenses").delete().eq("id", data.id);
    throw e;
  }
  return data.id;
}

/**
 * 지출을 고친다. `opened` 는 폼을 연 때의 값 — 그때와 달라진 칸만 보낸다(`updateColumns`).
 * 바뀐 칸이 없으면 지출 줄은 건드리지 않고, 몫이 달라지지 않으면(`sharesChanged`) 나눔 줄도 그대로 둔다
 */
export async function updateExpense(
  expenseId: string,
  values: ExpenseFormValues,
  opened: ExpenseFormValues,
): Promise<void> {
  const supabase = createClient();
  const columns = updateColumns(values, opened);
  if (Object.keys(columns).length > 0) {
    const { error } = await supabase.from("expenses").update(columns).eq("id", expenseId);
    if (error) throw withLinkGone(error);
  }
  if (!sharesChanged(values, opened)) return;

  const shares = resolveShares(values);
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

/**
 * 그사이 일행이 이 숙소 · 항공편의 결제를 먼저 넣었다(unique `expenses_stay_key` · `expenses_flight_key`) — 알아볼 수 있는 오류로.
 * 아니면 null
 */
function paidAlready(
  error: { code?: string; message: string },
  owner: PaymentOwner | null,
): Error | null {
  if (!owner || error.code !== "23505" || !error.message.includes(`expenses_${owner.kind}_key`)) {
    return null;
  }
  return new Error(
    `이 ${PAYMENT_OWNER[owner.kind].noun}에는 이미 결제가 있어요. 닫고 다시 열어 주세요`,
  );
}

/** 숙소 · 항공편이 지워져 결제를 넣지 못했을 때 */
const OWNER_GONE = {
  stay: "이 숙소가 지워졌어요. 닫고 다시 열어 주세요",
  flight: "이 항공편이 지워졌어요. 닫고 다시 열어 주세요",
} as const;

/**
 * 저장하는 사이 일행이 이 숙소 · 항공편을 지웠다(트리거의 23503 「stay not found」 · 「flight not found」, 0056) —
 * 알아볼 수 있는 오류로. 아니면 null
 */
function ownerGone(
  error: { code?: string; message: string },
  owner: PaymentOwner | null,
): Error | null {
  if (!owner || error.code !== "23503" || !error.message.includes(`${owner.kind} not found`)) {
    return null;
  }
  return new Error(OWNER_GONE[owner.kind]);
}

/** 지출을 지운다 — 영수증 줄은 함께 지워지고(cascade), 그 파일은 지운 뒤 저장소에서 지운다 */
export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  const supabase = createClient();
  const { data: receipts } = await supabase
    .from("expense_receipts")
    .select("key")
    .eq("expense_id", expenseId);
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
  await removeReceiptFiles(
    tripId,
    (receipts ?? []).map((r) => r.key),
  );
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
