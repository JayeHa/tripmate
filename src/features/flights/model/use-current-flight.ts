"use client";

import { useEffect, useRef, useState } from "react";

import { type Flight, useFlights } from "@/entities/flight";

import type { FlightsFlow } from "./use-flights-flow";

/**
 * 항공편 목록과 지금 보거나 고치는 항공편. 그 항공편이 지워졌으면(일행이) 목록으로 돌린다 — 고치던 값으로 「완료」 를 누르면
 * 새 항공편으로 되살아나지 않게(고치는 중이었으면 알린다). 목록을 읽기 전에는 판단하지 않는다.
 * 목록으로 돌리기는 렌더 중 조정(이 컴포넌트의 상태)이고, 토스트는 뷰의 상태라 이펙트에서 요청한다
 */
export function useCurrentFlight(
  tripId: string,
  flow: FlightsFlow,
  onToast?: (text: string) => void,
) {
  const { data } = useFlights(tripId);
  const flights: Flight[] = data ?? [];
  // 「지워졌어요」 알릴 일이 생긴 횟수 — 이펙트가 지난번에 알린 횟수와 다를 때만 토스트를 요청한다
  const [notices, setNotices] = useState(0);
  const notified = useRef(0);
  const { step } = flow;
  const id = step.kind === "list" ? null : step.id;
  const current = id ? (flights.find((f) => f.id === id) ?? null) : null;
  if (data && id && !current) {
    if (step.kind === "form") setNotices((n) => n + 1);
    flow.toList();
  }
  useEffect(() => {
    if (notices === notified.current) return;
    notified.current = notices;
    onToast?.("일행이 이 항공편을 지웠어요");
  }, [notices, onToast]);
  return { flights, current };
}
