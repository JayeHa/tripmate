import { postJson } from "@/shared/api/post-json";
import { createClient } from "@/shared/api/supabase/client";
import type { Tables } from "@/shared/api/supabase/database.types";

/** 지출에 붙은 영수증 한 장 */
export type ExpenseReceipt = Tables<"expense_receipts">;

/** 저장소에 올렸고 아직 지출에 붙이지 않은 파일 */
export type UploadedReceipt = { key: string; name: string; mime: string; size: number };

/** 수정할 때 붙일 것 · 뗄 것 */
export type ReceiptChange = {
  attach: UploadedReceipt[];
  detach: Pick<ExpenseReceipt, "id" | "key">[];
};

/** 서명 주소 라우트를 부른다 — 저장소는 서버가 정한다(지금 Supabase Storage, 최종 R2) */
function callReceipts<T>(body: Record<string, unknown>): Promise<T> {
  return postJson<T>("/api/receipts", body, "영수증을 처리하지 못했어요");
}

/** 여행의 영수증 — 올린 순서 */
export async function fetchReceipts(tripId: string): Promise<ExpenseReceipt[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expense_receipts")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/**
 * 숙소 결제 비용에 붙은 영수증 키. 숙소를 지우면 비용과 영수증 줄은 cascade 로 지워지지만 파일은 남아서,
 * 지우기 전에 읽어 두고 지운 뒤 `removeReceiptFiles` 로 지운다. 못 읽으면 빈 목록(남은 파일은 #155 가 정리한다)
 */
export async function fetchStayReceiptKeys(stayId: string): Promise<string[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("expense_receipts")
    .select("key, expenses!inner(stay_id)")
    .eq("expenses.stay_id", stayId);
  return (data ?? []).map((r) => r.key);
}

/** 파일 하나를 저장소에 올린다 — 서명 주소를 받아 그 주소로 PUT. 지출에는 아직 붙지 않는다 */
export async function uploadReceipt(
  tripId: string,
  file: Blob,
  name: string,
): Promise<UploadedReceipt> {
  const { key, url } = await callReceipts<{ key: string; url: string }>({
    action: "upload",
    tripId,
    mime: file.type,
    size: file.size,
  });
  const put = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`upload ${put.status}`);
  return { key, name, mime: file.type, size: file.size };
}

/** 키마다 잠깐 볼 수 있는 주소 */
export async function fetchReceiptUrls(
  tripId: string,
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  return (await callReceipts<{ urls: Record<string, string> }>({ action: "read", tripId, keys }))
    .urls;
}

/** 저장소의 파일을 지운다 — 실패해도 던지지 않는다(남은 파일은 따로 정리한다, #155) */
export async function removeReceiptFiles(tripId: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await callReceipts({ action: "remove", tripId, keys }).catch(() => undefined);
}

/**
 * 올린 파일을 지출에 붙인다(한 요청이라 모두 붙거나 하나도 안 붙는다). 이미 붙은 키는 건너뛴다 —
 * 앞선 저장이 붙이기까지 하고 뒤 단계에서 실패했을 때 다시 저장해도 같은 키로 막히지 않게.
 * (upsert 로 겹침을 넘기면 장수 트리거가 겹침 검사보다 먼저 돌아 3장에서 거부된다)
 */
export async function attachReceipts(
  tripId: string,
  expenseId: string,
  files: UploadedReceipt[],
): Promise<void> {
  if (files.length === 0) return;
  const supabase = createClient();
  const { data: existing, error: readError } = await supabase
    .from("expense_receipts")
    .select("key")
    .in(
      "key",
      files.map((f) => f.key),
    );
  if (readError) throw readError;
  const attached = new Set((existing ?? []).map((r) => r.key));
  const fresh = files.filter((f) => !attached.has(f.key));
  if (fresh.length === 0) return;
  const { error } = await supabase
    .from("expense_receipts")
    .insert(fresh.map((f) => ({ ...f, trip_id: tripId, expense_id: expenseId })));
  if (error) throw error;
}

/**
 * 수정한 지출의 영수증을 맞춘다 — 뗄 줄을 먼저 지우고, 새 것을 붙인 뒤, 뗀 파일을 지운다.
 * 떼기를 먼저 하는 이유: 3장이 붙은 지출에서 한 장을 바꾸면 붙이는 순간 4장이 되어 DB 트리거가 거부한다
 */
export async function syncReceipts(tripId: string, expenseId: string, change: ReceiptChange) {
  if (change.detach.length > 0) {
    const supabase = createClient();
    const { error } = await supabase
      .from("expense_receipts")
      .delete()
      .in(
        "id",
        change.detach.map((d) => d.id),
      );
    if (error) throw error;
  }
  await attachReceipts(tripId, expenseId, change.attach);
  await removeReceiptFiles(
    tripId,
    change.detach.map((d) => d.key),
  );
}
