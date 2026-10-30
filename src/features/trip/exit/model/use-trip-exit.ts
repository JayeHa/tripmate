"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useUser } from "@/entities/session";
import { type Trip, useDeleteTrip } from "@/entities/trip";
import { useRemoveMember } from "@/entities/trip-member";
import { queryKeys } from "@/shared/api/query-keys";
import { NAV } from "@/shared/lib/nav-transition";

/**
 * 여행 나가기(멤버) · 여행 삭제(방장) — 여행 홈 「편집」 과 설정이 같이 쓴다.
 * 끝나면 내 여행 목록으로 간다(이 여행을 더 읽을 수 없다). 실패하면 확인 창에 남아 이유를 보인다
 */
export function useTripExit(trip: Trip) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user } = useUser();
  const leaveMutation = useRemoveMember(trip.id);
  const deleteMutation = useDeleteTrip();

  /**
   * 내 여행 목록으로. 이 여행의 캐시(기기 저장분 포함)를 지워 뒤로 가기로 더는 볼 수 없는 여행이 그려지지 않게 하고,
   * 목록에서 이 여행이 빠지게 다시 읽는다. 이동을 먼저 걸어 지운 뒤 화면이 빈 값으로 다시 그려지지 않게 한다
   */
  function toTrips() {
    router.replace("/trips", { transitionTypes: NAV.back });
    qc.removeQueries({ queryKey: queryKeys.trips.detail(trip.id) });
    void qc.invalidateQueries({ queryKey: queryKeys.trips.all, exact: true });
  }

  return {
    /** 방장인가 — 내가 누구인지 아직 모르면 null */
    isOwner: user ? user.id === trip.owner_id : null,
    /** 확인 창을 열기 전에 — 지난 오류를 지운다 */
    reset: () => {
      leaveMutation.reset();
      deleteMutation.reset();
    },
    leave: {
      pending: leaveMutation.isPending,
      locked: leaveMutation.isPending && !leaveMutation.isPaused,
      error: leaveMutation.error?.message ?? null,
      confirm: () => user && leaveMutation.mutate(user.id, { onSuccess: toTrips }),
    },
    remove: {
      pending: deleteMutation.isPending,
      // 오프라인이면 뮤테이션이 실패하지 않고 멈춘다. 그때까지 잠그면 창을 못 닫는다
      locked: deleteMutation.isPending && !deleteMutation.isPaused,
      error: deleteMutation.error?.message ?? null,
      confirm: () => deleteMutation.mutate(trip.id, { onSuccess: toTrips }),
    },
  };
}
