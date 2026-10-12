import { Plus } from "lucide-react";

import { directionLabel, type Flight, flightDateLabel } from "@/entities/flight";
import { ReservationBadge, type ReservationStatus } from "@/entities/schedule-item";

import { FlightRoute } from "./flight-route";
import { ScheduleNotice } from "./schedule-notice";

type FlightListProps = {
  /** 출발 순 */
  flights: Flight[];
  onOpen: (id: string) => void;
  onAdd: () => void;
};

/** 항공편 목록 — 탑승권 카드, 비면 안내, 아래 점선 「항공편 추가」 와 운항 스케줄 안내 */
export function FlightList({ flights, onOpen, onAdd }: FlightListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-6">
      {flights.map((f, i) => (
        <FlightCard
          key={f.id}
          flight={f}
          direction={directionLabel(i, flights.length)}
          onClick={() => onOpen(f.id)}
        />
      ))}
      {flights.length === 0 && (
        <p className="py-12 text-center text-[15px] text-ink-400">등록된 항공편이 없어요.</p>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-13 shrink-0 items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-dashed text-[15px] font-bold text-brand-text"
      >
        <Plus className="size-4.5" strokeWidth={2.2} />
        항공편 추가
      </button>
      <ScheduleNotice />
    </div>
  );
}

type FlightCardProps = { flight: Flight; direction: string; onClick: () => void };

/** 탑승권 카드 — 위(상태 배지 · 「가는 편」 · 날짜 · 항공사 편명) + 노선 */
function FlightCard({ flight: f, direction, onClick }: FlightCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 flex-col gap-3.5 rounded-card border border-line-card px-4.5 py-4 text-left shadow-card"
    >
      <div className="flex w-full flex-col items-start gap-1.5">
        {f.status && (
          <ReservationBadge status={f.status as ReservationStatus} className="h-5.5 text-xs" />
        )}
        <div className="flex w-full min-w-0 items-center gap-2 text-[13px] whitespace-nowrap">
          <span className="font-bold text-brand-text">{direction}</span>
          <span className="text-ink-400">{flightDateLabel(f.dep_date)}</span>
          <span className="min-w-0 flex-1 truncate text-right font-bold text-ink-700">
            {f.airline_name} {f.airline_code}
            {f.flight_no}
          </span>
        </div>
      </div>
      <FlightRoute flight={f} />
    </button>
  );
}
