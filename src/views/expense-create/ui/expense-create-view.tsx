"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { useCreateExpense, useTripGuests } from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { ExpenseForm, FormLoadError } from "@/features/expense/form";

import { spentOnFromParam } from "../lib/spent-on-param";

type ExpenseCreateViewProps = { tripId: string };

/** 비용 추가 — 정산 인원까지 읽은 뒤 폼을 연다(새 비용은 모두와 나누는 게 기본이라 사람 목록이 처음 값이다) */
export function ExpenseCreateView({ tripId }: ExpenseCreateViewProps) {
  const router = useRouter();
  const tripQuery = useTrip(tripId);
  const membersQuery = useTripMembers(tripId);
  const guestsQuery = useTripGuests(tripId);
  const trip = tripQuery.data;
  const members = membersQuery.data;
  const guests = guestsQuery.data;
  const { data: items } = useScheduleItems(tripId);
  const { data: user } = useUser();
  const create = useCreateExpense(tripId);
  const period = useSearchParams().get("period");
  const back = `/trips/${tripId}/expenses`;

  const loads = [tripQuery, membersQuery, guestsQuery];
  // 기기에 저장된 값이 있으면 다시 읽기가 실패해도 그 값으로 연다 — 값이 없을 때만 안내
  if (loads.some((q) => q.isError && q.data === undefined))
    return (
      <FormLoadError
        title="비용 추가"
        back={back}
        onRetry={() => loads.forEach((q) => void q.refetch())}
      />
    );
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
