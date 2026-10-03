"use client";

import { Footprints, TrainFront } from "lucide-react";
import { useMemo, useState } from "react";
import { AppHeader } from "@/shared/ui/app-header";
import { DayChips } from "@/features/schedule/day-selector";
import { formatDistance, formatDuration } from "@/entities/schedule-item";
import { DayMap } from "@/views/trip-map/ui/day-map";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";
import { useDayParam } from "@/features/schedule/day-selector";
import { useDayRoute } from "@/entities/schedule-item";
import { useScheduleItems } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { dayCount } from "@/shared/lib/days";
import type { TravelMode } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

export function TripMapView({ tripId }: { tripId: string }) {
  const { data: trip } = useTrip(tripId);
  const { data: items } = useScheduleItems(tripId);
  const totalDays = trip ? dayCount(trip.start_date, trip.end_date) : 1;
  const [day, setDay] = useDayParam(totalDays);
  const [mode, setMode] = useState<TravelMode>("WALK");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dayItems = useMemo(() => (items ?? []).filter((it) => it.day_index === day), [items, day]);
  const locatedCount = dayItems.filter((it) => it.lat != null).length;
  const route = useDayRoute(tripId, day, mode, locatedCount >= 2);
  const legByFrom = new Map((route.data?.legs ?? []).map((l) => [l.fromId, l]));
  const ModeIcon = mode === "TRANSIT" ? TrainFront : Footprints;

  return (
    <div className="flex h-dvh flex-col pb-16">
      <AppHeader
        title={trip?.title ?? "지도"}
        back={`/trips/${tripId}/schedule?day=${day}`}
        right={
          <ToggleGroup
            value={[mode]}
            onValueChange={(v) => v[0] && setMode(v[0] as TravelMode)}
            size="sm"
          >
            <ToggleGroupItem value="WALK" aria-label="도보">
              <Footprints />
            </ToggleGroupItem>
            <ToggleGroupItem value="TRANSIT" aria-label="대중교통">
              <TrainFront />
            </ToggleGroupItem>
          </ToggleGroup>
        }
      />
      {trip && (
        <DayChips startDate={trip.start_date} totalDays={totalDays} value={day} onChange={setDay} />
      )}

      <div className="relative min-h-0 flex-1">
        <DayMap
          items={dayItems}
          polyline={route.data?.polyline}
          selectedId={selectedId}
          onSelect={(it) => {
            setSelectedId(it.id);
            document
              .getElementById(`chip-${it.id}`)
              ?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
          }}
        />
        {locatedCount === 0 && (
          <div className="absolute inset-x-4 top-4 rounded-lg bg-background/90 p-3 text-center text-sm shadow">
            이 날에는 지도에 표시할 장소가 없어요
          </div>
        )}
        {route.isFetching && (
          <div className="absolute top-4 right-4 rounded-full bg-background/90 px-3 py-1 text-xs shadow">
            경로 계산 중...
          </div>
        )}
        {route.error && (
          <div className="absolute inset-x-4 top-4 rounded-lg bg-destructive/10 p-3 text-center text-xs text-destructive shadow">
            {route.error.message}
          </div>
        )}
      </div>

      {dayItems.length > 0 && (
        <div className="flex gap-2 overflow-x-auto border-t bg-background px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dayItems.map((it, i) => {
            const leg = legByFrom.get(it.id);
            return (
              <div key={it.id} className="flex items-center gap-2">
                <button
                  type="button"
                  id={`chip-${it.id}`}
                  onClick={() => setSelectedId(it.id)}
                  className={cn(
                    "flex w-44 shrink-0 flex-col rounded-lg border p-2 text-left",
                    selectedId === it.id ? "border-foreground" : "bg-card",
                  )}
                >
                  <span className="text-xs text-muted-foreground">
                    {i + 1}
                    {it.start_time && ` · ${it.start_time.slice(0, 5)}`}
                  </span>
                  <span className="truncate text-sm font-medium">{it.name}</span>
                </button>
                {leg && (
                  <span className="flex shrink-0 flex-col items-center text-[10px] text-muted-foreground">
                    <ModeIcon className="size-3.5" />
                    {formatDuration(leg.durationSec)}
                    <span>{formatDistance(leg.distanceM)}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
