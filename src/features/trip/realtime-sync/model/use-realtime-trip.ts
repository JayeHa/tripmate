"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";
import { createSyncDeferral } from "@/shared/api/sync";

/**
 * 여행 하나에 채널 1개. 테이블 변경 시 해당 쿼리를 invalidate.
 * expense_splits · places 에는 trip_id 가 없어 필터 없이 구독 (RLS로 볼 수 있는 것만 수신됨).
 */
export function useRealtimeTrip(tripId: string) {
  const qc = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const filter = `trip_id=eq.${tripId}`;
    // 오프라인 대기열이 있는 데이터(메모 · 체크리스트 · 준비물 · 비용)는 대기열이 올라가는 동안 미뤘다가, 빌 때 한 번에 다시 읽는다
    const deferral = createSyncDeferral(qc);
    const refreshAfterSync = deferral.refresh;
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
      // 가이드 보관함 — 일행이 담고 · 빼고 · 메모를 고친 것(일정에 넣어 생긴 줄은 schedule_items 이벤트로도 온다)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_places", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.guidePlaces(tripId), exact: true }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "memos", filter }, () =>
        refreshAfterSync(queryKeys.memos(tripId)),
      )
      // 숙소 자체만 — 연결 카드의 변경은 schedule_items 이벤트로 온다
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "stays", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.stays(tripId) }),
      )
      // 항공편 자체만 — 연결 카드의 변경은 schedule_items 이벤트로 온다
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "flights", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.flights(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_items", filter },
        () => refreshAfterSync(queryKeys.checklist(tripId)),
      )
      // 연결 — 대상(일정 · 항공편 · 숙소)을 지워 풀린 연결도 여기로 온다
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_targets", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.checklistTargets(tripId) }),
      )
      // 바우처 — 대상(일정 · 항공편 · 숙소)을 지워 풀린 연결도 여기로 온다
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vouchers", filter },
        // 줄만 다시 읽는다 — 읽기 주소(urls)는 키가 그대로면 다시 받지 않는다
        () => void qc.invalidateQueries({ queryKey: queryKeys.vouchers(tripId), exact: true }),
      )
      // 준비물 · 쇼핑 — 그룹 · 항목 둘 다 같은 키(그룹을 지워 함께 지워진 항목도)
      .on("postgres_changes", { event: "*", schema: "public", table: "pack_groups", filter }, () =>
        refreshAfterSync(queryKeys.packLists(tripId)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "pack_items", filter }, () =>
        refreshAfterSync(queryKeys.packLists(tripId)),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "moves", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.moves(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transport_fares", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.transportFares(tripId) }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses", filter }, () =>
        refreshAfterSync(queryKeys.expenses(tripId)),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_splits" }, () =>
        refreshAfterSync(queryKeys.expenses(tripId)),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_guests", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.tripGuests(tripId) }),
      )
      // 일행이 「받았어요 · 보냈어요」 를 기록하면 바로 반영한다 — 모르면 같은 돈을 또 보낼 수 있다
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements", filter },
        () => void qc.invalidateQueries({ queryKey: queryKeys.settlements(tripId) }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_receipts", filter },
        // 줄만 다시 읽는다 — 읽기 주소(urls)는 키가 그대로면 다시 받지 않는다
        () => void qc.invalidateQueries({ queryKey: queryKeys.receipts(tripId), exact: true }),
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
      deferral.stop();
      void supabase.removeChannel(channel);
    };
  }, [tripId, qc]);
}
