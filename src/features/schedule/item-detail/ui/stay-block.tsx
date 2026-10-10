"use client";

import { format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { BedDouble } from "lucide-react";

import { ReservationBadge, type ReservationStatus } from "@/entities/schedule-item";
import { useStays } from "@/entities/stay";

type StayBlockProps = {
  tripId: string;
  stayId: string;
  /** 「숙소 정보 수정」 — 부른 쪽이 그 숙소의 숙소 창을 연다 */
  onEdit: (stayId: string) => void;
};

/** 「11.1 (일) 15:00」 — 시각이 없으면 날짜만 */
function moment(date: string, time: string | null): string {
  const day = format(parseISO(date), "M.d (EEE)", { locale: ko });
  return time ? `${day} ${time.slice(0, 5)}` : day;
}

/**
 * 숙소에 연결된 카드의 「숙소 예약」 블록 — 틸 태그 「숙소 예약」 + 「숙소 정보 수정」, 체크인 | 체크아웃 2칸, 예약 상태(같은 숙소 카드 모두 같다).
 * 아래 1px 구분선 + 20 여백. 숙소를 아직 못 읽었거나 지워졌으면 그리지 않는다
 */
export function StayBlock({ tripId, stayId, onEdit }: StayBlockProps) {
  const { data: stays } = useStays(tripId);
  const stay = stays?.find((s) => s.id === stayId);
  if (!stay) return null;
  return (
    <section className="flex flex-col gap-2.5 border-b border-divider pb-5">
      <div className="flex items-center justify-between">
        <span className="flex h-6 items-center gap-1 rounded-full bg-cat-stay-soft px-2.25 text-xs font-extrabold text-tag-hours">
          <BedDouble className="size-3" strokeWidth={2.2} />
          숙소 예약
        </span>
        <button
          type="button"
          onClick={() => onEdit(stay.id)}
          className="text-[13px] font-bold text-brand-text"
        >
          숙소 정보 수정
        </button>
      </div>
      <div className="grid grid-cols-[1fr_1px_1fr] items-center rounded-memo bg-surface-sunken py-2.5">
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-ink-400">체크인</span>
          <span className="text-[15px] font-extrabold text-ink-900">
            {moment(stay.check_in_date, stay.check_in_time)}
          </span>
        </span>
        <span aria-hidden="true" className="h-7 bg-line" />
        <span className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-ink-400">체크아웃</span>
          <span className="text-[15px] font-extrabold text-ink-900">
            {moment(stay.check_out_date, stay.check_out_time)}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="w-16 shrink-0 text-ink-400">예약 상태</span>
        {stay.status ? (
          <ReservationBadge status={stay.status as ReservationStatus} />
        ) : (
          <span className="text-[13px] text-ink-350">없음</span>
        )}
        <span className="text-xs text-ink-350">· 같은 숙소 카드 모두 같아요</span>
      </div>
    </section>
  );
}
