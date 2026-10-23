import type { QueryClient } from "@tanstack/react-query";

import { todayISO } from "@/shared/lib/days";

import { startTripCarry } from "../api/save-through-worker";
import { checkSavedTripData } from "./check-saved-data";
import { pruneOfflineTrips } from "./offline-store";

/**
 * 앱이 시작할 때(데이터 캐시를 되살린 뒤) 받은 여행을 챙긴다 — 기한이 지난 여행을 지우고,
 * 데이터가 캐시에 남았는지 보고, 옛 배포의 화면을 새 배포로 옮기게 한다
 */
export function startSavedTrips(qc: QueryClient): void {
  pruneOfflineTrips(todayISO());
  checkSavedTripData(qc);
  startTripCarry();
}
