import Link from "next/link";

import { dateRangeLabel } from "@/shared/lib/days";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

type HeroDatesProps = {
  tripId: string;
  startDate: string;
  endDate: string;
  /** 줄 바깥 여백 */
  className?: string;
  /** 날짜 pill 크기 — 모바일 36, PC 40 */
  pillClassName: string;
};

/**
 * 히어로의 날짜 pill(어두운 반투명 바탕 · 줄바꿈 없음) + 「편집」.
 * 「편집」 은 여행 편집 메뉴가 생기기 전까지 설정 화면(제목 · 날짜 · 일행 초대)으로 보낸다
 */
export function HeroDates({
  tripId,
  startDate,
  endDate,
  className,
  pillClassName,
}: HeroDatesProps) {
  return (
    <div className={cn("flex items-center gap-3 text-[15px]", className)}>
      <span
        className={cn(
          "flex shrink-0 items-center rounded-full bg-black/16 font-bold whitespace-nowrap",
          pillClassName,
        )}
      >
        {dateRangeLabel(startDate, endDate)}
      </span>
      <Link
        href={`/trips/${tripId}/settings`}
        transitionTypes={NAV.tab}
        className="font-semibold whitespace-nowrap"
      >
        편집
      </Link>
    </div>
  );
}
