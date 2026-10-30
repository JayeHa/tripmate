"use client";

import { useState } from "react";

import { type City, useTripCities } from "@/entities/city";
import {
  type Place,
  useAddPlacesToSchedule,
  useRemoveGuidePlace,
  useSetGuideMemo,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import type { GuideSaved } from "@/features/schedule/place-form";
import type { ToastMessage } from "@/shared/ui/toast";

import { type GuideCard, guideSavedToast, type GuideTab } from "../lib/guide";

/**
 * 가이드 탭의 창 · 동작 — 상세, 「+ 일정」(날짜 고르기), 메모, 보관함에서 빼기, 장소 정보 수정, 「+ ○○ 추가」(장소 입력), 토스트(탭에 하나).
 * 창마다 대상 카드의 장소 id 만 들고, 카드는 그릴 때 목록에서 다시 찾는다(일행이 고친 값이 바로 보이게)
 */
export function useGuideActions(tripId: string, tab: GuideTab) {
  const { data: user } = useUser();
  const { data: cities = [] } = useTripCities(tripId);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dayFor, setDayFor] = useState<string | null>(null);
  const [memoFor, setMemoFor] = useState<string | null>(null);
  const [removeFor, setRemoveFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ place: Place; city: City | null } | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const add = useAddPlacesToSchedule(tripId);
  const remove = useRemoveGuidePlace(tripId);
  const memo = useSetGuideMemo(tripId);

  /** 토스트 한 줄 */
  const show = (text: string) => setToast({ text, id: Date.now() });

  return {
    myId: user?.id ?? null,
    detailId,
    openDetail: setDetailId,
    closeDetail: () => setDetailId(null),
    day: {
      placeId: dayFor,
      /** 날짜 고르기를 연다 — 상세는 닫는다 */
      ask: (card: GuideCard) => {
        add.reset();
        setDetailId(null);
        setDayFor(card.place.id);
      },
      cancel: () => setDayFor(null),
      pending: add.isPending,
      error: add.error?.message ?? null,
      /** 그날 끝에 넣는다 */
      pick: (dayIndex: number) => {
        if (!dayFor) return;
        add.mutate(
          { dayIndex, entries: [{ place_id: dayFor }] },
          {
            onSuccess: () => {
              setDayFor(null);
              show(`day ${dayIndex + 1}에 추가했어요`);
            },
          },
        );
      },
    },
    memo: {
      placeId: memoFor,
      ask: (card: GuideCard) => {
        memo.reset();
        setMemoFor(card.place.id);
      },
      cancel: () => setMemoFor(null),
      pending: memo.isPending,
      error: memo.error?.message ?? null,
      save: (text: string) => {
        if (!memoFor) return;
        memo.mutate(
          { placeId: memoFor, memo: text },
          {
            onSuccess: () => {
              setMemoFor(null);
              show(text.trim() ? "메모를 저장했어요" : "메모를 지웠어요");
            },
          },
        );
      },
    },
    remove: {
      placeId: removeFor,
      /** 빼기 확인을 연다. 일정에 있으면 열지 않고 알린다(DB 도 막는다) */
      ask: (card: GuideCard) => {
        if (card.inSchedule) {
          show("일정에 있는 장소는 일정에서 먼저 지워 주세요");
          return;
        }
        remove.reset();
        setDetailId(null);
        setRemoveFor(card.place.id);
      },
      cancel: () => setRemoveFor(null),
      pending: remove.isPending,
      locked: remove.isPending && !remove.isPaused,
      error: remove.error?.message ?? null,
      confirm: () => {
        if (!removeFor) return;
        remove.mutate(removeFor, {
          onSuccess: () => {
            setRemoveFor(null);
            show("보관함에서 뺐어요");
          },
        });
      },
    },
    edit: {
      target: editing,
      /** 장소 정보 수정 — 만든 사람만(장소는 만든 사람만 고친다) */
      ask: (card: GuideCard) => {
        setDetailId(null);
        setEditing({
          place: card.place,
          city: cities.find((c) => c.id === card.place.city_id) ?? null,
        });
      },
      close: (changed: boolean) => {
        setEditing(null);
        if (changed) show("장소 정보를 수정했어요");
      },
      cancel: () => setEditing(null),
    },
    create: {
      open: creating,
      /** 장소 입력의 도시 — 여행의 첫 도시(검색 범위 · 처음 지도). 저장할 때 DB 가 좌표로 가장 가까운 여행 도시에 둔다 */
      city: cities[0] ?? null,
      ask: () => setCreating(true),
      cancel: () => setCreating(false),
      done: (saved: GuideSaved) => {
        setCreating(false);
        show(guideSavedToast(saved, tab));
      },
    },
    toast,
    clearToast: () => setToast(null),
  };
}

export type GuideActions = ReturnType<typeof useGuideActions>;
