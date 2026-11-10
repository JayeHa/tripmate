import { useState } from "react";

import type { RouteHover } from "../ui/route/route-day-section";

/**
 * PC 목록 ↔ 지도 올림(hover) 상태 — 올린 장소(목록 카드 · 지도 핀)와 올린 구간 글자(도착 장소 id).
 * 내리면 null. 카드에서 카드로 옮기면 「내림 → 올림」 순서로 와서 마지막 것이 남는다
 */
export function useRouteHover(): RouteHover {
  const [stopId, setStopId] = useState<string | null>(null);
  const [segTo, setSegTo] = useState<string | null>(null);
  return { stopId, segTo, onStop: setStopId, onSeg: setSegTo };
}
