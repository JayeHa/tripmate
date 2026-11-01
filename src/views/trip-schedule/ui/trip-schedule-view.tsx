"use client";

import { useMemo, useState } from "react";

import { useTripHolidays } from "@/entities/city";
import type { Memo, TimelineRow } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import { AddScheduleDialog } from "@/features/schedule/add-schedule";
import { useDayParam } from "@/features/schedule/day-selector";
import { useScheduleEdit } from "@/features/schedule/edit-mode";
import { ItemDetailDialog } from "@/features/schedule/item-detail";
import { MoveDialog, useMoveDialog } from "@/features/schedule/move-form";
import { PlaceFormDialog } from "@/features/schedule/place-form";
import { holidayName } from "@/shared/lib/country-holidays";
import { dayCount, dayIndexToDate } from "@/shared/lib/days";
import { useMediaQuery } from "@/shared/lib/use-media-query";

import { useChecklistChips } from "../model/use-checklist-chips";
import { useDayWeather } from "../model/use-day-weather";
import { useDetailOverlays } from "../model/use-detail-overlays";
import { useDirectAdd } from "../model/use-direct-add";
import { useFlightsOverlay } from "../model/use-flights-overlay";
import { useOpenRequest } from "../model/use-open-request";
import { useScheduleEntry } from "../model/use-schedule-progress";
import { useScheduleSections } from "../model/use-schedule-sections";
import { useScheduleVouchers } from "../model/use-schedule-vouchers";
import { useStaysOverlay } from "../model/use-stays-overlay";
import { DetailOverlays } from "./detail-overlays";
import { FlightsOverlay } from "./flights-overlay";
import { MobileSchedule } from "./mobile-schedule";
import { PcSchedule } from "./pc/pc-schedule";
import type { DayJump, ScheduleLayoutProps } from "./schedule-layout";
import { ScheduleVoucherOverlays, voucherSlot } from "./schedule-vouchers";
import { StaysOverlay } from "./stays-overlay";

type TripScheduleViewProps = { tripId: string };

/**
 * 일정 화면. 상태와 동작(날짜 · 타임라인 · 창들)은 여기서 쥐고, 배치는 모바일 · PC 레이아웃이 그린다.
 * 모든 날짜를 이어서 그리고, `?day` 는 스크롤로 보고 있는 날을 따라간다(레이아웃이 바꾼다).
 * 레이아웃은 미디어 쿼리로 하나만 마운트한다 — CSS 로 숨기면 Google 지도가 두 개 생긴다.
 * 첫 렌더(하이드레이션)에서는 화면 폭을 몰라 아무 레이아웃도 그리지 않는다.
 * 주소에 `?open=일정id` 가 있으면(홈의 미리 보기 「일정에서 보기」) 일정을 다 읽은 뒤 그 카드를 누른 것처럼 연다.
 */
export function TripScheduleView({ tripId }: TripScheduleViewProps) {
  const { data: trip } = useTrip(tripId);
  const totalDays = trip ? dayCount(trip.start_date, trip.end_date) : 1;
  const holidays = useTripHolidays(tripId, trip);
  const { items, isPending, itemsReady, movesReady, sections, sectionsReady, settled } =
    useScheduleSections(tripId, trip, totalDays);
  const [day, setDay] = useDayParam(totalDays);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // 뷰가 그 날을 보여 줘야 할 때(직접 추가로 담은 날 · 편집을 마친 날) 레이아웃에 보내는 스크롤 요청
  const [jump, setJump] = useState<DayJump | null>(null);
  /** 그 날로 간다 — 주소를 바꾸고 레이아웃이 그 날짜로 스크롤한다 */
  function showDay(next: number) {
    setDay(next);
    setJump({ day: next, at: Date.now() });
  }

  // 일정 추가 창 · 그 안의 「직접 추가」 장소 입력 폼
  const add = useDirectAdd(showDay);
  // 숙소 창과 그 위의 위치 고르기
  const stays = useStaysOverlay(tripId, trip);
  // 항공편 창
  const flights = useFlightsOverlay(tripId);
  // 상세를 연 일정. 줄은 모든 날짜에서 다시 찾는다 — 고친 내용이 바로 보이고, 지워지면 저절로 닫힌다
  const [openId, setOpenId] = useState<string | null>(null);
  // 상세 · 카드 위에 여는 창들(장소 정보 수정 · 대체 장소 직접 추가 · 메모 작성 · 토스트)
  const overlays = useDetailOverlays();
  const authorOf = useMemberLookup(tripId);
  const checklistOf = useChecklistChips(tripId);
  const vouchers = useScheduleVouchers(tripId, openCard);
  // 일정 편집. 마치면 마지막으로 편집하던 날로 간다
  const edit = useScheduleEdit({
    tripId,
    items,
    // 읽기에 실패하면 isPending 은 false 지만 일정은 빈 목록이다 — 성공했을 때만 연다
    itemsReady,
    trip,
    totalDays,
    onExit: showDay,
    onInterrupted: overlays.showToast,
  });
  const moveDialog = useMoveDialog(movesReady);
  const weatherOf = useDayWeather(tripId, trip, sections);

  // 열린 일정의 줄. 다른 멤버가 지워 줄이 없어지면 id 도 지운다 — 남겨 두면 나중에
  // 같은 줄이 다시 그려지는 순간 상세가 저절로 열린다(언마운트된 뒤 끝난 이동 · 삭제는 onDone 을 부르지 못한다)
  const allRows = useMemo(() => sections.flatMap((s) => s.rows), [sections]);
  const openRow = allRows.find((r) => r.item.id === openId) ?? null;
  if (openId && !openRow) setOpenId(null);
  useOpenRequest(sectionsReady, allRows, openCard);

  /** 카드를 눌렀다 — 날짜 메모는 시간 · 메모 창, 항공편 카드는 항공편 상세, 나머지는 일정 상세 */
  function openCard(row: TimelineRow) {
    if (row.kind === "note") overlays.openNote(row.item);
    else if (row.item.flight_id) flights.openFlight(row.item.flight_id);
    else setOpenId(row.item.id);
  }

  /** 항공편 상세의 메모 — 항공편 창을 닫고 그 카드의 메모 작성 창을 연다 */
  function openFlightMemo(cardId: string, memo: Memo | null) {
    const row = allRows.find((r) => r.item.id === cardId);
    if (!row) return;
    flights.setOpen(false);
    overlays.openMemo(row, memo);
  }

  const layout: ScheduleLayoutProps = {
    trip,
    holidayOf: (d) =>
      trip && holidays ? holidayName(holidays, dayIndexToDate(trip.start_date, d)) : null,
    weatherOf,
    totalDays,
    day,
    onDayChange: setDay,
    sections,
    isPending,
    jump,
    // 여행 중이면 다녀온 일정(회색)과 들어갈 때 보여 줄 오늘의 다음 장소
    ...useScheduleEntry(tripId, trip, items, { items: itemsReady, settled }),
    onOpen: openCard,
    onEditMove: moveDialog.openFor,
    onAddPlace: add.open,
    authorOf,
    checklistOf,
    voucherOf: vouchers.voucherOf,
    onAddDayMemo: overlays.openDayMemo,
    edit,
    startEditAt: edit.opener,
    onOpenStays: stays.openStays,
    stayCount: stays.count,
    onOpenFlights: flights.openFlights,
    flightCount: flights.count,
  };

  return (
    <>
      {isDesktop === true && <PcSchedule {...layout} onGuide={overlays.showToast} />}
      {isDesktop === false && <MobileSchedule {...layout} />}

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
          initialDay={add.addDay ?? day}
          items={items}
          open={add.addDay !== null}
          onOpenChange={(open) => !open && add.close()}
          onDirectAdd={add.setDirect}
          notice={add.notice}
        />
      )}

      {add.direct && (
        <PlaceFormDialog
          tripId={tripId}
          city={add.direct.city}
          mode={{
            kind: "add",
            dayIndex: add.direct.dayIndex,
            initialQuery: add.direct.name,
            onSaved: () => add.finish(add.direct!),
          }}
          open
          onOpenChange={(open) => !open && add.setDirect(null)}
        />
      )}

      {/* 일정 화면에서 여는 하위 창 — 숙소(+ 위치 고르기 · 결제) · 항공편 */}
      {trip && (
        <>
          <StaysOverlay
            tripId={tripId}
            trip={trip}
            items={items}
            stays={stays}
            onToast={overlays.showToast}
            vouchers={vouchers}
          />
          <FlightsOverlay
            tripId={tripId}
            trip={trip}
            items={items}
            flights={flights}
            onToast={overlays.showToast}
            onMemo={openFlightMemo}
            vouchers={vouchers}
          />
        </>
      )}

      {trip && isDesktop !== null && (
        <ItemDetailDialog
          tripId={tripId}
          startDate={trip.start_date}
          totalDays={totalDays}
          row={openRow}
          isDesktop={isDesktop}
          onClose={() => setOpenId(null)}
          onEditPlace={overlays.openPlaceEdit}
          onEditStay={stays.openStay}
          onRegisterStay={stays.registerStay}
          onAddAlternative={overlays.openAltAdd}
          onSwapped={(altId, message) => {
            setOpenId(altId);
            overlays.showToast(message);
          }}
          onMemo={overlays.openMemo}
          onExpense={overlays.openExpense}
          onToast={overlays.showToast}
          vouchers={voucherSlot(tripId, vouchers, overlays.showToast)}
        />
      )}

      <ScheduleVoucherOverlays tripId={tripId} vouchers={vouchers} onToast={overlays.showToast} />

      {trip && isDesktop !== null && (
        <DetailOverlays
          tripId={tripId}
          startDate={trip.start_date}
          totalDays={totalDays}
          isDesktop={isDesktop}
          overlays={overlays}
        />
      )}
    </>
  );
}
