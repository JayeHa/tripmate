import { onlineManager, type QueryClient } from "@tanstack/react-query";

import { tripQuery } from "@/entities/trip";

import { withDataMissing } from "../lib/offline-plan";
import { allSavedTrips, isRunning, savedTripOf, setSavedTrip } from "./offline-store";
import { loadTripData } from "./run-offline-download";

/** 그 여행의 데이터를 못 받은 것으로 기록한다 — 그사이 지워졌으면 그대로 */
function markDataMissing(tripId: string): void {
  const saved = savedTripOf(tripId);
  if (saved) setSavedTrip(tripId, withDataMissing(saved));
}

/**
 * 받은 여행의 데이터가 기기 캐시에 남아 있는지 본다 — 캐시를 되살린 뒤 부른다.
 * 데이터 모양이 바뀐 배포(`QUERY_CACHE_BUSTER`)는 캐시를 통째로 버리는데, 받은 화면 · 사진 칸과 「받음」 기록은 남는다.
 * 여행(`tripQuery`)이 캐시에 없으면 온라인일 때 데이터만 조용히 다시 읽고, 오프라인이거나 읽지 못하면 일부 실패로 바꿔 「다시 받기」 로 이끈다
 */
export function checkSavedTripData(qc: QueryClient): void {
  Object.keys(allSavedTrips())
    .filter((id) => !isRunning(id) && qc.getQueryData(tripQuery(id).queryKey) === undefined)
    .forEach((id) => {
      if (!onlineManager.isOnline()) {
        markDataMissing(id);
        return;
      }
      void loadTripData(qc, id).then((ok) => {
        if (!ok) markDataMissing(id);
      });
    });
}
