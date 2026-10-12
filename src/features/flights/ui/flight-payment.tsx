"use client";

import { PAYMENT_OWNER, PaymentField } from "@/entities/expense";
import type { Flight } from "@/entities/flight";

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
