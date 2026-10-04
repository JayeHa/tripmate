import Link from "next/link";

import { dateRangeLabel, ddayLabel } from "@/shared/lib/days";
import { Badge } from "@/shared/ui/badge";

import type { TripListItem } from "../api/trips";
import { cityCountLabel, coverImageUrl } from "../lib/cities";
import { TripThumb } from "./trip-thumb";

type Props = {
  trip: TripListItem;
  today: string;
  /** 나를 뺀 일행 수 */
  companionCount?: number;
  /** 우측 `···`. 넘기지 않으면 그리지 않는다. */
  actions?: React.ReactNode;
};

/** 모바일 여행 목록의 한 줄. */
export function TripRow({ trip, today, companionCount, actions }: Props) {
  const dday = ddayLabel(trip.start_date, today);
  return (
    <div className="flex items-center gap-4 px-5 py-3">
      <Link href={`/trips/${trip.id}/home`} className="flex min-w-0 flex-1 items-center gap-4">
        <TripThumb title={trip.title} imageUrl={coverImageUrl(trip.cities)} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-lg font-bold tracking-[-0.01em] text-ink-900">
              {trip.title}
            </span>
            {dday && (
              <Badge className="shrink-0 bg-status-ok-bg text-[11px] font-bold text-status-ok">
                {dday}
              </Badge>
            )}
          </span>
          <span className="text-sm text-ink-500">
            {dateRangeLabel(trip.start_date, trip.end_date)}
            {companionCount ? `, ${companionCount}명과 함께` : ""}
          </span>
          <span className="text-[13px] text-ink-400">{cityCountLabel(trip.cities)}</span>
        </span>
      </Link>
      {actions}
    </div>
  );
}
