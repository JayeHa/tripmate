"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { City } from "@/entities/city";
import {
  buildTimeline,
  type Place,
  type ScheduleItem,
  useAlternatives,
  useMoves,
  useOpenMemos,
  useScheduleItems,
} from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { AddScheduleDialog, type DirectAddRequest } from "@/features/schedule/add-schedule";
import { useDayParam } from "@/features/schedule/day-selector";
import { ItemDetailDialog } from "@/features/schedule/item-detail";
import { MoveDialog, useMoveDialog } from "@/features/schedule/move-form";
import { PlaceFormDialog } from "@/features/schedule/place-form";
import { dayCount, dayOfWeek } from "@/shared/lib/days";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

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
  // 일정 추가의 「직접 추가」로 연 장소 입력 폼. 담으면 두 창을 모두 닫고 담은 날을 보인다.
  // 일정 추가에 아직 담지 않은 고른 곳이 있으면 그 창은 닫지 않고 한 줄 알린다(닫으면 고른 곳이 사라진다)
  const [direct, setDirect] = useState<DirectAddRequest | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);
  const directRef = useRef(direct);
  useEffect(() => {
    directRef.current = direct;
  }, [direct]);
  // 상세를 연 일정. 줄은 그날 목록에서 다시 찾는다 — 고친 내용이 바로 보이고, 다른 날로 옮기면 저절로 닫힌다
  const [openId, setOpenId] = useState<string | null>(null);
  // 상세의 「장소 정보 수정」 으로 연 장소 입력 폼. 저장하면 닫고 상세 위에 토스트를 띄운다
  const [placeEdit, setPlaceEdit] = useState<{ place: Place; city: City | null } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  // 상세의 대체 장소 「+ 직접 추가」 로 연 장소 입력 폼(대체 장소 모드)
  const [altAdd, setAltAdd] = useState<{ main: ScheduleItem; city: City | null } | null>(null);

  const dayItems = useMemo(() => (items ?? []).filter((it) => it.day_index === day), [items, day]);

  // 이동 기록을 다 불러오기 전(또는 실패)에는 이동 방법 창을 열지 않는다. 빈 창에서 저장하면 기존 기록을 덮어쓴다
  const { data: moves, isSuccess: movesReady } = useMoves(tripId);
  const { data: alternatives } = useAlternatives(tripId);
  // 요일별 운영시간에서 그날 값을 고르려고 그날 요일을 넘긴다
  const dow = trip ? dayOfWeek(trip.start_date, day) : null;
  const rows = useMemo(
    () => buildTimeline(dayItems, moves, dow, alternatives),
    [dayItems, moves, dow, alternatives],
  );
  const moveDialog = useMoveDialog(movesReady);
  const memos = useOpenMemos(rows);

  const Layout = isDesktop ? PcSchedule : MobileSchedule;

  // 열린 일정의 줄. 다른 멤버가 옮기거나 지워 그날 줄이 없어지면 id 도 지운다 — 남겨 두면 나중에
  // 그날로 가는 순간 상세가 저절로 열린다(언마운트된 뒤 끝난 이동 · 삭제는 onDone 을 부르지 못한다)
  const openRow = rows.find((r) => r.item.id === openId) ?? null;
  if (openId && !openRow) setOpenId(null);

  /**
   * 직접 추가 요청 하나의 담기가 끝났다. 폼은 저장 중에 닫히지 않지만 오프라인으로 멈춘 동안은 닫을 수 있어서,
   * 그 폼이 이미 닫혔으면(다른 요청이 열렸거나 아무것도 없으면) 창 닫기 · 날짜 이동을 하지 않는다
   */
  function finishDirect(req: DirectAddRequest) {
    if (directRef.current !== req) return;
    setDirect(null);
    if (req.pendingCount > 0) {
      setAddNotice(
        `직접 추가한 곳을 day ${req.dayIndex + 1}에 담았어요. 고른 ${req.pendingCount}곳은 아직 담지 않았어요`,
      );
      return;
    }
    setAddOpen(false);
    setDay(req.dayIndex);
  }

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
          onOpen={(row) => setOpenId(row.item.id)}
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
          city={direct.city}
          mode={{
            kind: "add",
            dayIndex: direct.dayIndex,
            initialQuery: direct.name,
            onSaved: () => finishDirect(direct),
          }}
          open
          onOpenChange={(open) => !open && setDirect(null)}
        />
      )}

      {trip && isDesktop !== null && (
        <ItemDetailDialog
          tripId={tripId}
          startDate={trip.start_date}
          totalDays={totalDays}
          row={openRow}
          dayItems={dayItems}
          isDesktop={isDesktop}
          onClose={() => setOpenId(null)}
          onEditPlace={(place, city) => setPlaceEdit({ place, city })}
          onAddAlternative={(main, city) => setAltAdd({ main, city })}
          onSwapped={setOpenId}
        />
      )}

      {altAdd && (
        <PlaceFormDialog
          tripId={tripId}
          city={altAdd.city}
          mode={{
            kind: "add",
            dayIndex: altAdd.main.day_index,
            initialQuery: "",
            alternativeOf: altAdd.main,
            onSaved: () => setAltAdd(null),
          }}
          open
          onOpenChange={(open) => !open && setAltAdd(null)}
        />
      )}

      {placeEdit && (
        <PlaceFormDialog
          tripId={tripId}
          city={placeEdit.city}
          mode={{
            kind: "edit",
            place: placeEdit.place,
            onSaved: (changed) => {
              setPlaceEdit(null);
              if (changed) setToast({ text: "장소 정보를 수정했어요", id: Date.now() });
            },
          }}
          open
          onOpenChange={(open) => !open && setPlaceEdit(null)}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
