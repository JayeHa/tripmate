"use client";

import { ChevronDown, ChevronUp, Footprints, MapPinOff, TrainFront } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/itinerary/format-leg";
import type { RouteLeg, ScheduleItem, TravelMode } from "@/lib/types";

type Props = {
  items: ScheduleItem[];
  legs?: RouteLeg[];
  travelMode?: TravelMode;
  highlightedId?: string | null;
  onSelect: (item: ScheduleItem) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

export function ScheduleList({
  items,
  legs = [],
  travelMode = "WALK",
  highlightedId,
  onSelect,
  onMoveUp,
  onMoveDown,
}: Props) {
  const legByFrom = new Map(legs.map((l) => [l.fromId, l]));
  const ModeIcon = travelMode === "TRANSIT" ? TrainFront : Footprints;

  return (
    <ol className="flex flex-col px-4">
      {items.map((item, i) => {
        const leg = legByFrom.get(item.id);
        const hasNext = i < items.length - 1;
        return (
          <li key={item.id} id={`item-${item.id}`} className="flex gap-3">
            <div className="flex w-7 flex-col items-center">
              <span
                className={
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                  (highlightedId === item.id
                    ? "bg-foreground text-background"
                    : "bg-primary text-primary-foreground")
                }
              >
                {i + 1}
              </span>
              {hasNext && <span className="my-1 w-px flex-1 border-l border-dashed" />}
            </div>
            <div className="flex min-w-0 flex-1 flex-col pb-4">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-1 rounded-lg border bg-card p-3 text-left shadow-xs active:bg-accent"
                >
                  <div className="flex items-baseline gap-2">
                    {item.start_time && (
                      <span className="shrink-0 text-xs font-medium text-muted-foreground">
                        {item.start_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="truncate font-medium">{item.name}</span>
                    {item.lat == null && (
                      <MapPinOff className="size-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  {item.address && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.address}</p>
                  )}
                  {item.memo && (
                    <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
                      {item.memo}
                    </p>
                  )}
                </button>
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="위로"
                    disabled={i === 0}
                    onClick={() => onMoveUp(i)}
                    className="rounded p-1 text-muted-foreground disabled:opacity-30 active:bg-accent"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="아래로"
                    disabled={!hasNext}
                    onClick={() => onMoveDown(i)}
                    className="rounded p-1 text-muted-foreground disabled:opacity-30 active:bg-accent"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
              </div>
              {hasNext && leg && (
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <ModeIcon className="size-3.5" />
                  {formatDuration(leg.durationSec)} · {formatDistance(leg.distanceM)}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
