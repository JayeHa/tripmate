import type { ExpenseDraft, ReceiptChange } from "@/entities/expense";

type DraftReceipt = ExpenseDraft["receipts"][number];

/**
 * 초안을 다시 고친 뒤의 영수증 — 남긴 초안 영수증 + 새로 올린 것, 그리고 뺀 초안 영수증의 키(붙을 곳이 없어 파일을 지운다).
 * 폼은 초안 영수증을 붙어 있던 것처럼 받으므로(키를 id 로) 뺀 것은 detach 로 온다
 */
export function nextDraftReceipts(
  kept: DraftReceipt[],
  change: ReceiptChange,
): { receipts: DraftReceipt[]; dropped: string[] } {
  const dropped = new Set(change.detach.map((d) => d.key));
  return {
    receipts: [...kept.filter((r) => !dropped.has(r.key)), ...change.attach],
    dropped: [...dropped],
  };
}
