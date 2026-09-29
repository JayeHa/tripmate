"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AppHeader } from "@/components/layout/app-header";
import { InviteLinkCard } from "@/components/trip/invite-link-card";
import { MemberList } from "@/components/trip/member-list";
import { TripForm } from "@/components/trip/trip-form";
import { Button } from "@/components/ui/button";
import { useDeleteTrip, useTrip, useUpdateTrip } from "@/hooks/use-trip";
import { useRemoveMember, useTripMembers } from "@/hooks/use-trip-members";
import { useUser } from "@/hooks/use-user";
import { ratesToForm } from "@/lib/queries/trips";

export default function SettingsPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: user } = useUser();
  const update = useUpdateTrip(tripId);
  const remove = useDeleteTrip();
  const removeMember = useRemoveMember(tripId);
  const [saved, setSaved] = useState(false);

  if (!trip) return <AppHeader title="설정" back={`/trips/${tripId}/itinerary`} />;

  const isOwner = user?.id === trip.owner_id;

  return (
    <>
      <AppHeader title="여행 설정" back={`/trips/${tripId}/itinerary`} />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <InviteLinkCard trip={trip} />

        {members && (
          <MemberList
            members={members}
            currentUserId={user?.id}
            ownerId={trip.owner_id}
            onRemove={(userId) =>
              removeMember.mutate(userId, {
                onSuccess: () => {
                  if (userId === user?.id) router.replace("/trips");
                },
              })
            }
          />
        )}

        <section className="rounded-xl border bg-card p-4">
          <h2 className="mb-4 font-semibold">여행 정보</h2>
          <TripForm
            key={trip.updated_at}
            initial={{
              title: trip.title,
              destination: trip.destination ?? "",
              start_date: trip.start_date,
              end_date: trip.end_date,
              home_currency: trip.home_currency,
              rates: ratesToForm(trip.exchange_rates),
            }}
            submitLabel={saved ? "저장됨" : "저장"}
            pending={update.isPending}
            onSubmit={(values) =>
              update.mutate(values, {
                onSuccess: () => {
                  setSaved(true);
                  setTimeout(() => setSaved(false), 1500);
                },
              })
            }
          />
          {update.error && <p className="mt-2 text-sm text-destructive">{update.error.message}</p>}
        </section>

        {isOwner && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" className="w-full" />}>
              여행 삭제
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>여행을 삭제할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  일정, 가계부, 멤버 정보가 모두 삭제되고 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    remove.mutate(tripId, { onSuccess: () => router.replace("/trips") })
                  }
                >
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </>
  );
}
