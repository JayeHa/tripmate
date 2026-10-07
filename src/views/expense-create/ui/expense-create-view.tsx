"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { CreateExpense } from "@/features/expense/form";

type ExpenseCreateViewProps = { tripId: string };

/** 비용 추가 페이지 — 주소의 period 로 처음 날짜를 정하고, 저장하면 가계부로 돌아간다 */
export function ExpenseCreateView({ tripId }: ExpenseCreateViewProps) {
  const router = useRouter();
  const period = useSearchParams().get("period");
  const back = `/trips/${tripId}/expenses`;
  return (
    <CreateExpense
      tripId={tripId}
      back={back}
      period={period}
      onClose={() => router.push(back)}
      onDone={() => router.replace(back)}
    />
  );
}
