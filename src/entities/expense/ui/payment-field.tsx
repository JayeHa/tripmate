import { CircleAlert, Plus, Receipt } from "lucide-react";

import type { PaymentView } from "../lib/payment-view";
import type { LinkedPaymentState } from "../model/use-linked-payment";

type PaymentFieldProps = {
  /** 결제 칸에 그릴 수 있다(가계부를 읽었다) */
  loaded: boolean;
  /** 결제 요약 — 없으면 「+ 결제 추가」 */
  view: PaymentView | null;
  /** 가계부의 어디에 기록되는지 — 「여행준비 · 숙소」 */
  ledgerLabel: string;
  /** 결제 칸을 연다(수정 · 새로 추가) */
  onOpen: () => void;
  /** 누르지 못하게 — 숙소 · 항공편을 저장하는 동안 */
  disabled?: boolean;
};

/**
 * 「결제」 칸(숙소 · 항공편) — 결제가 있으면 한 줄 요약(영수증 아이콘 · 금액 / 결제한 사람 · 상태 + 「수정」), 없으면 점선 「+ 결제 추가」.
 * 아래에 가계부와 같은 비용이라는 안내. 가계부를 읽기 전에는 그리지 않는다
 */
export function PaymentField({ loaded, view, ledgerLabel, onOpen, disabled }: PaymentFieldProps) {
  if (!loaded) return null;
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
            onClick={onOpen}
            disabled={disabled}
            className="flex h-8.5 shrink-0 items-center rounded-button border border-line-strong px-3 text-[13px] font-bold text-ink-700 hover:bg-surface-sunken disabled:opacity-50"
          >
            수정
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          disabled={disabled}
          className="flex h-12 items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed border-line-dashed text-sm font-bold text-brand disabled:opacity-50"
        >
          <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
          결제 추가
        </button>
      )}
      <span className="text-xs text-ink-350">
        가계부 「{ledgerLabel}」에 같은 비용으로 기록돼요
      </span>
    </div>
  );
}

type PayOverdueBannerProps = { pay: LinkedPaymentState };

/** 숙소 · 항공편 상세 맨 위 — 결제 예정일이 지났으면 「결제했나요? · 결제 완료로」 */
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
