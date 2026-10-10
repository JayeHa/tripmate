"use client";

import { useRef, useState } from "react";

import { pushedOutCount, type Stay, type StaySaveResult, useSaveStay } from "@/entities/stay";
import type { PickedLocation } from "@/shared/lib/google-places";

import {
  blankStayForm,
  datesChanged,
  nameAfterPick,
  stayFormForRegistration,
  stayFormFrom,
  type StayFormValues,
  type StayRegistration,
  toStayPayload,
} from "../lib/stay-form";

/** 위치 고르기 요청 — 받는 쪽(화면)이 장소 입력 폼의 「위치만 고르기」 를 띄운다 */
export type LocationPickRequest = {
  initial: PickedLocation | null;
  onPicked: (location: PickedLocation) => void;
};

type StayFormOptions = {
  tripId: string;
  trip: { start_date: string; end_date: string };
  /** 고치는 숙소. 새로 만들면 null */
  stay: Stay | null;
  /** 「숙소로 등록」 — 새 숙소를 그 일정으로 채워 열고, 저장하면 그 카드를 연결한다. 고칠 때는 null */
  registration?: StayRegistration | null;
  /** 밀려나는 카드를 세는 데 쓰는 일정 줄 */
  items: readonly { stay_id: string | null; alternative_of: string | null; day_index: number }[];
  onPickLocation: (req: LocationPickRequest) => void;
  /** 저장이 끝났다(폼은 부른 쪽이 닫는다) */
  onSaved: (result: StaySaveResult) => void;
};

/**
 * 숙소 입력 폼의 상태 — 값 · 위치 고르기 · 숙박 날짜 시트 · 저장.
 * 숙박 기간이 줄어 연결 카드가 밀려나면 저장 전에 「지울까요?」 를 묻고(pending), 「남기기 / 지우기」 로 저장한다.
 * 개수는 화면의 일정 캐시로 세고 서버가 잠근 뒤 다시 계산한다(save_stay)
 */
export function useStayForm({
  tripId,
  trip,
  stay,
  registration = null,
  items,
  onPickLocation,
  onSaved,
}: StayFormOptions) {
  const [values, setValues] = useState<StayFormValues>(() => initialValues(stay, registration));
  const [datesOpen, setDatesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 밀려나는 연결 카드 수 — 확인창을 띄우는 동안
  const [pending, setPending] = useState<number | null>(null);
  const save = useSaveStay(tripId);
  const savingRef = useRef(false);

  /** 칸 하나를 고친다 */
  function set<K extends keyof StayFormValues>(key: K, value: StayFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** 주소 칸 — 장소 입력 폼의 위치 고르기를 연다. 고르면 위치와(손대지 않은) 이름을 채운다 */
  function pickLocation() {
    onPickLocation({
      initial: values.location,
      onPicked: (location) =>
        setValues((v) => ({ ...v, location, name: nameAfterPick(v, location) })),
    });
  }

  /** 저장 — prune 이면 밀려난 카드를 지운다 */
  function commit(prune: boolean) {
    const payload = toStayPayload(values);
    if (!payload.ok || savingRef.current) return;
    savingRef.current = true;
    setError(null);
    // mutateAsync — 저장 중 창이 닫혀(언마운트) 버려도 완료를 알린다
    void save
      .mutateAsync({
        stayId: stay?.id ?? null,
        place: payload.place,
        fields: payload.fields,
        prune,
        linkItemId: stay ? null : (registration?.itemId ?? null),
      })
      .then(onSaved, () => undefined)
      .finally(() => {
        savingRef.current = false;
      });
  }

  /** 「완료」 — 검증하고, 기간이 줄어 밀려나는 카드가 있으면 먼저 묻는다 */
  function submit() {
    const payload = toStayPayload(values);
    if (!payload.ok) {
      setError(payload.error);
      return;
    }
    const pushed =
      stay && datesChanged(values, stay) && values.checkIn && values.checkOut
        ? pushedOutCount(
            items,
            stay.id,
            stay,
            { check_in_date: values.checkIn, check_out_date: values.checkOut },
            trip,
          )
        : 0;
    if (pushed > 0) setPending(pushed);
    else commit(false);
  }

  return {
    values,
    set,
    editing: stay !== null,
    pickLocation,
    datesOpen,
    openDates: () => setDatesOpen(true),
    closeDates: () => setDatesOpen(false),
    /** 숙박 날짜 시트의 「완료」 */
    applyDates: (checkIn: string, checkOut: string) => {
      setValues((v) => ({ ...v, checkIn, checkOut }));
      setDatesOpen(false);
    },
    submit,
    pending,
    /** 확인창 — 남기기(false) · 지우기(true) · 취소(null) */
    resolvePending: (prune: boolean | null) => {
      setPending(null);
      if (prune !== null) commit(prune);
    },
    error: error ?? save.error?.message ?? null,
    saving: save.isPending,
    // 요청이 서버에 가 있는 동안은 닫지 못한다. 오프라인으로 멈춘 동안은 연다
    locked: save.isPending && !save.isPaused,
  };
}

export type StayFormState = ReturnType<typeof useStayForm>;

/** 첫 폼 값 — 고치는 숙소 · 「숙소로 등록」 한 일정 · 빈 폼 순 */
function initialValues(stay: Stay | null, registration: StayRegistration | null): StayFormValues {
  if (stay) return stayFormFrom(stay);
  return registration ? stayFormForRegistration(registration) : blankStayForm();
}
