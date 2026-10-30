import { ChevronRight, Plus } from "lucide-react";

import { dayFare, extraFares, type TransportFare } from "@/entities/transport-fare";
import { dayParts } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";

import type { FareTarget } from "../../model/use-fare-form";

type FareRowProps = {
  /** 왼쪽 위 굵은 글자(「day 1」 · 줄 이름) */
  label: string;
  /** 이름 옆 회색 글자(날짜) */
  sub?: string;
  fare: TransportFare | null;
  onClick: () => void;
};

/** 교통비 한 줄 — 이름 · 날짜, 오른쪽 금액(없으면 「+ 교통비」), 아래 경로 메모(3줄까지). 누르면 고치기 */
function FareRow({ label, sub, fare, onClick }: FareRowProps) {
  const amount = fare?.amount ?? null;
  return (
    <li>
      <button type="button" onClick={onClick} className="flex w-full flex-col gap-1 py-3 text-left">
        <span className="flex w-full items-center gap-2">
          <span className="text-[15px] font-extrabold text-ink-900">{label}</span>
          {sub && <span className="text-[13px] text-ink-400">{sub}</span>}
          <span className="ml-auto flex items-center gap-0.5">
            {fare ? (
              <span className="text-[15px] font-bold text-ink-900 tabular-nums">
                {amount === null ? "금액 없음" : formatMoney(Number(amount), fare.currency)}
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[13px] font-bold text-brand-text">
                <Plus className="size-3.5" aria-hidden />
                교통비
              </span>
            )}
            <ChevronRight className="size-4 text-ink-350" aria-hidden />
          </span>
        </span>
        {fare?.memo && (
          <span className="line-clamp-3 text-[13px]/relaxed whitespace-pre-line text-ink-500">
            {fare.memo}
          </span>
        )}
      </button>
    </li>
  );
}

type DayFaresProps = {
  fares: TransportFare[];
  startDate: string;
  totalDays: number;
  onEdit: (target: FareTarget) => void;
};

/** 날짜마다 한 줄 — 여행 기간의 모든 날(적지 않은 날도 「+ 교통비」 로 보인다) */
export function DayFares({ fares, startDate, totalDays, onEdit }: DayFaresProps) {
  const days = Array.from({ length: totalDays }, (_, i) => i);
  return (
    <ul className="flex flex-col divide-y divide-divider">
      {days.map((dayIndex) => {
        const fare = dayFare(fares, dayIndex);
        const { date, dow } = dayParts(startDate, dayIndex);
        return (
          <FareRow
            key={dayIndex}
            label={`day ${dayIndex + 1}`}
            sub={`${date} (${dow})`}
            fare={fare}
            onClick={() => onEdit({ kind: "day", dayIndex, fare })}
          />
        );
      })}
    </ul>
  );
}

type ExtraFaresProps = { fares: TransportFare[]; onEdit: (target: FareTarget) => void };

/** 날짜 밖 줄(공항 왕복 · 패스) + 맨 아래 「다른 교통비 추가」 */
export function ExtraFares({ fares, onEdit }: ExtraFaresProps) {
  const extras = extraFares(fares);
  return (
    <div className="flex flex-col">
      {extras.length > 0 && (
        <ul className="flex flex-col divide-y divide-divider">
          {extras.map((fare) => (
            <FareRow
              key={fare.id}
              label={fare.title ?? ""}
              fare={fare}
              onClick={() => onEdit({ kind: "extra", fare })}
            />
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={() => onEdit({ kind: "extra", fare: null })}
        className="mt-1 flex h-11 items-center justify-center gap-1 rounded-memo border-[1.5px] border-dashed border-line-dashed text-[13px] font-bold text-brand-text"
      >
        <Plus className="size-4" aria-hidden />
        다른 교통비 추가
      </button>
    </div>
  );
}
