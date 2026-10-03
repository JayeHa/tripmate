import { cn } from "@/shared/lib/utils";

import type { TimelineRow } from "../../lib/timeline";
import { ReservationBadge } from "../reservation-badge";
import { AlternativesLine } from "./alternatives-line";
import { LinkChips } from "./link-chips";
import { MemoSection } from "./memo-section";

const TITLE_SIZE = {
  place: "text-[17px] font-bold",
  flight: "text-xl font-bold",
  note: "text-[15px] font-medium",
  move: "text-[17px] font-bold",
} satisfies Record<TimelineRow["kind"], string>;

type ItemCardProps = {
  row: TimelineRow;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
};

/** place · flight · note 의 카드. 식사(food)는 배경이 다르다 */
export function ItemCard({ row, open, onToggle, onOpen }: ItemCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-1.5 rounded-card border px-4.5 py-4 shadow-card",
        row.isMeal ? "border-meal-line bg-meal-bg" : "border-line-card bg-white",
      )}
    >
      {row.status && <ReservationBadge status={row.status} className="mb-0.5" />}
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "text-left leading-snug tracking-[-0.01em] text-pretty text-ink-900",
          TITLE_SIZE[row.kind],
        )}
      >
        {row.emoji && <span className="mr-1.5 font-normal">{row.emoji}</span>}
        {row.item.name}
      </button>
      {row.meta && <p className="text-sm text-ink-400">{row.meta}</p>}
      <AlternativesLine alternatives={row.alternatives} />
      <LinkChips links={row.links} />
      <MemoSection notes={row.notes} hours={row.hours} open={open} onToggle={onToggle} />
    </div>
  );
}
