"use client";

import { LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/layout/app-header";
import { TripCard } from "@/components/trip/trip-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/hooks/use-trip";
import { useSignOut } from "@/hooks/use-user";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TripsPage() {
  const { data: trips, isPending, error } = useTrips();
  const signOut = useSignOut();
  const today = todayISO();
  const upcoming = (trips ?? [])
    .filter((t) => t.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const past = (trips ?? []).filter((t) => t.end_date < today);

  return (
    <>
      <AppHeader
        title="내 여행"
        right={
          <Button variant="ghost" size="icon" aria-label="로그아웃" onClick={signOut}>
            <LogOut />
          </Button>
        }
      />
      <main className="flex flex-1 flex-col gap-6 p-4 pb-24">
        {isPending && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        )}
        {error && <p className="text-sm text-destructive">불러오지 못했어요: {error.message}</p>}

        {trips && trips.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-lg font-medium">아직 여행이 없어요</p>
            <p className="text-sm text-muted-foreground">첫 여행을 만들어 일정을 짜보세요.</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">다가오는 여행</h2>
            {upcoming.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </section>
        )}

        {past.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">지난 여행</h2>
            {past.map((t) => (
              <TripCard key={t.id} trip={t} />
            ))}
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Button size="lg" className="shadow-lg" render={<Link href="/trips/new" />}>
          <Plus /> 새 여행
        </Button>
      </div>
    </>
  );
}
