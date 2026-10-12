"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { fetchPaymentReceiptKeys, removeReceiptFiles, useExpenses } from "@/entities/expense";
import { deleteFlight, useInvalidateFlights } from "@/entities/flight";

type FlightDeleteOptions = {
  tripId: string;
  flightId: string;
  /** 지웠다 — 폼은 부른 쪽이 닫는다 */
  onDeleted: () => void;
};

/**
 * 항공편을 지운다. 일정 카드 · 메모 · 결제 비용과 그 영수증 줄은 DB 가 함께 지우지만(cascade) 저장소의 파일은 모르므로,
 * 지우기 전에 영수증 키를 읽어 두고 지운 뒤 파일을 지운다(숙소 삭제와 같은 순서)
 */
async function deleteFlightWithReceipts(tripId: string, flightId: string) {
  const keys = await fetchPaymentReceiptKeys({ kind: "flight", id: flightId });
  await deleteFlight(flightId);
  await removeReceiptFiles(tripId, keys);
}

/** 「항공편 삭제」 — 확인창을 거쳐 지운다. 결제가 있으면 확인창에 가계부 기록도 함께 지워진다고 알린다 */
export function useFlightDelete({ tripId, flightId, onDeleted }: FlightDeleteOptions) {
  const [open, setOpen] = useState(false);
  const { data: expenses } = useExpenses(tripId);
  const invalidate = useInvalidateFlights(tripId);
  const remove = useMutation({
    mutationFn: () => deleteFlightWithReceipts(tripId, flightId),
    onSuccess: invalidate,
  });
  return {
    open,
    paid: expenses?.some((e) => e.flight_id === flightId) ?? false,
    request: () => setOpen(true),
    cancel: () => setOpen(false),
    confirm: () => {
      setOpen(false);
      remove.mutate(undefined, { onSuccess: onDeleted });
    },
    deleting: remove.isPending,
    error: remove.error?.message ?? null,
  };
}

export type FlightDeleteState = ReturnType<typeof useFlightDelete>;
