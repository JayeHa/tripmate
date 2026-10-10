import { BedDouble } from "lucide-react";

type RailToolsProps = {
  stayCount: number;
  onOpenStays: () => void;
};

/** 레일 아래 고정 도구 — 「숙소 N」. 항공편 버튼은 항공편 화면(#89)이 생길 때 붙인다 */
export function RailTools({ stayCount, onOpenStays }: RailToolsProps) {
  return (
    <div className="flex shrink-0 gap-1.5 border-t border-divider p-3">
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
