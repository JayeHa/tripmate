"use client";

import { Trash2 } from "lucide-react";

import {
  type ExpenseDraft,
  type ExpenseReceipt,
  type ReceiptChange,
  removeReceiptFiles,
} from "@/entities/expense";

import { nextDraftReceipts } from "../lib/draft-receipts";
import { startCurrency } from "../lib/start-currency";
import { readLastCurrency } from "../model/last-currency";
import { useExpenseFormData } from "../model/use-expense-form-data";
import { DeleteExpenseConfirm } from "./delete-expense-confirm";
import { ExpenseForm, type ExpenseFormLayout } from "./expense-form";
import { FormLoadError } from "./form-load-error";

type DraftExpenseProps = {
  tripId: string;
  layout?: ExpenseFormLayout;
  /** 숙소 이름 — 맨 위 「숙소 결제」 요약에 보인다(이름은 숙소를 저장할 때 DB 가 맞춘다) */
  name: string;
  /** 고치는 초안. 처음 넣으면 null */
  draft: ExpenseDraft | null;
  /** 「완료」 · 「삭제」 — 새 초안, 지웠으면 null */
  onDraft: (draft: ExpenseDraft | null) => void;
  /** ✕ — 초안을 바꾸지 않고 닫는다 */
  onClose: () => void;
  /** 「완료」 · 「삭제」 뒤에 닫는다 */
  onDone: () => void;
  onToast?: (text: string) => void;
};

/**
 * 아직 저장하지 않은 숙소의 결제 — 「숙소 결제」 모드의 비용 입력이지만 「완료」 가 저장하지 않고 값을 초안으로 돌려준다.
 * 영수증은 고르는 순간 저장소에 올라가므로 초안에 키로 들고 있고, 숙소를 저장할 때 비용과 함께 붙는다.
 * 고칠 때 초안의 영수증은 붙어 있던 것처럼 보이고(키를 id 로), 뺀 것은 「완료」 할 때 파일을 지운다
 */
export function DraftExpense({
  tripId,
  layout,
  name,
  draft,
  onDraft,
  onClose,
  onDone,
  onToast,
}: DraftExpenseProps) {
  const loaded = useExpenseFormData(tripId);
  if (loaded.failed)
    return <FormLoadError title="비용 추가" onClose={onClose} onRetry={loaded.retry} />;
  if (!loaded.data) return null;
  const { trip } = loaded.data;
  const kept = draft?.receipts ?? [];

  /** 「완료」 — 남긴 초안 영수증 + 새로 올린 것으로 새 초안. 뺀 초안 영수증은 붙을 곳이 없어 파일을 지운다 */
  function submit(values: ExpenseDraft["values"], change: ReceiptChange) {
    const next = nextDraftReceipts(kept, change);
    void removeReceiptFiles(tripId, next.dropped);
    onDraft({ values, receipts: next.receipts });
    onDone();
  }

  return (
    <ExpenseForm
      title={draft ? "비용 수정" : "비용 추가"}
      layout={layout}
      onClose={onClose}
      headerRight={
        draft && (
          <DeleteExpenseConfirm
            onDelete={() => {
              void removeReceiptFiles(
                tripId,
                kept.map((r) => r.key),
              );
              onDraft(null);
              onDone();
            }}
            className="flex h-8.5 items-center gap-1 rounded-button bg-destructive-soft px-2.5 text-sm font-bold text-destructive"
          >
            <Trash2 className="size-4.5" aria-hidden="true" />
            삭제
          </DeleteExpenseConfirm>
        )
      }
      {...loaded.data}
      initial={draft?.values}
      receipts={kept.map((r) => draftReceiptRow(trip.id, r))}
      defaultSpentOn=""
      defaultCurrency={startCurrency(
        [trip.home_currency, ...Object.keys(trip.exchange_rates)],
        readLastCurrency(trip.id),
        (loaded.data.expenses ?? []).map((e) => e.currency),
      )}
      stay={{ name }}
      onToast={onToast}
      onSubmit={(values, _opened, receipts) => submit(values, receipts)}
    />
  );
}

/** 초안 영수증을 폼이 받는 영수증 줄 모양으로 — 줄이 없으니 키를 id 로 쓴다 */
function draftReceiptRow(tripId: string, r: ExpenseDraft["receipts"][number]): ExpenseReceipt {
  return { ...r, id: r.key, trip_id: tripId, expense_id: "", created_by: null, created_at: "" };
}
