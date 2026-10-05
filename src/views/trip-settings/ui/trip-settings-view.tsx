"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useUser } from "@/entities/session";
import { ratesToForm, useDeleteTrip, useTrip, useUpdateTrip } from "@/entities/trip";
import { MemberList, useRemoveMember, useTripMembers } from "@/entities/trip-member";
import { TripForm } from "@/features/trip/form";
import { InviteLinkCard } from "@/features/trip/invite-member";
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
} from "@/shared/ui/alert-dialog";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";

type TripSettingsViewProps = { tripId: string };

export function TripSettingsView({ tripId }: TripSettingsViewProps) {
  const router = useRouter();
  const { data: trip } = useTrip(tripId);
  const { data: members } = useTripMembers(tripId);
  const { data: user } = useUser();
  const update = useUpdateTrip(tripId);
  const remove = useDeleteTrip();
  const removeMember = useRemoveMember(tripId);
  const [saved, setSaved] = useState(false);

  if (!trip) return <AppHeader title="설정" back="/trips" />;

  const isOwner = user?.id === trip.owner_id;

  return (
    <>
      <AppHeader title="여행 설정" back="/trips" />
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
                  variant="danger"
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
