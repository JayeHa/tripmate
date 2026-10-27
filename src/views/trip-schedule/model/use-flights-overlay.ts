"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useFlights } from "@/entities/flight";
import type { ExpenseDialogTarget } from "@/features/expense/form";
import type { FlightExpenseRequest } from "@/features/flights";
import { queryKeys } from "@/shared/api/query-keys";

/**
 * 항공편 창과 그 위에 여는 비용 입력 창(결제 · 연결된 비용) — 화면(TripScheduleView)이 쥐고 FlightsOverlay 가 그린다.
 * 항공편 창은 목록부터 열거나(레일 · 여행 머리 칩) 한 항공편의 상세부터 연다(일정 카드)
 */
export function useFlightsOverlay(tripId: string) {
  const [open, setOpen] = useState(false);
  // 처음 보일 항공편. null 이면 목록부터
  const [initialId, setInitialId] = useState<string | null>(null);
  const [expense, setExpense] = useState<ExpenseDialogTarget | null>(null);
  const { data: flights } = useFlights(tripId);
  const qc = useQueryClient();
  return {
    open,
    setOpen,
    initialId,
    /** 항공편 목록부터 연다(레일 · 여행 머리 칩) */
    openFlights: () => {
      setInitialId(null);
      setOpen(true);
    },
    /**
     * 그 항공편의 상세부터 연다(일정의 항공편 카드). 목록에 아직 없으면(일행이 막 넣어 카드가 먼저 왔다) 목록을 다시 읽는다 —
     * 상세는 다시 읽는 동안 기다린다(useCurrentFlight). 목록을 아직 읽는 중이면 그 읽기를 기다린다 — 무효화하면 읽던 요청을 끊고 다시 보낸다.
     * 다른 화면의 「일정에서 보기」(?open=)로 오면 일정 화면이 렌더 중에 부르는데, 그때 목록은 대개 아직 읽는 중이다
     */
    openFlight: (id: string) => {
      if (flights && !flights.some((f) => f.id === id)) {
        void qc.invalidateQueries({ queryKey: queryKeys.flights(tripId) });
      }
      setInitialId(id);
      setOpen(true);
    },
    /** 레일 · 여행 머리 버튼의 숫자. 아직 못 읽었으면 0 */
    count: flights?.length ?? 0,
    expense,
    /**
     * 결제 칸(붙은 비용이 있으면 그 수정, 없으면 그 항공편의 결제로 새 비용, 새 항공편이면 초안) ·
     * 연결된 비용 줄(그 비용 수정, 빠른 입력)
     */
    openExpense: (req: FlightExpenseRequest) => setExpense(expenseTarget(req)),
    closeExpense: () => setExpense(null),
  };
}

export type FlightsOverlayState = ReturnType<typeof useFlightsOverlay>;

/** 항공편 창의 비용 요청 → 비용 창 대상 */
function expenseTarget(req: FlightExpenseRequest): ExpenseDialogTarget {
  if (req.kind === "linked") return { kind: "edit", expenseId: req.expenseId, quick: true };
  if (req.kind === "draft") {
    return {
      kind: "draft",
      payFor: { kind: "flight", name: req.name },
      draft: req.draft,
      onDraft: req.onDraft,
    };
  }
  if (req.expenseId) return { kind: "edit", expenseId: req.expenseId };
  return { kind: "new", payFor: { kind: "flight", id: req.flightId, name: req.name } };
}
