import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { dateRangeLabel, dayCount } from "@/shared/lib/days";
import type { Trip } from "../model/types";

export function TripCard({ trip }: { trip: Trip }) {
  const nights = dayCount(trip.start_date, trip.end_date) - 1;
  return (
    <Link
      href={`/trips/${trip.id}/itinerary`}
      className="block rounded-xl border bg-card p-4 shadow-xs transition-colors active:bg-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold">{trip.title}</h2>
          {trip.destination && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {trip.destination}
            </p>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {nights === 0 ? "당일" : `${nights}박 ${nights + 1}일`}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
        <CalendarDays className="size-3.5" />
        {dateRangeLabel(trip.start_date, trip.end_date)}
      </p>
    </Link>
  );
}
