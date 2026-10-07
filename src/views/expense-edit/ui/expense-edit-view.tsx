"use client";

import { useRouter } from "next/navigation";

import { EditExpense } from "@/features/expense/form";

type ExpenseEditViewProps = { tripId: string; expenseId: string };

/** 비용 수정 페이지 — 비용 상세에서 온다. 닫거나 저장하면 상세로, 지우면 가계부로 돌아간다 */
export function ExpenseEditView({ tripId, expenseId }: ExpenseEditViewProps) {
  const router = useRouter();
  const list = `/trips/${tripId}/expenses`;
  const detail = `${list}/${expenseId}`;
  return (
    <EditExpense
      tripId={tripId}
      expenseId={expenseId}
      back={detail}
      onClose={() => router.replace(detail)}
      onDone={() => router.replace(detail)}
      onDeleted={() => router.replace(list)}
    />
  );
}
