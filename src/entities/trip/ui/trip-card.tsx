import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { dateRangeLabel, ddayLabel } from "@/shared/lib/days";
import { initialOf, tintOf } from "../lib/tint";
import type { Trip } from "../model/types";

type Props = {
  trip: Trip;
  today: string;
  /** 나를 뺀 일행 수 */
  companionCount?: number;
  /** 제목 옆 `···`. 넘기지 않으면 그리지 않는다. */
  actions?: React.ReactNode;
};

/** PC 다가오는 여행 카드 (시안 6a). 썸네일 132 + 본문. */
export function TripCard({ trip, today, companionCount, actions }: Props) {
  const dday = ddayLabel(trip.start_date, today);
  const { bg, fg } = tintOf(trip.title);
  return (
    // 카드 전체가 링크지만 `···` 는 링크 밖이어야 한다. 제목 링크를 카드 전체로 늘린다.
    <div className="relative rounded-card border border-line-card bg-white shadow-card">
      <div
        aria-hidden="true"
        className="flex h-[132px] items-center justify-center rounded-t-[11px] text-[44px] font-extrabold"
        style={{ backgroundColor: bg, color: fg }}
      >
        {initialOf(trip.title)}
      </div>
      <div className="flex flex-col gap-1 px-[18px] pt-4 pb-[18px]">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/trips/${trip.id}/home`}
            className="truncate text-lg font-bold tracking-[-0.01em] text-ink-900 after:absolute after:inset-0 after:rounded-card"
          >
            {trip.title}
          </Link>
          {dday && (
            <Badge className="shrink-0 bg-status-ok-bg text-[11px] font-bold text-status-ok">
              {dday}
            </Badge>
          )}
          <div className="relative ml-auto flex shrink-0">{actions}</div>
        </div>
        <span className="text-sm text-ink-500">
          {dateRangeLabel(trip.start_date, trip.end_date)}
          {companionCount ? `, ${companionCount}명과 함께` : ""}
        </span>
        <span className="text-[13px] text-ink-400">{trip.destination ?? "목적지 미정"}</span>
      </div>
    </div>
  );
}
