"use client";

import { useState } from "react";

import { useTripCities } from "@/entities/city";
import type { ScheduleItem } from "@/entities/schedule-item";
import { useStays } from "@/entities/stay";
import type { ExpenseDialogTarget } from "@/features/expense/form";
import type { LocationPickRequest, StayPaymentRequest, StayRegistration } from "@/features/stays";
import { dayIndexToDate } from "@/shared/lib/days";

/**
 * 숙소 창(목록 · 상세 · 입력)과, 그 위에 여는 장소 입력 폼의 「위치만 고르기」 · 결제 비용 입력 창. 화면(TripScheduleView)이 쥐고 StaysOverlay 가 그린다.
 * 위치 고르기의 도시(검색 범위 · 지도 중심)는 여행의 첫 도시. 여행(trip)은 「숙소로 등록」 의 체크인 날짜를 계산하는 데 쓴다 — 아직 못 읽었으면 등록을 열지 않는다
 */
export function useStaysOverlay(tripId: string, trip: { start_date: string } | null | undefined) {
  const [open, setOpen] = useState(false);
  // 열 때 바로 보일 숙소(연결 카드의 「숙소 정보 수정」). 목록부터면 null
  const [initialId, setInitialId] = useState<string | null>(null);
  // 「숙소로 등록」 으로 열 때 새 숙소 폼을 채울 일정. 아니면 null
  const [registration, setRegistration] = useState<StayRegistration | null>(null);
  const [pick, setPick] = useState<LocationPickRequest | null>(null);
  const [payment, setPayment] = useState<ExpenseDialogTarget | null>(null);
  const { data: stays } = useStays(tripId);
  const { data: cities = [] } = useTripCities(tripId);
  return {
    open,
    initialId,
    /** 숙소 목록부터 연다(레일 · 여행 머리 칩) */
    openStays: () => {
      setInitialId(null);
      setRegistration(null);
      setOpen(true);
    },
    /** 그 숙소의 상세부터 연다(일정 상세의 「숙소 정보 수정」) */
    openStay: (id: string) => {
      setInitialId(id);
      setRegistration(null);
      setOpen(true);
    },
    registration,
    /** 「숙소로 등록」 — 그 일정의 장소 · 아이콘 · 날짜(체크인)로 채운 새 숙소 폼부터 연다 */
    registerStay: (item: ScheduleItem) => {
      if (!item.place || !trip) return;
      setInitialId(null);
      setRegistration({
        itemId: item.id,
        place: item.place,
        emoji: item.emoji,
        checkIn: dayIndexToDate(trip.start_date, item.day_index),
      });
      setOpen(true);
    },
    setOpen,
    /** 레일 · 상단바 버튼의 숫자. 아직 못 읽었으면 0 */
    count: stays?.length ?? 0,
    pick,
    requestPick: setPick,
    closePick: () => setPick(null),
    city: cities[0] ?? null,
    payment,
    /** 숙소의 결제 — 붙은 비용이 있으면 그 수정, 없으면 그 숙소의 결제로 새 비용. 새 숙소면 초안 */
    openPayment: (req: StayPaymentRequest) => setPayment(paymentTarget(req)),
    closePayment: () => setPayment(null),
  };
}

export type StaysOverlayState = ReturnType<typeof useStaysOverlay>;

/** 숙소의 결제 요청 → 비용 창 대상 */
function paymentTarget(req: StayPaymentRequest): ExpenseDialogTarget {
  if (req.kind === "draft") return req;
  if (req.expenseId) return { kind: "edit", expenseId: req.expenseId };
  return { kind: "new", stay: { id: req.stayId, name: req.name } };
}
