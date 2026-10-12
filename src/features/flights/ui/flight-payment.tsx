"use client";

import {
  PAYMENT_OWNER,
  type PaymentDraftState,
  PaymentField,
  paymentView,
  usePayerName,
} from "@/entities/expense";
import type { Flight } from "@/entities/flight";
import { useMemberLookup } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";

import { type FlightExpenseRequest, flightPayName } from "../lib/flight-payment";
import { useFlightPayment } from "../model/use-flight-payment";

type FlightPaymentSectionProps = {
  tripId: string;
  flight: Flight;
  onExpense: (req: FlightExpenseRequest) => void;
};

/** 항공편 수정 폼의 「결제」 칸 — 결제를 읽어 요약하고, 누르면 비용 입력 창을 연다(바로 저장된다) */
export function FlightPaymentSection({ tripId, flight, onExpense }: FlightPaymentSectionProps) {
  const pay = useFlightPayment(tripId, flight.id);
  return (
    <PaymentField
      loaded={pay.loaded}
      view={pay.view}
      ledgerLabel={PAYMENT_OWNER.flight.ledgerLabel}
      onOpen={() =>
        onExpense({
          kind: "payment",
          flightId: flight.id,
          name: flightPayName(flight),
          expenseId: pay.expenseId,
        })
      }
    />
  );
}

type FlightPaymentDraftSectionProps = {
  tripId: string;
  /** 새 결제의 이름 — 항공편명을 고르기 전이면 「항공편」 */
  name: string;
  payment: PaymentDraftState;
  /**
   * 항공편을 저장하는 동안 막는다 — 저장은 누른 순간의 초안으로 결제를 만드므로, 그사이 초안을 고치면
   * 이미 결제에 붙은 영수증 파일을 지울 수 있다
   */
  disabled: boolean;
  onExpense: (req: FlightExpenseRequest) => void;
};

/** 새 항공편 폼의 「결제」 칸 — 들고 있는 초안을 요약하고, 누르면 비용 입력 창을 초안으로 연다(항공편 「완료」 때 저장된다) */
export function FlightPaymentDraftSection({
  tripId,
  name,
  payment,
  disabled,
  onExpense,
}: FlightPaymentDraftSectionProps) {
  const payerName = usePayerName(tripId, useMemberLookup(tripId));
  const values = payment.draft?.values;
  return (
    <PaymentField
      loaded
      view={values ? paymentView(values, payerName(values.payer), todayISO()) : null}
      ledgerLabel={PAYMENT_OWNER.flight.ledgerLabel}
      disabled={disabled}
      onOpen={() =>
        onExpense({ kind: "draft", name, draft: payment.draft, onDraft: payment.setDraft })
      }
    />
  );
}
