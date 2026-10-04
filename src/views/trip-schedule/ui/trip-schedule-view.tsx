"use client";

import { useMemo, useState } from "react";

import {
  buildTimeline,
  type ScheduleItem,
  ScheduleMap,
  Timeline,
  type TimelineRow,
  useCreateScheduleItem,
  useMoves,
  useOpenMemos,
  useScheduleItems,
} from "@/entities/schedule-item";
import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { DayChips, useDayParam } from "@/features/schedule/day-selector";
import { MoveDialog, useMoveDialog } from "@/features/schedule/move-form";
import { type PickedPlace, PlaceSearchSheet } from "@/features/schedule/place-search";
import { dayCount } from "@/shared/lib/days";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { DayHeader } from "./day-header";
import { ItemEditSheet } from "./item-edit-sheet";
import { MapPanel } from "./map-panel";

type TripScheduleViewProps = { tripId: string };

export function TripScheduleView({ tripId }: TripScheduleViewProps) {
  const { data: trip } = useTrip(tripId);
  const { data: user } = useUser();
  const { data: items, isPending } = useScheduleItems(tripId);
  const totalDays = trip ? dayCount(trip.start_date, trip.end_date) : 1;
  const [day, setDay] = useDayParam(totalDays);

  const [searchOpen, setSearchOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);

  const create = useCreateScheduleItem(tripId);

  const dayItems = useMemo(() => (items ?? []).filter((it) => it.day_index === day), [items, day]);

  // 이동 기록을 다 불러오기 전(또는 실패)에는 이동 방법 창을 열지 않는다. 빈 창에서 저장하면 기존 기록을 덮어쓴다
  const { data: moves, isSuccess: movesReady } = useMoves(tripId);
  const rows = useMemo(() => buildTimeline(dayItems, moves), [dayItems, moves]);
  const moveDialog = useMoveDialog(movesReady);
  const memos = useOpenMemos(rows);
  const [mapOpen, setMapOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** 지도 핀을 누르면 그 카드로 스크롤한다 */
  function selectPin(row: TimelineRow) {
    setSelectedId(row.item.id);
    document
      .getElementById(`item-${row.item.id}`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const bias = useMemo(() => {
    const first = dayItems.find((it) => it.lat != null && it.lng != null);
    return first ? { lat: first.lat!, lng: first.lng! } : null;
  }, [dayItems]);

  function addPlace(place: PickedPlace) {
    create.mutate({ trip_id: tripId, day_index: day, created_by: user?.id ?? null, ...place });
  }

  return (
    <>
      <AppHeader title={trip?.title ?? "일정"} back="/trips" />
      {/* 상단바 아래에 붙는 지도 + 날짜 칩. 상단바 높이(52px)는 AppHeader 의 h-13 과 같다 */}
      <div className="sticky top-[calc(var(--shell-top)+3.25rem)] z-10 bg-white">
        <MapPanel open={mapOpen} onToggle={() => setMapOpen((o) => !o)}>
          <ScheduleMap rows={rows} selectedId={selectedId} onSelect={selectPin} />
        </MapPanel>
        {trip && (
          <DayChips
            startDate={trip.start_date}
            totalDays={totalDays}
            value={day}
            onChange={setDay}
          />
        )}
      </div>

      <main className="flex flex-1 flex-col">
        {trip && (
          <DayHeader
            startDate={trip.start_date}
            day={day}
            hasMemos={memos.hasMemos}
            allOpen={memos.allOpen}
            onToggleAll={memos.toggleAll}
          />
        )}
        {isPending && (
          <div className="flex flex-col gap-3 px-4">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        )}
        {!isPending && dayItems.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="font-medium">아직 일정이 없어요</p>
            <p className="text-sm text-muted-foreground">아래 버튼으로 장소를 추가해보세요.</p>
          </div>
        )}
        <Timeline
          rows={rows}
          openIds={memos.openIds}
          onToggleMemo={memos.toggle}
          onOpen={(row) => setEditing(row.item)}
          onEditMove={moveDialog.openFor}
        />
        {/* 메모 추가는 메모 단계에서 이 옆에 붙는다 */}
        <div className="flex gap-2.5 px-5 pt-1 pb-8">
          <Button
            variant="outline"
            size="form"
            className="flex-1"
            onClick={() => setSearchOpen(true)}
          >
            장소 추가
          </Button>
        </div>
      </main>

      <MoveDialog
        tripId={tripId}
        open={moveDialog.open}
        pair={moveDialog.pair}
        onClose={moveDialog.close}
      />

      <PlaceSearchSheet
        open={searchOpen}
        onOpenChange={setSearchOpen}
        bias={bias}
        onPick={addPlace}
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
