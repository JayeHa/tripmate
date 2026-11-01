"use client";

import { ChevronRight } from "lucide-react";

import { REFUND_STATUSES, type RefundStatus, useTaxRefunds } from "@/entities/tax-refund";
import { cn } from "@/shared/lib/utils";

import { refundSummary } from "../../lib/refund-summary";

/** 크기 — 모바일 대시보드 / PC 오른쪽 카드 */
const SIZE = {
  md: { title: "text-[15px]", count: "text-xl" },
  sm: { title: "text-sm", count: "text-lg" },
} as const;

/** 카드의 단계 이름 — 짧게 */
const SHORT: Record<RefundStatus, string> = {
  registered: "세관 확인 전",
  customs: "받을 것",
  received: "받았어요",
};

type RefundCardProps = {
  tripId: string;
  size?: keyof typeof SIZE;
  /** 「환급」 화면을 연다 — 모바일은 탭, PC 는 창 */
  onOpen: () => void;
};

/**
 * 「환급」 카드(대시보드) — 「전체 보기 ›」, 단계별 건수 세 칸(세관 확인 전은 남아 있으면 파랑), 아래 받을 돈 · 받은 돈.
 * 기록이 없으면 「아직 환급 기록이 없어요.」. 읽기 전 · 실패하면 숫자 자리를 비워 둔다
 */
export function RefundCard({ tripId, size = "md", onOpen }: RefundCardProps) {
  const s = SIZE[size];
  const { data: refunds } = useTaxRefunds(tripId);
  const summary = refunds ? refundSummary(refunds) : null;
  return (
    <>
      <div className="flex items-center">
        <h2 className={cn("flex-1 font-extrabold text-ink-900", s.title)}>환급</h2>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-px text-[13px] font-bold whitespace-nowrap text-brand-text"
        >
          전체 보기
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      {summary && refunds?.length === 0 && (
        <p className="text-[13px] text-ink-350">아직 환급 기록이 없어요.</p>
      )}
      {summary && refunds && refunds.length > 0 && (
        <>
          <button type="button" onClick={onOpen} className="grid grid-cols-3 gap-1 text-left">
            {REFUND_STATUSES.map((status) => (
              <span
                key={status}
                className="flex flex-col gap-0.5 rounded-memo bg-surface-sunken px-3 py-2"
              >
                <span className="text-xs text-ink-450">{SHORT[status]}</span>
                <span
                  className={cn(
                    "font-extrabold",
                    s.count,
                    status === "registered" && summary.counts.registered > 0
                      ? "text-brand-text"
                      : "text-ink-900",
                  )}
                >
                  {summary.counts[status]}건
                </span>
              </span>
            ))}
          </button>
          <p className="text-[13px] text-ink-450">
            {summary.expected ? `받을 돈 ${summary.expected}` : "받을 돈 없음"}
            {summary.received && ` · 받은 돈 ${summary.received}`}
          </p>
        </>
      )}
    </>
  );
}
