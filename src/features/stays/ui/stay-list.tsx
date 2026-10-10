import { Plus } from "lucide-react";

import { ReservationBadge, type ReservationStatus } from "@/entities/schedule-item";
import { nightsOf, type Stay, stayMomentLabel } from "@/entities/stay";

import { STAY_DEFAULT_EMOJI } from "../lib/stay-form";

type StayListProps = {
  stays: Stay[];
  onOpen: (id: string) => void;
  onAdd: () => void;
};

/** 숙소 목록 — 카드(아이콘 · 이름 · 주소 · 상태 · N박 · 체크인 | 체크아웃), 비면 안내, 아래 점선 「숙소 추가」 */
export function StayList({ stays, onOpen, onAdd }: StayListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-2 pb-6">
      {stays.map((s) => (
        <StayCard key={s.id} stay={s} onClick={() => onOpen(s.id)} />
      ))}
      {stays.length === 0 && (
        <p className="py-12 text-center text-[15px] text-ink-400">등록된 숙소가 없어요.</p>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="flex h-13 shrink-0 items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-dashed text-[15px] font-bold text-brand-text"
      >
        <Plus className="size-4.5" />
        숙소 추가
      </button>
    </div>
  );
}

type StayCardProps = { stay: Stay; onClick: () => void };

/** 숙소 카드 — 테두리 r12 · 그림자, 위 줄(아이콘 22 · 이름 17/800 · 주소 13 · 상태 배지 · N박), 아래 체크인 | 체크아웃 */
function StayCard({ stay, onClick }: StayCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 flex-col gap-2.5 rounded-card border border-line-card px-4.5 py-4 text-left shadow-card"
    >
      <div className="flex items-start gap-2.5">
        <span className="text-[22px]/[1.2]">{stay.emoji || STAY_DEFAULT_EMOJI}</span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-[17px] font-extrabold tracking-[-0.01em] text-ink-900">
            {stay.place.name}
          </span>
          {stay.place.address && (
            <span className="truncate text-[13px] text-ink-400">{stay.place.address}</span>
          )}
        </div>
        {stay.status && (
          <ReservationBadge status={stay.status as ReservationStatus} className="h-5.5 text-xs" />
        )}
        <span className="flex h-6 shrink-0 items-center rounded-full bg-surface-muted px-2.25 text-xs font-extrabold text-ink-700">
          {nightsOf(stay)}박
        </span>
      </div>
      <div className="grid grid-cols-2 border-t border-surface-muted pt-2.5">
        <Moment label="체크인" value={stayMomentLabel(stay.check_in_date, stay.check_in_time)} />
        <Moment
          label="체크아웃"
          value={stayMomentLabel(stay.check_out_date, stay.check_out_time)}
          className="border-l border-surface-muted pl-3.5"
        />
      </div>
    </button>
  );
}

type MomentProps = { label: string; value: string; className?: string };

/** 「체크인 / 11.1(일) 15:00」 두 줄 */
function Moment({ label, value, className }: MomentProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-0.5 ${className ?? ""}`}>
      <span className="text-xs text-ink-400">{label}</span>
      <span className="truncate text-[15px] font-bold text-ink-900">{value}</span>
    </div>
  );
}
