"use client";

import { WifiOff } from "lucide-react";
import { type ReactNode, useSyncExternalStore } from "react";

import { useRealtimeTrip } from "@/features/trip/realtime-sync";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function TripShell({ tripId, children }: { tripId: string; children: ReactNode }) {
  useRealtimeTrip(tripId);
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  return (
    <>
      {!online && (
        <div className="sticky top-12 z-10 flex items-center justify-center gap-1.5 bg-amber-100 py-1 text-xs text-amber-900">
          <WifiOff className="size-3.5" /> 오프라인 · 마지막으로 본 일정을 표시 중
        </div>
      )}
      {children}
    </>
  );
}
