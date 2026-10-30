"use client";

import { useState } from "react";

import { useTripCities } from "@/entities/city";
import { useMyProfile, useUser } from "@/entities/session";
import type { Trip } from "@/entities/trip";
import { type TripMember, useRemoveMember, useTripMembers } from "@/entities/trip-member";
import { useTripExit } from "@/features/trip/exit";
import { useOpenParam } from "@/shared/lib/use-open-param";
import type { ToastMessage } from "@/shared/ui/toast";

import { type InfoKey, infoRows } from "../lib/info-rows";

/** 설정에서 여는 창 — 여행 정보 줄마다 하나와 나가기 · 삭제 */
export type SettingsDialog = InfoKey | "leave" | "delete";

/** 다른 화면이 `?open=rates` 로 여는 창 — 홈 위젯 편집의 「여행 환율 넣기」 */
const OPEN_RATES = "rates";

/**
 * 여행 설정 화면의 상태 — 연 창 하나, 바꿀 기준 화폐(다시 계산 확인), 내보낼 멤버, 토스트(화면에 하나).
 * 나가기 · 삭제는 여행 홈 「편집」 과 같은 훅을 쓴다. 주소에 `?open=rates` 가 있으면 환율 창을 열고 시작한다
 */
export function useTripSettings(trip: Trip) {
  const { data: user } = useUser();
  const { data: profile } = useMyProfile();
  const { data: members } = useTripMembers(trip.id);
  const { data: cities } = useTripCities(trip.id);
  const exit = useTripExit(trip);
  const kickMutation = useRemoveMember(trip.id);
  const requested = useOpenParam();
  const [open, setOpen] = useState<SettingsDialog | null>(() =>
    requested === OPEN_RATES ? "rates" : null,
  );
  const [rebaseTo, setRebaseTo] = useState<string | null>(null);
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
    /** 여행지 통화(첫 도시) — 환율 창이 비어 있는 통화의 처음 값을 채울 때 */
    destination: cities?.[0]?.currency ?? null,
    open,
    choose,
    close: () => setOpen(null),
    rebase: {
      to: rebaseTo,
      /** 기준 화폐 고르기에서 「다음」 */
      pick: (code: string) => {
        setOpen(null);
        setRebaseTo(code);
      },
      cancel: () => setRebaseTo(null),
      done: () => {
        setRebaseTo(null);
        setToast({ text: "기준 화폐를 바꿨어요", id: Date.now() });
      },
    },
    /** 환율 창에서 저장한 뒤 */
    ratesSaved: () => {
      setOpen(null);
      setToast({ text: "여행 환율을 저장했어요", id: Date.now() });
    },
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
