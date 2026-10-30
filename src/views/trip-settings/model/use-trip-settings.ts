"use client";

import { useState } from "react";

import { useTripCities } from "@/entities/city";
import { useMyProfile, useUser } from "@/entities/session";
import type { Trip } from "@/entities/trip";
import { type TripMember, useRemoveMember, useTripMembers } from "@/entities/trip-member";
import { useTripExit } from "@/features/trip/exit";
import type { ToastMessage } from "@/shared/ui/toast";

import { type InfoKey, infoRows } from "../lib/info-rows";

/** 설정에서 여는 창 — 여행 정보 줄(이름 · 도시 · 기간)과 나가기 · 삭제 */
export type SettingsDialog = Extract<InfoKey, "title" | "cities" | "dates"> | "leave" | "delete";

/**
 * 여행 설정 화면의 상태 — 연 창 하나, 내보낼 멤버, 토스트(화면에 하나).
 * 나가기 · 삭제는 여행 홈 「편집」 과 같은 훅을 쓴다
 */
export function useTripSettings(trip: Trip) {
  const { data: user } = useUser();
  const { data: profile } = useMyProfile();
  const { data: members } = useTripMembers(trip.id);
  const { data: cities } = useTripCities(trip.id);
  const exit = useTripExit(trip);
  const kickMutation = useRemoveMember(trip.id);
  const [open, setOpen] = useState<SettingsDialog | null>(null);
  const [kicking, setKicking] = useState<TripMember | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  /** 창을 연다 — 확인 창은 지난 오류 없이 */
  function choose(dialog: SettingsDialog) {
    exit.reset();
    setOpen(dialog);
  }

  return {
    user,
    profile,
    members,
    exit,
    rows: infoRows(
      trip,
      cities?.map((c) => c.name),
    ),
    open,
    choose,
    close: () => setOpen(null),
    kick: {
      target: kicking,
      /** 방장이 내보낼 멤버를 골랐을 때 — 확인 창을 연다 */
      ask: (member: TripMember) => {
        kickMutation.reset();
        setKicking(member);
      },
      cancel: () => setKicking(null),
      pending: kickMutation.isPending,
      locked: kickMutation.isPending && !kickMutation.isPaused,
      error: kickMutation.error?.message ?? null,
      confirm: () =>
        kicking &&
        kickMutation.mutate(kicking.user_id, {
          onSuccess: () => {
            setKicking(null);
            setToast({ text: "멤버를 내보냈어요", id: Date.now() });
          },
        }),
    },
    toast,
    showToast: (text: string, detail?: string) => setToast({ text, detail, id: Date.now() }),
    clearToast: () => setToast(null),
  };
}

export type TripSettingsState = ReturnType<typeof useTripSettings>;
