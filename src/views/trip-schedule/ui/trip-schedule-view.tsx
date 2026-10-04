"use client";

import { useMemo, useState } from "react";

import {
  buildTimeline,
  type ScheduleItem,
  useMoves,
  useOpenMemos,
  useScheduleItems,
} from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { AddScheduleDialog, type DirectAddRequest } from "@/features/schedule/add-schedule";
import { useDayParam } from "@/features/schedule/day-selector";
import { MoveDialog, useMoveDialog } from "@/features/schedule/move-form";
import { PlaceFormDialog } from "@/features/schedule/place-form";
import { dayCount } from "@/shared/lib/days";
import { useMediaQuery } from "@/shared/lib/use-media-query";

import { ItemEditSheet } from "./item-edit-sheet";
import { MobileSchedule } from "./mobile-schedule";
import { PcSchedule } from "./pc/pc-schedule";

type TripScheduleViewProps = { tripId: string };

/**
 * 일정 화면. 상태와 동작(날짜 · 타임라인 · 메모 펼침 · 창들)은 여기서 쥐고, 배치는 모바일 · PC 레이아웃이 그린다.
 * 레이아웃은 미디어 쿼리로 하나만 마운트한다 — CSS 로 숨기면 Google 지도가 두 개 생긴다.
 * 첫 렌더(하이드레이션)에서는 화면 폭을 몰라 아무 레이아웃도 그리지 않는다.
 */
export function TripScheduleView({ tripId }: TripScheduleViewProps) {
  const { data: trip } = useTrip(tripId);
  const { data: items, isPending } = useScheduleItems(tripId);
  const totalDays = trip ? dayCount(trip.start_date, trip.end_date) : 1;
  const [day, setDay] = useDayParam(totalDays);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const [addOpen, setAddOpen] = useState(false);
  // 일정 추가의 「직접 추가」로 연 장소 입력 폼. 담으면 일정 추가 화면으로 돌아와 한 줄 알린다
  const [direct, setDirect] = useState<DirectAddRequest | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);

  const dayItems = useMemo(() => (items ?? []).filter((it) => it.day_index === day), [items, day]);

  // 이동 기록을 다 불러오기 전(또는 실패)에는 이동 방법 창을 열지 않는다. 빈 창에서 저장하면 기존 기록을 덮어쓴다
  const { data: moves, isSuccess: movesReady } = useMoves(tripId);
  const rows = useMemo(() => buildTimeline(dayItems, moves), [dayItems, moves]);
  const moveDialog = useMoveDialog(movesReady);
  const memos = useOpenMemos(rows);

  const Layout = isDesktop ? PcSchedule : MobileSchedule;

  return (
    <>
      {isDesktop !== null && (
        <Layout
          trip={trip}
          totalDays={totalDays}
          day={day}
          onDayChange={setDay}
          rows={rows}
          isPending={isPending}
          memos={memos}
          onOpen={(row) => setEditing(row.item)}
          onEditMove={moveDialog.openFor}
          onAddPlace={() => {
            setAddNotice(null);
            setAddOpen(true);
          }}
        />
      )}

      <MoveDialog
        tripId={tripId}
        open={moveDialog.open}
        pair={moveDialog.pair}
        onClose={moveDialog.close}
      />

      {trip && (
        <AddScheduleDialog
          tripId={tripId}
          startDate={trip.start_date}
          totalDays={totalDays}
          initialDay={day}
          items={items ?? []}
          open={addOpen}
          onOpenChange={setAddOpen}
          onDirectAdd={setDirect}
          notice={addNotice}
        />
      )}

      {direct && (
        <PlaceFormDialog
          tripId={tripId}
          dayIndex={direct.dayIndex}
          city={direct.city}
          initialName={direct.name}
          open
          onOpenChange={(open) => !open && setDirect(null)}
          onSaved={(name) => {
            setAddNotice(`‘${name}’을(를) day ${direct.dayIndex + 1}에 담았어요`);
            setDirect(null);
          }}
        />
      )}

      {trip && (
        <ItemEditSheet
          tripId={tripId}
          startDate={trip.start_date}
          totalDays={totalDays}
          editing={editing}
          dayItems={dayItems}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
