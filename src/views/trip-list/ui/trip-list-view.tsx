"use client";

import { Ellipsis, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { type Trip, TripRow, useDeleteTrip, useTrips } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { Skeleton } from "@/shared/ui/skeleton";
import { Wordmark } from "@/shared/ui/wordmark";
import { DeleteTripDialog } from "./delete-trip-dialog";
import { TripActionsSheet } from "./trip-actions-sheet";

/** 다가오는 / 지난 여행으로 가른다. 다가오는 건 가까운 순, 지난 건 최근 순. */
function groupTrips<T extends Pick<Trip, "start_date" | "end_date">>(trips: T[], today: string) {
  const sorted = [...trips].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return [
    { title: "다가오는 여행", trips: sorted.filter((t) => t.end_date >= today) },
    { title: "지난 여행", trips: sorted.filter((t) => t.end_date < today).reverse() },
  ].filter((g) => g.trips.length > 0);
}

export function TripListView() {
  const router = useRouter();
  const { data: trips, isPending, error } = useTrips();
  const deleteTrip = useDeleteTrip();
  const [sheetFor, setSheetFor] = useState<Trip | null>(null);
  const [confirmFor, setConfirmFor] = useState<Trip | null>(null);

  const today = todayISO();
  const groups = useMemo(() => groupTrips(trips ?? [], today), [trips, today]);

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex h-13 shrink-0 items-center justify-between px-5">
        <Wordmark className="text-[22px]" />
        <Link href="/trips/new" aria-label="새 여행" className="flex p-1 text-ink-900">
          <Plus className="size-6" strokeWidth={2.4} />
        </Link>
      </header>

      <div className="flex flex-1 flex-col pb-[calc(34px+env(safe-area-inset-bottom))]">
        <div className="flex items-baseline gap-2 px-5 pt-2.5">
          <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">내 여행</h1>
          {trips && <span className="text-[17px] font-extrabold text-primary">{trips.length}</span>}
        </div>

        <div className="px-5 pt-5 pb-1">
          <Link
            href="/trips/new"
            className="flex items-center gap-3.5 rounded-card bg-surface-sunken p-[18px]"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary">
              <Plus className="size-6 text-white" strokeWidth={2.4} />
            </span>
            <span className="flex flex-col gap-[3px]">
              <span className="text-base font-bold text-ink-900">여행 일정 만들기</span>
              <span className="text-[13px] text-ink-400">도시와 날짜만 고르면 바로 시작돼요</span>
            </span>
          </Link>
        </div>

        {isPending && (
          <div className="flex flex-col gap-3 px-5 pt-6">
            <Skeleton className="h-16 rounded-card" />
            <Skeleton className="h-16 rounded-card" />
          </div>
        )}

        {error && (
          <p className="px-5 pt-6 text-sm text-destructive">불러오지 못했어요: {error.message}</p>
        )}

        {trips?.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-20 text-center">
            <p className="text-[17px] font-bold text-ink-900">아직 여행이 없어요</p>
            <p className="text-sm text-ink-400">첫 여행을 만들어 일정을 짜보세요.</p>
          </div>
        )}

        {groups.map((group) => (
          <section key={group.title} className="pt-6">
            <h2 className="px-5 pb-1.5 text-[17px] font-extrabold text-ink-900">{group.title}</h2>
            {group.trips.map((trip) => (
              <TripRow
                key={trip.id}
                trip={trip}
                today={today}
                companionCount={trip.companionCount}
                actions={
                  <button
                    type="button"
                    aria-label={`${trip.title} 메뉴`}
                    onClick={() => setSheetFor(trip)}
                    className="-m-2 flex shrink-0 p-2 text-ink-700"
                  >
                    <Ellipsis className="size-[22px]" />
                  </button>
                }
              />
            ))}
          </section>
        ))}
      </div>

      <TripActionsSheet
        trip={sheetFor}
        onClose={() => setSheetFor(null)}
        onEdit={(trip) => {
          setSheetFor(null);
          router.push(`/trips/${trip.id}/settings`);
        }}
        onDelete={(trip) => {
          setSheetFor(null);
          setConfirmFor(trip);
        }}
      />
      <DeleteTripDialog
        trip={confirmFor}
        pending={deleteTrip.isPending}
        onCancel={() => setConfirmFor(null)}
        onConfirm={(trip) => deleteTrip.mutate(trip.id, { onSettled: () => setConfirmFor(null) })}
      />
    </main>
  );
}
