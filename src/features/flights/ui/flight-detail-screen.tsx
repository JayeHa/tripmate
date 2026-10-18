"use client";

import type { ReactNode } from "react";

import { type ChecklistTargetRef, LinkedChecklist, useLinkedChecklist } from "@/entities/checklist";
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
  /** 체크리스트를 완료했다 · 실패했다 — 토스트는 화면이 그린다 */
  onToast?: (text: string) => void;
  /** 바우처 칸(화면이 그린 것) — 연결된 비용 아래, 체크리스트 위 */
  vouchers?: ReactNode;
};

/**
 * 상세 — 머리(← · 「항공편 정보」 · 편집) + 내용. 결제 예정일이 지났으면 표 위에 안내, 표 아래 결제 칸.
 * 일정 카드가 있으면 그 카드에 연결된 비용 칸, 바우처 칸(화면이 넣는다), 이 항공편(과 카드)에 연결된 끝나지 않은 체크리스트 칸, 카드가 있으면 메모 칸
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
  onToast,
  vouchers,
}: FlightDetailScreenProps) {
  const pay = useFlightPayment(tripId, flight.id);
  const checklist = useLinkedChecklist(tripId, checklistRefs(flight.id, cardId), (text) =>
    onToast?.(text),
  );
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
        {vouchers}
        <LinkedChecklist tripId={tripId} items={checklist.items} onComplete={checklist.complete} />
        {cardId && onMemo && (
          <FlightMemos tripId={tripId} cardId={cardId} onMemo={(memo) => onMemo(cardId, memo)} />
        )}
      </FlightDetail>
    </>
  );
}

/** 체크리스트 칸의 대상 — 항공편과, 있으면 그 일정 카드(타임라인 칩과 같은 기준) */
function checklistRefs(flightId: string, cardId: string | null): ChecklistTargetRef[] {
  return [
    { kind: "flight", id: flightId },
    ...(cardId ? [{ kind: "schedule_item" as const, id: cardId }] : []),
  ];
}
