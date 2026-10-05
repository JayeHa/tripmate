"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";

/**
 * 여행 하나에 채널 1개. 테이블 변경 시 해당 쿼리를 invalidate.
 * expense_splits · places 에는 trip_id 가 없어 필터 없이 구독 (RLS로 볼 수 있는 것만 수신됨).
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
          void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
          void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
        },
      )
      // 장소에는 trip_id 가 없어 필터 없이 구독한다. RLS 로 볼 수 있는 장소(만든 것 · 내 여행이 쓰는 것)만 온다
      .on("postgres_changes", { event: "*", schema: "public", table: "places" }, () => {
        void qc.invalidateQueries({ queryKey: queryKeys.scheduleItems(tripId) });
        void qc.invalidateQueries({ queryKey: queryKeys.dayRoutes(tripId) });
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "memos", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.memos(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "moves", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.moves(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_splits" },
        () => void qc.invalidateQueries({ queryKey: queryKeys.expenses(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_members", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.trips.members(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "trips", filter: `id=eq.${tripId}` },
        () => void qc.invalidateQueries({ queryKey: queryKeys.trips.detail(tripId) }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tripId, qc]);
}
