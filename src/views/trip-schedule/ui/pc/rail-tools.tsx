import { BedDouble, Plane } from "lucide-react";

type RailToolsProps = {
  stayCount: number;
  onOpenStays: () => void;
  flightCount: number;
  onOpenFlights: () => void;
};

/** 레일 아래 고정 도구 — 「항공편 N」 · 「숙소 N」 */
export function RailTools({ stayCount, onOpenStays, flightCount, onOpenFlights }: RailToolsProps) {
  return (
    <div className="flex shrink-0 gap-1.5 border-t border-divider p-3">
      <button
        type="button"
        onClick={onOpenFlights}
        className="flex h-9 flex-1 items-center gap-1.5 rounded-button bg-surface-muted px-3 text-[13px] font-bold text-ink-700 hover:bg-surface-sunken"
      >
        <Plane className="size-4" strokeWidth={2} />
        항공편{flightCount > 0 && <span className="text-ink-400">{flightCount}</span>}
      </button>
      <button
        type="button"
        onClick={onOpenStays}
        className="flex h-9 flex-1 items-center gap-1.5 rounded-button bg-surface-muted px-3 text-[13px] font-bold text-ink-700 hover:bg-surface-sunken"
      >
        <BedDouble className="size-4" strokeWidth={2} />
        숙소{stayCount > 0 && <span className="text-ink-400">{stayCount}</span>}
      </button>
    </div>
  );
}
