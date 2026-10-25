"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { EditExpense } from "@/features/expense/form";
import { NAV } from "@/shared/lib/nav-transition";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

type ExpenseEditViewProps = { tripId: string; expenseId: string };

/** 비용 수정 페이지 — 비용 상세에서 온다. 닫거나 저장하면 상세로, 지우면 가계부로 돌아간다 */
export function ExpenseEditView({ tripId, expenseId }: ExpenseEditViewProps) {
  const router = useRouter();
  const list = `/trips/${tripId}/expenses`;
  const detail = `${list}/${expenseId}`;
  const [toast, setToast] = useState<ToastMessage | null>(null);
  return (
    <>
      <EditExpense
        tripId={tripId}
        expenseId={expenseId}
        back={detail}
        onClose={() => router.replace(detail, { transitionTypes: NAV.back })}
        onDone={() => router.replace(detail, { transitionTypes: NAV.back })}
        onDeleted={() => router.replace(list, { transitionTypes: NAV.back })}
        onToast={(text) => setToast({ text, id: Date.now() })}
      />
      {/* 입력 칸 고정 · 풀기 알림 — 이 화면이 하나를 그린다 */}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
