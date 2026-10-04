"use client";

import { useMemo, useState } from "react";

import {
  buildTimeline,
  itemCoords,
  type ScheduleItem,
  useAddPlaceToSchedule,
  useMoves,
  useOpenMemos,
  useScheduleItems,
} from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useDayParam } from "@/features/schedule/day-selector";
import { MoveDialog, useMoveDialog } from "@/features/schedule/move-form";
import { type PickedPlace, PlaceSearchSheet } from "@/features/schedule/place-search";
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const addToSchedule = useAddPlaceToSchedule(tripId);

  const dayItems = useMemo(() => (items ?? []).filter((it) => it.day_index === day), [items, day]);

  // 이동 기록을 다 불러오기 전(또는 실패)에는 이동 방법 창을 열지 않는다. 빈 창에서 저장하면 기존 기록을 덮어쓴다
  const { data: moves, isSuccess: movesReady } = useMoves(tripId);
  const rows = useMemo(() => buildTimeline(dayItems, moves), [dayItems, moves]);
  const moveDialog = useMoveDialog(movesReady);
  const memos = useOpenMemos(rows);

  const bias = useMemo(
    () => dayItems.map(itemCoords).find((at) => at !== null) ?? null,
    [dayItems],
  );

  /**
   * 장소 검색에서 고른 곳을 그날 끝에 붙인다. 장소와 일정을 서버에서 한 번에 만든다.
   * 담기에 성공해야 시트를 닫는다 — 실패하면 시트에 이유를 보이고 다시 고를 수 있게 둔다.
   */
  function addPlace({ place_id, ...place }: PickedPlace) {
    addToSchedule.mutate(
      { dayIndex: day, place: { ...place, google_place_id: place_id } },
      { onSuccess: () => setSearchOpen(false) },
    );
  }

  /** 검색 시트를 열고 닫는다. 지난 실패 문구는 지운다 */
  function toggleSearch(open: boolean) {
    addToSchedule.reset();
    setSearchOpen(open);
  }

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
          onAddPlace={() => toggleSearch(true)}
        />
      )}

      <MoveDialog
        tripId={tripId}
        open={moveDialog.open}
        pair={moveDialog.pair}
        onClose={moveDialog.close}
      />

      <PlaceSearchSheet
        open={searchOpen}
        onOpenChange={toggleSearch}
        bias={bias}
        onPick={addPlace}
        pending={addToSchedule.isPending}
        error={addToSchedule.error && "일정에 담지 못했어요. 잠시 후 다시 시도해 주세요."}
      />

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
