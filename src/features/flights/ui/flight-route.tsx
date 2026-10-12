import { Plane } from "lucide-react";

import {
  airportName,
  dayDiff,
  durationLabel,
  type Flight,
  flightMinutes,
  hhmm,
} from "@/entities/flight";
import { cn } from "@/shared/lib/utils";

type FlightRouteProps = { flight: Flight };

/**
 * 탑승권의 노선 3열 — 출발(공항 코드 26/800 · 시각 · 공항 이름) | 소요 · 비행기 선 · 「+1일」(빨강) 또는 「직항」 | 도착.
 * 소요는 두 공항의 시간대로 계산하고, 모르는 공항(직접 넣은 코드)이면 비운다
 */
export function FlightRoute({ flight: f }: FlightRouteProps) {
  const days = dayDiff(f);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
      <End code={f.dep_airport} time={hhmm(f.dep_time)} />
      <div className="flex min-w-20 flex-col items-center gap-1">
        <span className="h-4 text-xs text-ink-400">{durationLabel(flightMinutes(f))}</span>
        <div className="flex w-full items-center gap-1">
          <span className="h-px flex-1 bg-line-strong" />
          <Plane className="size-4 text-brand" aria-hidden="true" />
          <span className="h-px flex-1 bg-line-strong" />
        </div>
        <span className={cn("text-xs", days > 0 ? "text-destructive" : "text-ink-350")}>
          {days > 0 ? `+${days}일` : "직항"}
        </span>
      </div>
      <End code={f.arr_airport} time={hhmm(f.arr_time)} end />
    </div>
  );
}

type EndProps = { code: string; time: string; end?: boolean };

/** 한쪽 끝 — 코드 · 시각 · 공항 이름(도착은 오른쪽 정렬) */
function End({ code, time, end = false }: EndProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", end && "items-end text-right")}>
      <span className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">{code}</span>
      <span className="text-sm font-bold text-ink-900">{time}</span>
      <span className="max-w-full truncate text-xs text-ink-400">{airportName(code)}</span>
    </div>
  );
}
