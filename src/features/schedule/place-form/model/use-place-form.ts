"use client";

import { useRef } from "react";

import {
  addPlaceErrorMessage,
  type ScheduleItem,
  useAddAlternative,
  useAddPlacesToSchedule,
  useCreatePlaceSchedule,
} from "@/entities/schedule-item";
import type { SearchCity } from "@/shared/lib/google-places";

import { blankPlaceForm, toNewPlace, withoutGooglePick } from "../lib/place-form";
import { usePlaceFields } from "./use-place-fields";

type PlaceFormOptions = {
  tripId: string;
  dayIndex: number;
  /** 검색 범위 · 처음 지도 중심 · 현지어 주소 언어를 정하는 도시. 없으면 제한 없이 찾고, 위치를 고르기 전엔 지도도 없다 */
  city: SearchCity | null;
  /** 위치 검색칸의 처음 값(일정 추가 화면의 검색어) */
  initialQuery: string;
  /** 있으면 그날 끝이 아니라 이 일정의 대체 장소로 담는다(일정 상세의 「+ 직접 추가」) */
  alternativeOf: ScheduleItem | null;
  /** 담기에 성공하면 부른다 */
  onSaved: () => void;
};

/**
 * 장소 입력 폼(일정 모드)의 상태와 동작. 열릴 때마다 새로 마운트돼 처음 값에서 시작한다.
 * 칸과 위치 고르기는 usePlaceFields. 여기서는 고른 곳이 이미 있는 장소면 그것을 담거나(새로 등록할 수도 있다),
 * ② 에서 「day N에 담기」로 새 장소를 만들어 그날 끝에 담는다. `alternativeOf` 가 있으면 둘 다 그 일정의 대체 장소로 담는다
 */
export function usePlaceForm({
  tripId,
  dayIndex,
  city,
  initialQuery,
  alternativeOf,
  onSaved,
}: PlaceFormOptions) {
  // 위치는 비운 채 시작한다 — 고르거나 지도를 끌어야 정해진다. 지도는 그동안 도시 중심을 보인다(mapCenter)
  const fields = usePlaceFields({
    tripId,
    city,
    initialValues: blankPlaceForm(null),
    initialStep: "location",
    initialQuery,
    stored: null,
    findExisting: true,
  });
  const { values, same, setValues, setError } = fields;
  const create = useCreatePlaceSchedule(tripId);
  const attach = useAddPlacesToSchedule(tripId);
  const attachAlt = useAddAlternative(tripId);
  const savingRef = useRef(false);

  /** 이미 있는 장소를 그대로 그날 끝에(또는 대체 장소로) 담는다(새 장소를 만들지 않는다) */
  function attachExisting() {
    if (!same.existing || savingRef.current) return;
    savingRef.current = true;
    const placeId = same.existing.id;
    const done = alternativeOf
      ? attachAlt.mutateAsync({ main: alternativeOf, placeId })
      : attach.mutateAsync({ dayIndex, entries: [{ place_id: placeId }] });
    void done
      .then(onSaved, () => undefined)
      .finally(() => {
        savingRef.current = false;
      });
  }

  /** 이미 있는 장소 대신 새로 등록 — 구글 장소 연결을 끊고 ① 에 머문다(「이 위치로 선택」 → ②). 앞선 담기 실패 문구는 지운다 */
  function registerNew() {
    attach.reset();
    attachAlt.reset();
    same.clear();
    setValues(withoutGooglePick);
  }

  /** 검증을 통과하면 장소를 만들어(이미 가진 구글 장소면 그것) 그날 끝에 담는다. 담는 동안 다시 누르지 못한다 */
  function save() {
    if (savingRef.current) return;
    const result = toNewPlace(values, fields.found);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    savingRef.current = true;
    // mutate 의 호출 단위 콜백은 저장 중에 창이 닫혀(언마운트) 버리면 실행되지 않는다 — 오프라인으로 멈춘 동안은 닫을 수 있다.
    // mutateAsync 의 Promise 는 언마운트와 관계없이 끝나므로 여기서 완료를 알린다. 실패 문구는 create.error 가 보인다
    void create
      .mutateAsync({
        dayIndex,
        place: result.value,
        emoji: values.emoji.trim() || null,
        alternativeOf: alternativeOf?.id ?? null,
      })
      .then(onSaved, () => undefined)
      .finally(() => {
        savingRef.current = false;
      });
  }

  return {
    ...fields,
    existing: same.existing,
    attachExisting,
    registerNew,
    save,
    saving: [create, attach, attachAlt].some((m) => m.isPending),
    /** 저장 요청이 서버에 가 있는 동안은 창을 닫지 못한다. 오프라인으로 멈춘(paused) 동안은 닫을 수 있다 */
    locked: [create, attach, attachAlt].some((m) => m.isPending && !m.isPaused),
    error: fields.error ?? errorOf(create.error ?? attach.error ?? attachAlt.error),
  };
}

/** 담기 실패 문구. 오류가 없으면 null */
function errorOf(e: unknown): string | null {
  return e ? addPlaceErrorMessage(e) : null;
}
