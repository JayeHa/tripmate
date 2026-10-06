"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useCreateExpense, useTripGuests } from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { ExpenseForm } from "@/features/expense/form";

import { spentOnFromParam } from "../lib/spent-on-param";

type ExpenseCreateViewProps = { tripId: string };

/** 비용 추가 — 정산 인원까지 읽은 뒤 폼을 연다(새 비용은 모두와 나누는 게 기본이라 사람 목록이 처음 값이다) */
export function ExpenseCreateView({ tripId }: ExpenseCreateViewProps) {
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: guests } = useTripGuests(tripId);
  const { data: items } = useScheduleItems(tripId);
  const { data: user } = useUser();
  const create = useCreateExpense(tripId);
  const period = useSearchParams().get("period");
  const back = `/trips/${tripId}/expenses`;

  if (!trip || !members || !guests || !user) return null;
  return (
    <ExpenseForm
      title="비용 추가"
      onClose={() => router.push(back)}
      trip={trip}
      members={members}
      guests={guests}
      items={items}
      currentUserId={user.id}
      defaultSpentOn={spentOnFromParam(period, trip.start_date, trip.end_date)}
      pending={create.isPending}
      submitError={create.error?.message}
      onSubmit={(values) =>
        create.mutate({ values, createdBy: user.id }, { onSuccess: () => router.replace(back) })
      }
    />
  );
}
