import { CircleAlert, Plus, Receipt } from "lucide-react";

import type { StayPaymentRequest } from "../lib/stay-payment";
import { type StayPaymentState, useStayPayment } from "../model/use-stay-payment";

type StayPaymentFieldProps = {
  pay: StayPaymentState;
  /** 결제 칸을 연다 — 붙은 비용 id(수정), 없으면 null(새로 추가) */
  onOpen: (expenseId: string | null) => void;
};

/**
 * 「결제」 칸 — 결제가 있으면 한 줄 요약(영수증 아이콘 · 금액 / 결제한 사람 · 상태 + 「수정」), 없으면 점선 「+ 결제 추가」.
 * 아래에 가계부와 같은 비용이라는 안내. 가계부를 읽기 전에는 그리지 않는다
 */
export function StayPaymentField({ pay, onOpen }: StayPaymentFieldProps) {
  if (!pay.loaded) return null;
  const { view } = pay;
  return (
    <div className="flex flex-col gap-1.5 pt-1">
      <span className="text-[13px] font-bold text-ink-700">결제</span>
      {view ? (
        <div className="flex min-h-13 items-center gap-2.5 rounded-card border border-input py-2 pr-2 pl-3.5">
          <Receipt className="size-4.5 shrink-0 text-brand" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-[15px] font-extrabold text-ink-900">
              {view.amountText}
            </span>
            <span className="truncate text-xs text-ink-400">{view.sub}</span>
          </div>
          <button
            type="button"
            onClick={() => onOpen(view.expenseId)}
            className="flex h-8.5 shrink-0 items-center rounded-button border border-line-strong px-3 text-[13px] font-bold text-ink-700 hover:bg-surface-sunken"
          >
            수정
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onOpen(null)}
          className="flex h-12 items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-dashed text-sm font-bold text-brand"
        >
          <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
          결제 추가
        </button>
      )}
      <span className="text-xs text-ink-350">
        가계부 「여행준비 · 숙소」에 같은 비용으로 기록돼요
      </span>
    </div>
  );
}

type PayOverdueBannerProps = { pay: StayPaymentState };

/** 숙소 상세 맨 위 — 결제 예정일이 지났으면 「결제했나요? · 결제 완료로」 */
export function PayOverdueBanner({ pay }: PayOverdueBannerProps) {
  if (!pay.view?.overdue) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-memo bg-status-wait-bg px-3.5 py-3">
        <CircleAlert className="size-4 shrink-0 text-status-wait-text" aria-hidden="true" />
        <span className="flex-1 text-[13px] font-bold text-status-wait-text">
          결제 예정일이 지났어요. 결제했나요?
        </span>
        <button
          type="button"
          onClick={pay.markPaid}
          disabled={pay.marking}
          className="text-[13px] font-extrabold text-status-wait-text underline disabled:opacity-50"
        >
          결제 완료로
        </button>
      </div>
      {pay.markError && <p className="text-[13px] text-destructive">{pay.markError}</p>}
    </div>
  );
}

type StayPaymentSectionProps = {
  tripId: string;
  stayId: string;
  /** 숙소 이름 — 새 결제의 이름 */
  name: string;
  onPayment: (req: StayPaymentRequest) => void;
};

/** 숙소 수정 폼의 「결제」 칸 — 결제를 읽어 요약하고, 누르면 비용 입력 창을 연다(바로 저장된다) */
export function StayPaymentSection({ tripId, stayId, name, onPayment }: StayPaymentSectionProps) {
  const pay = useStayPayment(tripId, stayId);
  return (
    <StayPaymentField pay={pay} onOpen={(expenseId) => onPayment({ stayId, name, expenseId })} />
  );
}
