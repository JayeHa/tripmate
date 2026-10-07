"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useTrip } from "@/entities/trip";
import { CreateExpense } from "@/features/expense/form";

import { spentOnFromParam } from "../lib/spent-on-param";

type ExpenseCreateViewProps = { tripId: string };

/** 비용 추가 페이지 — 주소의 period 로 처음 날짜를 정하고, 저장하면 가계부로 돌아간다 */
export function ExpenseCreateView({ tripId }: ExpenseCreateViewProps) {
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const period = useSearchParams().get("period");
  const back = `/trips/${tripId}/expenses`;
  // 처음 날짜를 여행 기간으로 계산해야 해서 여행을 읽은 뒤 연다(폼의 다른 데이터도 여행을 기다린다)
  if (!trip) return null;
  return (
    <CreateExpense
      tripId={tripId}
      back={back}
      defaultSpentOn={spentOnFromParam(period, trip.start_date, trip.end_date)}
      onClose={() => router.push(back)}
      onDone={() => router.replace(back)}
    />
  );
}
