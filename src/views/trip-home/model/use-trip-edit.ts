"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useUser } from "@/entities/session";
import { type Trip, useDeleteTrip } from "@/entities/trip";
import { useRemoveMember } from "@/entities/trip-member";
import { queryKeys } from "@/shared/api/query-keys";
import { NAV } from "@/shared/lib/nav-transition";

import { type EditAction, editMenu } from "../lib/edit-menu";

/**
 * 여행 홈 「편집」 — 지금 연 창 하나와 나가기 · 삭제.
 * 나가기 · 삭제가 끝나면 내 여행 목록으로 간다(이 여행을 더 읽을 수 없다). 실패하면 확인 창에 남아 이유를 보인다
 */
export function useTripEdit(trip: Trip) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: user } = useUser();
  const [open, setOpen] = useState<EditAction | null>(null);
  const leaveMutation = useRemoveMember(trip.id);
  const deleteMutation = useDeleteTrip();

  const isOwner = user ? user.id === trip.owner_id : null;

  /**
   * 내 여행 목록으로. 이 여행의 캐시(기기 저장분 포함)를 지워 뒤로 가기로 더는 볼 수 없는 여행이 그려지지 않게 하고,
   * 목록에서 이 여행이 빠지게 다시 읽는다. 이동을 먼저 걸어 지운 뒤 홈이 빈 값으로 다시 그려지지 않게 한다
   */
  function toTrips() {
    router.replace("/trips", { transitionTypes: NAV.back });
    qc.removeQueries({ queryKey: queryKeys.trips.detail(trip.id) });
    void qc.invalidateQueries({ queryKey: queryKeys.trips.all, exact: true });
  }

  /** 메뉴 줄을 골랐을 때 — 확인 창은 지난 오류 없이 연다 */
  function choose(action: EditAction) {
    leaveMutation.reset();
    deleteMutation.reset();
    setOpen(action);
  }

  return {
    menu: editMenu(isOwner),
    open,
    choose,
    close: () => setOpen(null),
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

export type TripEditState = ReturnType<typeof useTripEdit>;
