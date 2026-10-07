"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useCreateExpense } from "@/entities/expense";
import { ExpenseForm, FormLoadError, useExpenseFormData } from "@/features/expense/form";

import { spentOnFromParam } from "../lib/spent-on-param";

type ExpenseCreateViewProps = { tripId: string };

/**
 * 비용 추가 — 정산 인원 · 일정 · 대체 장소까지 읽은 뒤 폼을 연다. 새 비용은 모두와 나누는 게 기본이라 사람 목록이 처음 값이고,
 * 일정 연결은 처음 연결이 대체 장소인지로 합계 포함을 정한다
 */
export function ExpenseCreateView({ tripId }: ExpenseCreateViewProps) {
  const router = useRouter();
  const loaded = useExpenseFormData(tripId);
  const create = useCreateExpense(tripId);
  const period = useSearchParams().get("period");
  const back = `/trips/${tripId}/expenses`;

  if (loaded.failed) return <FormLoadError title="비용 추가" back={back} onRetry={loaded.retry} />;
  if (!loaded.data) return null;
  const { trip, currentUserId } = loaded.data;
  return (
    <ExpenseForm
      title="비용 추가"
      onClose={() => router.push(back)}
      {...loaded.data}
      defaultSpentOn={spentOnFromParam(period, trip.start_date, trip.end_date)}
      pending={create.isPending}
      submitError={create.error?.message}
      onSubmit={(values) =>
        create.mutate(
          { values, createdBy: currentUserId },
          { onSuccess: () => router.replace(back) },
        )
      }
    />
  );
}
