"use client";

import { useRouter } from "next/navigation";

import { EditExpense } from "@/features/expense/form";

type ExpenseEditViewProps = { tripId: string; expenseId: string };

/** 비용 수정 페이지 — 저장 · 삭제하면 가계부로 돌아간다 */
export function ExpenseEditView({ tripId, expenseId }: ExpenseEditViewProps) {
  const router = useRouter();
  const back = `/trips/${tripId}/expenses`;
  return (
    <EditExpense
      tripId={tripId}
      expenseId={expenseId}
      back={back}
      onClose={() => router.push(back)}
      onDone={() => router.replace(back)}
    />
  );
}
