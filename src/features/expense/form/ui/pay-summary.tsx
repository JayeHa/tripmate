import { BedDouble, Plane } from "lucide-react";

import { type PayFor, PAYMENT_OWNER, type PaymentOwnerKind } from "@/entities/expense";

const ICON: Record<PaymentOwnerKind, typeof BedDouble> = { stay: BedDouble, flight: Plane };

type PaySummaryProps = { payFor: PayFor };

/**
 * 숙소 · 항공편 결제(그쪽에 붙은 비용)의 맨 위 — 「숙소 결제」 · 「항공편 결제」 배지 · 이름 · 카테고리 · 연결 · 안내.
 * 이름 · 카테고리 · 일정 연결은 숙소 · 항공편이 정해서(DB 가 맞춘다) 칸 대신 글로만 보인다
 */
export function PaySummary({ payFor }: PaySummaryProps) {
  const owner = PAYMENT_OWNER[payFor.kind];
  const Icon = ICON[payFor.kind];
  return (
    <div className="flex flex-col gap-2.5 px-5 pt-1 pb-4.5">
      <span className="flex h-5.5 w-fit items-center gap-1 rounded-full bg-brand-soft px-2 text-xs font-extrabold text-brand-text">
        <Icon className="size-3" aria-hidden="true" />
        {owner.noun} 결제
      </span>
      <span className="text-[22px] font-extrabold tracking-[-0.02em] text-pretty text-ink-900">
        {payFor.name}
      </span>
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-400">카테고리</dt>
          <dd className="font-semibold text-ink-900">{owner.categoryLabel}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-400">연결</dt>
          <dd className="font-semibold text-ink-900">{owner.linkLabel}</dd>
        </div>
      </dl>
      <span className="text-xs text-ink-350">
        이름·카테고리는 {owner.linkLabel}에서 정해져요. 아래 값만 바꿀 수 있어요.
      </span>
    </div>
  );
}
