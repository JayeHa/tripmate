"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { queryKeys } from "@/lib/queries/keys";
import { createClient } from "@/lib/supabase/client";

/**
 * 여행 하나에 채널 1개. 테이블 변경 시 해당 쿼리를 invalidate.
 * expense_splits 에는 trip_id 가 없어 필터 없이 구독 (RLS로 내 여행 것만 수신됨).
 */
export function useRealtimeTrip(tripId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const filter = `trip_id=eq.${tripId}`;
    const channel = supabase
      .channel(`trip:${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "schedule_items", filter },
        () => {
          qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
          qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter }, () =>
        qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_splits" }, () =>
        qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "trip_members", filter }, () =>
        qc.invalidateQueries({ queryKey: queryKeys.trips.members(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, qc]);
}
