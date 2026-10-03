"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/shared/ui/app-header";
import { ExpenseForm } from "@/features/expense/form";
import { useCreateExpense } from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useTripMembers } from "@/entities/trip-member";
import { useUser } from "@/entities/session";

export function ExpenseCreateView({ tripId }: { tripId: string }) {
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
