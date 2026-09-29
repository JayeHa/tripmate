"use client";

import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { ExpenseForm } from "@/components/expense/expense-form";
import { useCreateExpense } from "@/hooks/use-expenses";
import { useScheduleItems } from "@/hooks/use-schedule-items";
import { useTrip } from "@/hooks/use-trip";
import { useTripMembers } from "@/hooks/use-trip-members";
import { useUser } from "@/hooks/use-user";

export default function NewExpensePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: items } = useScheduleItems(tripId);
  const { data: user } = useUser();
  const create = useCreateExpense(tripId);

  return (
    <>
      <AppHeader title="지출 추가" back={`/trips/${tripId}/expenses`} />
      <main className="flex-1 p-4">
        {trip && members && user && (
          <ExpenseForm
            trip={trip}
            members={members}
            items={items}
            currentUserId={user.id}
            submitLabel="저장"
            pending={create.isPending}
            onSubmit={(values) =>
              create.mutate(
                { values, createdBy: user.id },
                { onSuccess: () => router.replace(`/trips/${tripId}/expenses`) },
              )
            }
          />
        )}
        {create.error && <p className="mt-3 text-sm text-destructive">{create.error.message}</p>}
      </main>
    </>
  );
}
