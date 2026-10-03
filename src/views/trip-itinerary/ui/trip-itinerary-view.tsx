"use client";

import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "@/shared/ui/app-header";
import { DayChips } from "@/features/day-selector";
import { PlaceSearchSheet, type PickedPlace } from "@/features/place-search";
import { ScheduleItemForm } from "@/features/schedule-item-form";
import { ScheduleList } from "@/entities/schedule-item";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useDayParam } from "@/features/day-selector";
import { useDayRoute } from "@/entities/schedule-item";
import {
  useCreateScheduleItem,
  useDeleteScheduleItem,
  useMoveScheduleItemToDay,
  useScheduleItems,
  useSwapScheduleItems,
  useUpdateScheduleItem,
} from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useUser } from "@/entities/session";
import { dayCount } from "@/shared/lib/days";
import type { ScheduleItem } from "@/entities/schedule-item";

export function TripItineraryView() {
  const { tripId } = useParams<{ tripId: string }>();
  const { data: trip } = useTrip(tripId);
  const { data: user } = useUser();
  const { data: items, isPending } = useScheduleItems(tripId);
  const totalDays = trip ? dayCount(trip.start_date, trip.end_date) : 1;
  const [day, setDay] = useDayParam(totalDays);

  const [searchOpen, setSearchOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);

  const create = useCreateScheduleItem(tripId);
  const update = useUpdateScheduleItem(tripId);
  const remove = useDeleteScheduleItem(tripId);
  const swap = useSwapScheduleItems(tripId);
  const moveDay = useMoveScheduleItemToDay(tripId);

  const dayItems = useMemo(() => (items ?? []).filter((it) => it.day_index === day), [items, day]);

  const locatedCount = dayItems.filter((it) => it.lat != null).length;
  const route = useDayRoute(tripId, day, "WALK", locatedCount >= 2);

  const bias = useMemo(() => {
    const first = dayItems.find((it) => it.lat != null && it.lng != null);
    return first ? { lat: first.lat!, lng: first.lng! } : null;
  }, [dayItems]);

  function addPlace(place: PickedPlace) {
    create.mutate({ trip_id: tripId, day_index: day, created_by: user?.id ?? null, ...place });
  }

  return (
    <>
      <AppHeader title={trip?.title ?? "일정"} back="/trips" />
      {trip && (
        <DayChips startDate={trip.start_date} totalDays={totalDays} value={day} onChange={setDay} />
      )}

      <main className="flex flex-1 flex-col pt-2 pb-24">
        {isPending && (
          <div className="flex flex-col gap-3 px-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        )}
        {!isPending && dayItems.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">아직 일정이 없어요</p>
            <p className="text-sm text-muted-foreground">아래 버튼으로 장소를 추가해보세요.</p>
          </div>
        )}
        <ScheduleList
          items={dayItems}
          legs={route.data?.legs}
          onSelect={setEditing}
          onMoveUp={(i) => swap.mutate({ a: dayItems[i], b: dayItems[i - 1] })}
          onMoveDown={(i) => swap.mutate({ a: dayItems[i], b: dayItems[i + 1] })}
        />
      </main>

      <div className="fixed inset-x-0 bottom-16 z-20 flex justify-center p-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <Button size="lg" className="shadow-lg" onClick={() => setSearchOpen(true)}>
          <Plus /> 장소 추가
        </Button>
      </div>

      <PlaceSearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        bias={bias}
        onPick={addPlace}
      />

      {trip && (
        <ScheduleItemForm
          item={editing}
          startDate={trip.start_date}
          totalDays={totalDays}
          pending={update.isPending}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            if (!editing) return;
            update.mutate({ id: editing.id, patch }, { onSuccess: () => setEditing(null) });
          }}
          onMoveDay={(dayIndex) => {
            if (!editing || dayIndex === editing.day_index) return;
            moveDay.mutate({ item: editing, dayIndex }, { onSuccess: () => setEditing(null) });
          }}
          onDelete={() => {
            if (!editing) return;
            remove.mutate(editing.id, { onSuccess: () => setEditing(null) });
          }}
        />
      )}
    </>
  );
}
