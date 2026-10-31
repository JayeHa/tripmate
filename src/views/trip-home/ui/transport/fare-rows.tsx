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
  /** 가계부 교통 비용의 내 몫 — 「¥700」. 없으면 null */
  actual?: string | null;
  onClick: () => void;
};

/**
 * 교통비 한 줄 — 이름 · 날짜, 오른쪽 금액(없으면 「+ 교통비」) 아래 「실제 N」, 아래 경로 메모(3줄까지). 누르면 고치기
 */
function FareRow({ label, sub, fare, actual, onClick }: FareRowProps) {
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
        {actual && <ActualLine amount={actual} />}
        {fare?.memo && (
          <span className="line-clamp-3 text-[13px]/relaxed whitespace-pre-line text-ink-500">
            {fare.memo}
          </span>
        )}
      </button>
    </li>
  );
}

type ActualLineProps = { amount: string };

/** 「실제 ¥700」 — 금액 아래 오른쪽(꺾쇠 앞에 맞춘다) */
function ActualLine({ amount }: ActualLineProps) {
  return (
    <span className="self-end pr-4.5 text-[13px] font-bold text-ink-500 tabular-nums">
      실제 {amount}
    </span>
  );
}

type DayFaresProps = {
  fares: TransportFare[];
  startDate: string;
  totalDays: number;
  /** 그날 가계부 교통 비용의 내 몫 — 없으면 null */
  actualOf: (dayIndex: number) => string | null;
  onEdit: (target: FareTarget) => void;
};

/** 날짜마다 한 줄 — 여행 기간의 모든 날(적지 않은 날도 「+ 교통비」 로 보인다) */
export function DayFares({ fares, startDate, totalDays, actualOf, onEdit }: DayFaresProps) {
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
            actual={actualOf(dayIndex)}
            onClick={() => onEdit({ kind: "day", dayIndex, fare })}
          />
        );
      })}
    </ul>
  );
}

type ExtraFaresProps = {
  fares: TransportFare[];
  /** 날짜 없는(여행준비 · 기간 밖) 가계부 교통 비용의 내 몫 — 없으면 null */
  undatedActual: string | null;
  onEdit: (target: FareTarget) => void;
};

/**
 * 날짜 밖 줄(공항 왕복 · 패스) + 가계부 「여행준비」 교통 비용의 내 몫(누를 수 없는 줄) + 맨 아래 「다른 교통비 추가」
 */
export function ExtraFares({ fares, undatedActual, onEdit }: ExtraFaresProps) {
  const extras = extraFares(fares);
  return (
    <div className="flex flex-col">
      {(extras.length > 0 || undatedActual) && (
        <ul className="flex flex-col divide-y divide-divider">
          {extras.map((fare) => (
            <FareRow
              key={fare.id}
              label={fare.title ?? ""}
              fare={fare}
              onClick={() => onEdit({ kind: "extra", fare })}
            />
          ))}
          {undatedActual && (
            <li className="flex items-center gap-2 py-3">
              <span className="text-[15px] font-extrabold text-ink-900">여행준비</span>
              <span className="text-[13px] text-ink-400">가계부</span>
              <span className="ml-auto text-[13px] font-bold text-ink-500 tabular-nums">
                실제 {undatedActual}
              </span>
            </li>
          )}
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
