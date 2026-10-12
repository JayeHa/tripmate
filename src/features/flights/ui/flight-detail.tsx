import type { ReactNode } from "react";

import { airportName, type Flight, flightDateLabel, hhmm } from "@/entities/flight";
import { ReservationBadge, type ReservationStatus } from "@/entities/schedule-item";

import { FlightRoute } from "./flight-route";
import { ScheduleNotice } from "./schedule-notice";

type FlightDetailProps = {
  flight: Flight;
  /** 「가는 편」 · 「오는 편」 · 「항공편」 */
  direction: string;
  /** 표 바로 위 — 결제 예정일 지남 안내 */
  banner?: ReactNode;
  /** 표 아래 칸들(결제 · 연결된 비용 · 메모) */
  children?: ReactNode;
};

/**
 * 항공편 상세 — 탑승권(상태 배지 · 방향 · 날짜 · 노선) · 정보 표(항공편 · 출발 · 도착 · 예약번호). 예약번호가 없으면 그 줄은 숨긴다.
 * 표 위에 받은 안내, 아래에 받은 칸(결제 · 연결된 비용 · 메모)을 그린다. 바우처 · 체크리스트는 노트 단계에서 붙인다
 */
export function FlightDetail({ flight: f, direction, banner, children }: FlightDetailProps) {
  const rows: [string, string][] = [
    ["항공편", `${f.airline_name} · ${f.airline_code}${f.flight_no}`],
    ["출발", `${flightDateLabel(f.dep_date)} ${hhmm(f.dep_time)} · ${airportName(f.dep_airport)}`],
    ["도착", `${flightDateLabel(f.arr_date)} ${hhmm(f.arr_time)} · ${airportName(f.arr_airport)}`],
  ];
  if (f.booking_ref) rows.push(["예약번호", f.booking_ref]);
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 pt-2 pb-7">
      <div className="flex flex-col gap-3.5 rounded-card border border-line-card px-4.5 py-4 shadow-card">
        <div className="flex items-center gap-2 text-[13px]">
          {f.status && (
            <ReservationBadge status={f.status as ReservationStatus} className="h-5.5 text-xs" />
          )}
          <span className="font-bold text-brand-text">{direction}</span>
          <span className="text-ink-400">{flightDateLabel(f.dep_date)}</span>
        </div>
        <FlightRoute flight={f} />
      </div>
      {banner}
      <dl className="flex flex-col">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 border-b border-surface-muted py-2.75">
            <dt className="w-18 shrink-0 text-sm text-ink-400">{label}</dt>
            <dd className="min-w-0 flex-1 text-sm font-semibold wrap-break-word text-ink-900">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {children}
      <ScheduleNotice />
    </div>
  );
}
