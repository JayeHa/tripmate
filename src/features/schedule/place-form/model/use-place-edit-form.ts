"use client";

import { useRef, useState } from "react";

import { type Place, useUpdatePlace } from "@/entities/schedule-item";
import type { SearchCity } from "@/shared/lib/google-places";

import {
  placeEditErrorMessage,
  placeFormOf,
  storedAddressOf,
  toPlacePatch,
} from "../lib/place-edit";
import { usePlaceFields } from "./use-place-fields";

type PlaceEditFormOptions = {
  tripId: string;
  place: Place;
  /** 장소의 도시 — 위치를 바꿀 때 검색 범위 · 현지어 주소 언어. 모르면 null */
  city: SearchCity | null;
  /** 저장했거나 바뀐 칸이 없어 닫으면 부른다. changed 는 실제로 고쳤는지(토스트) */
  onSaved: (changed: boolean) => void;
};

/**
 * 「장소 정보 수정」 — 저장된 장소를 ② 장소 정보부터 열고(위치 변경으로 ① 에 갈 수 있다) 고친 칸만 저장한다.
 * 이 장소를 쓰는 모든 일정에 반영된다. 만든 사람만 고칠 수 있다(RLS — 부른 쪽은 만든 사람에게만 버튼을 보인다).
 * 위치를 옮기지 않으면 저장된 주소를 그대로 쓰고 다시 불러오지 않는다
 */
export function usePlaceEditForm({ tripId, place, city, onSaved }: PlaceEditFormOptions) {
  // 연 때의 값 — 저장은 이것과 달라진 칸만 보낸다. 열린 동안 다른 화면이 장소를 바꿔도 처음 값을 기준으로 한다
  const [opened] = useState(() => {
    const values = placeFormOf(place);
    return { values, stored: { at: values.at, found: storedAddressOf(place) } };
  });
  const fields = usePlaceFields({
    tripId,
    city,
    initialValues: opened.values,
    initialStep: "info",
    initialQuery: "",
    stored: opened.stored,
    findExisting: false,
  });
  const update = useUpdatePlace(tripId);
  const savingRef = useRef(false);

  /** 검증해 바뀐 칸만 저장한다. 바뀐 칸이 없으면 저장하지 않고 닫는다 */
  function save() {
    if (savingRef.current) return;
    const result = toPlacePatch(fields.values, fields.found, opened.values, opened.stored.found);
    if (!result.ok) {
      fields.setError(result.error);
      return;
    }
    fields.setError(null);
    if (Object.keys(result.patch).length === 0) {
      onSaved(false);
      return;
    }
    savingRef.current = true;
    // 저장 중 오프라인으로 멈춰 창을 닫아도(언마운트) 완료를 알리도록 mutateAsync 의 Promise 로 받는다
    void update
      .mutateAsync({ id: place.id, patch: result.patch })
      .then(
        () => onSaved(true),
        () => undefined,
      )
      .finally(() => {
        savingRef.current = false;
      });
  }

  return {
    ...fields,
    // 수정은 이미 있는 장소를 묻지 않는다(findExisting: false)
    existing: null,
    save,
    saving: update.isPending,
    /** 저장 요청이 서버에 가 있는 동안은 창을 닫지 못한다. 오프라인으로 멈춘(paused) 동안은 닫을 수 있다 */
    locked: update.isPending && !update.isPaused,
    error: fields.error ?? (update.error ? placeEditErrorMessage(update.error) : null),
  };
}
