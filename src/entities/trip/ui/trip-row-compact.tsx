import Link from "next/link";
import { dateRangeLabel } from "@/shared/lib/days";
import type { TripListItem } from "../api/trips";
import { cityCountLabel, coverImageUrl } from "../lib/cities";
import { TripThumb } from "./trip-thumb";

type Props = {
  trip: TripListItem;
  /** 나를 뺀 일행 수 */
  companionCount?: number;
  /** 우측 `···`. 넘기지 않으면 그리지 않는다. */
  actions?: React.ReactNode;
};

/** PC 지난 여행의 한 줄 (시안 6a). 52px 원 + 제목과 한 줄 요약. */
export function TripRowCompact({ trip, companionCount, actions }: Props) {
  return (
    <div className="flex items-center gap-3.5 border-b border-surface-muted py-3">
      <Link href={`/trips/${trip.id}/home`} className="flex min-w-0 flex-1 items-center gap-3.5">
        <TripThumb
          title={trip.title}
          imageUrl={coverImageUrl(trip.cities)}
          size={52}
          className="size-[52px] text-[19px]"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-bold text-ink-900">{trip.title}</span>
          <span className="truncate text-[13px] text-ink-400">
            {dateRangeLabel(trip.start_date, trip.end_date)}
            {companionCount ? `, ${companionCount}명과 함께` : ""} · {cityCountLabel(trip.cities)}
          </span>
        </span>
      </Link>
      {actions}
    </div>
  );
}
