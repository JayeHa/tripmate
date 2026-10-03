"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { TripForm } from "@/components/trip/trip-form";
import { useCreateTrip } from "@/hooks/use-trip";
import { useUser } from "@/hooks/use-user";

export function TripCreateView() {
  const router = useRouter();
  const { data: user } = useUser();
  const create = useCreateTrip();

  return (
    <>
      <AppHeader title="새 여행" back="/trips" />
      <main className="flex-1 p-4">
        <TripForm
          submitLabel="여행 만들기"
          pending={create.isPending}
          onSubmit={(values) => {
            if (!user) return;
            create.mutate(
              { values, ownerId: user.id },
              { onSuccess: (trip) => router.replace(`/trips/${trip.id}/itinerary`) },
            );
          }}
        />
        {create.error && <p className="mt-3 text-sm text-destructive">{create.error.message}</p>}
      </main>
    </>
  );
}
