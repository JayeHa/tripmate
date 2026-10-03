import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { dateRangeLabel, ddayLabel } from "@/shared/lib/days";
import type { Trip } from "../model/types";
import { TripThumb } from "./trip-thumb";

type Props = {
  trip: Trip;
  today: string;
  /** 나를 뺀 일행 수 */
  companionCount?: number;
  /** 방금 만들거나 수정한 여행을 잠깐 강조한다. */
  highlighted?: boolean;
  /** 우측 `···`. 넘기지 않으면 그리지 않는다. */
  actions?: React.ReactNode;
};

/** 모바일 여행 목록의 한 줄 (시안 5a). */
export function TripRow({ trip, today, companionCount, highlighted, actions }: Props) {
  const dday = ddayLabel(trip.start_date, today);
  return (
    <div
      className="flex items-center gap-4 px-5 py-3"
      style={highlighted ? { backgroundColor: "#F4F8FF" } : undefined}
    >
      <Link href={`/trips/${trip.id}/home`} className="flex min-w-0 flex-1 items-center gap-4">
        <TripThumb title={trip.title} />
        <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
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
          <span className="text-[13px] text-ink-400">{trip.destination ?? "목적지 미정"}</span>
        </span>
      </Link>
      {actions}
    </div>
  );
}
