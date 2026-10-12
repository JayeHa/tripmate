import {
  type PaymentDraftState,
  PaymentField,
  paymentView,
  usePayerName,
} from "@/entities/expense";
import { useMemberLookup } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";

import { STAY_LEDGER_LABEL, type StayPaymentRequest } from "../lib/stay-payment";
import { useStayPayment } from "../model/use-stay-payment";

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
    <PaymentField
      loaded={pay.loaded}
      view={pay.view}
      ledgerLabel={STAY_LEDGER_LABEL}
      onOpen={() => onPayment({ kind: "saved", stayId, name, expenseId: pay.expenseId })}
    />
  );
}

type StayPaymentDraftSectionProps = {
  tripId: string;
  /** 폼의 숙소 이름 — 비어 있으면 「숙소」 */
  name: string;
  payment: PaymentDraftState;
  /**
   * 숙소를 저장하는 동안 막는다 — 저장은 누른 순간의 초안으로 결제를 만들므로, 그사이 초안을 고치면
   * 이미 결제에 붙은 영수증 파일을 지울 수 있다
   */
  disabled: boolean;
  onPayment: (req: StayPaymentRequest) => void;
};

/** 새 숙소 폼의 「결제」 칸 — 들고 있는 초안을 요약하고, 누르면 비용 입력 창을 초안으로 연다(숙소 「완료」 때 저장된다) */
export function StayPaymentDraftSection({
  tripId,
  name,
  payment,
  disabled,
  onPayment,
}: StayPaymentDraftSectionProps) {
  const payerName = usePayerName(tripId, useMemberLookup(tripId));
  const values = payment.draft?.values;
  return (
    <PaymentField
      loaded
      view={values ? paymentView(values, payerName(values.payer), todayISO()) : null}
      ledgerLabel={STAY_LEDGER_LABEL}
      disabled={disabled}
      onOpen={() =>
        onPayment({
          kind: "draft",
          name: name.trim() || "숙소",
          draft: payment.draft,
          onDraft: payment.setDraft,
        })
      }
    />
  );
}
