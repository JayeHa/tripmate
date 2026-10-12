"use client";

import { PAYMENT_OWNER, PaymentField, PayOverdueBanner } from "@/entities/expense";
import type { Flight } from "@/entities/flight";
import type { Memo } from "@/entities/schedule-item";
import { ScreenHeader } from "@/shared/ui/screen-header";

import { type FlightExpenseRequest, flightPayName } from "../lib/flight-payment";
import { useFlightPayment } from "../model/use-flight-payment";
import { FlightDetail } from "./flight-detail";
import { FlightExpenses } from "./flight-expenses";
import { FlightMemos } from "./flight-memos";

type FlightDetailScreenProps = {
  tripId: string;
  flight: Flight;
  direction: string;
  /** 일정 카드 id — 없으면 연결된 비용 · 메모 칸이 없다 */
  cardId: string | null;
  onBack: () => void;
  onEdit: () => void;
  /** 결제 칸 · 연결된 비용 — 비용 입력 창을 여는 쪽(화면)에 넘긴다 */
  onExpense: (req: FlightExpenseRequest) => void;
  onMemo?: (cardId: string, memo: Memo | null) => void;
};

/**
 * 상세 — 머리(← · 「항공편 정보」 · 편집) + 내용. 결제 예정일이 지났으면 표 위에 안내, 표 아래 결제 칸.
 * 일정 카드가 있으면 그 카드에 연결된 비용 · 메모 칸
 */
export function FlightDetailScreen({
  tripId,
  flight,
  direction,
  cardId,
  onBack,
  onEdit,
  onExpense,
  onMemo,
}: FlightDetailScreenProps) {
  const pay = useFlightPayment(tripId, flight.id);
  return (
    <>
      <ScreenHeader
        title="항공편 정보"
        back={{ kind: "back", onClick: onBack }}
        action={{ label: "편집", onClick: onEdit }}
      />
      <FlightDetail flight={flight} direction={direction} banner={<PayOverdueBanner pay={pay} />}>
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
        {cardId && (
          <FlightExpenses
            tripId={tripId}
            cardId={cardId}
            onOpen={(expenseId) => onExpense({ kind: "linked", expenseId })}
          />
        )}
        {cardId && onMemo && (
          <FlightMemos tripId={tripId} cardId={cardId} onMemo={(memo) => onMemo(cardId, memo)} />
        )}
      </FlightDetail>
    </>
  );
}
