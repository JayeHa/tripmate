"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { CreateExpense } from "@/features/expense/form";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

type ExpenseCreateViewProps = { tripId: string };

/** 비용 추가 페이지 — 주소의 period 로 처음 날짜를 정하고, 저장하면 가계부로 돌아간다 */
export function ExpenseCreateView({ tripId }: ExpenseCreateViewProps) {
  const router = useRouter();
  const period = useSearchParams().get("period");
  const back = `/trips/${tripId}/expenses`;
  const [toast, setToast] = useState<ToastMessage | null>(null);
  return (
    <>
      <CreateExpense
        tripId={tripId}
        back={back}
        period={period}
        onClose={() => router.push(back)}
        onDone={() => router.replace(back)}
        onToast={(text) => setToast({ text, id: Date.now() })}
      />
      {/* 입력 칸 고정 · 풀기 알림 — 이 화면이 하나를 그린다 */}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
