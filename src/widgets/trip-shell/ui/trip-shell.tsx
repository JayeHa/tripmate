"use client";

import type { ReactNode } from "react";

import { useRealtimeTrip } from "@/features/trip/realtime-sync";

type TripShellProps = { tripId: string; children: ReactNode };

/** 여행 화면 공통 — 일행의 변경을 실시간으로 받는다. 오프라인 안내는 화면 맨 위 띠(`widgets/connection-status`)가 한다 */
export function TripShell({ tripId, children }: TripShellProps) {
  useRealtimeTrip(tripId);
  return children;
}
