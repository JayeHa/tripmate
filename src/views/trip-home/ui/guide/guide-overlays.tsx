"use client";

import type { Trip } from "@/entities/trip";
import { PlaceFormDialog } from "@/features/schedule/place-form";
import { Toast } from "@/shared/ui/toast";

import { GUIDE_TAB_CATEGORY, type GuideCard, type GuideTab } from "../../lib/guide";
import type { GuideActions } from "../../model/use-guide-actions";
import { GuideDayPicker } from "./guide-day-picker";
import { GuideDetail } from "./guide-detail";
import { GuideMemoSheet } from "./guide-memo-sheet";
import { GuideRemoveDialog } from "./guide-remove-dialog";

type GuideOverlaysProps = {
  trip: Trip;
  /** 지금 탭의 카드 — 창의 대상은 장소 id 로 들고 여기서 찾는다(다른 탭 카드는 창이 열리기 전에 닫힌다) */
  cards: GuideCard[];
  tab: GuideTab;
  a: GuideActions;
};

/** 가이드 탭의 창 — 상세 · 날짜 고르기 · 메모 · 빼기 확인 · 장소 정보 수정 · 장소 추가 · 토스트 */
export function GuideOverlays({ trip, cards, tab, a }: GuideOverlaysProps) {
  const find = (id: string | null) => cards.find((c) => c.place.id === id) ?? null;
  const memoCard = find(a.memo.placeId);
  return (
    <>
      <GuideDetail
        card={find(a.detailId)}
        onClose={a.closeDetail}
        onAdd={a.day.ask}
        onMemo={a.memo.ask}
        onEdit={a.edit.ask}
        myId={a.myId}
      />
      <GuideDayPicker
        day={a.day}
        name={find(a.day.placeId)?.place.name ?? null}
        startDate={trip.start_date}
        endDate={trip.end_date}
      />
      <GuideMemoSheet
        memo={a.memo}
        target={memoCard && { name: memoCard.place.name, memo: memoCard.memo }}
      />
      <GuideRemoveDialog remove={a.remove} name={find(a.remove.placeId)?.place.name ?? null} />
      {a.edit.target && (
        <PlaceFormDialog
          tripId={trip.id}
          city={a.edit.target.city}
          mode={{ kind: "edit", place: a.edit.target.place, onSaved: a.edit.close }}
          open
          onOpenChange={(open) => !open && a.edit.cancel()}
        />
      )}
      {a.create.open && (
        <PlaceFormDialog
          tripId={trip.id}
          city={a.create.city}
          mode={{ kind: "guide", category: GUIDE_TAB_CATEGORY[tab], onSaved: a.create.done }}
          open
          onOpenChange={(open) => !open && a.create.cancel()}
        />
      )}
      <Toast message={a.toast} onDone={a.clearToast} />
    </>
  );
}
