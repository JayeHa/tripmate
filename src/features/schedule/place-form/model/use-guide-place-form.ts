"use client";

import { useRef } from "react";

import {
  addPlaceErrorMessage,
  type PlaceCategory,
  useAddGuidePlace,
  useSaveGuidePlace,
} from "@/entities/schedule-item";
import { saveErrorText } from "@/shared/api/sync";
import type { SearchCity } from "@/shared/lib/google-places";

import { blankGuideForm, toNewPlace, withoutGooglePick } from "../lib/place-form";
import { usePlaceFields } from "./use-place-fields";

/** 가이드에 저장한 결과 — added 는 보관함에 새로 넣었는지(이미 있던 장소면 false), category 는 그 장소의 카테고리 */
export type GuideSaved = { added: boolean; category: string | null };

type GuidePlaceFormOptions = {
  tripId: string;
  city: SearchCity | null;
  /** 처음 카테고리(지금 탭) */
  category: PlaceCategory | null;
  onSaved: (saved: GuideSaved) => void;
};

/**
 * 장소 입력 폼(가이드 모드)의 상태와 동작 — 일정 모드(usePlaceForm)와 같은 칸 · 같은 흐름이고, 담는 곳만 이 여행 보관함이다.
 * 고른 곳이 이미 있는 장소면 그것을 보관함에 넣거나(새로 등록할 수도 있다), ② 의 「장소 저장」 으로 새 장소를 만들어 넣는다.
 * 일정은 만들지 않는다 — 카드의 「+ 일정」 으로 넣는다
 */
export function useGuidePlaceForm({ tripId, city, category, onSaved }: GuidePlaceFormOptions) {
  const fields = usePlaceFields({
    tripId,
    city,
    initialValues: blankGuideForm(category),
    initialStep: "location",
    initialQuery: "",
    stored: null,
    findExisting: true,
  });
  const { values, same, setValues, setError } = fields;
  const save = useSaveGuidePlace(tripId);
  const attach = useAddGuidePlace(tripId);
  const savingRef = useRef(false);

  /** 이미 있는 장소를 보관함에 넣는다(새 장소를 만들지 않는다) */
  function attachExisting() {
    if (!same.existing || savingRef.current) return;
    savingRef.current = true;
    const place = same.existing;
    void attach
      .mutateAsync(place.id)
      .then(
        (added) => onSaved({ added, category: place.category }),
        () => undefined,
      )
      .finally(() => {
        savingRef.current = false;
      });
  }

  /** 이미 있는 장소 대신 새로 등록 — 구글 장소 연결을 끊고 ① 에 머문다. 앞선 실패 문구는 지운다 */
  function registerNew() {
    attach.reset();
    same.clear();
    setValues(withoutGooglePick);
  }

  /**
   * 검증을 통과하면 장소를 만들어(이미 가진 구글 장소면 그것) 보관함에 넣는다. 저장하는 동안 다시 누르지 못한다.
   * 완료는 mutateAsync 로 알린다 — 오프라인으로 멈춘 동안 창을 닫아도 끝나면 토스트가 뜨게(usePlaceForm 과 같다)
   */
  function saveGuide() {
    if (savingRef.current) return;
    const result = toNewPlace(values, fields.found);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    savingRef.current = true;
    void save
      .mutateAsync({ place: result.value, emoji: values.emoji.trim() || null })
      .then(
        () => onSaved({ added: true, category: result.value.category }),
        () => undefined,
      )
      .finally(() => {
        savingRef.current = false;
      });
  }

  return {
    ...fields,
    existing: same.existing,
    attachExisting,
    registerNew,
    save: saveGuide,
    saving: save.isPending || attach.isPending,
    /** 저장 요청이 서버에 가 있는 동안은 창을 닫지 못한다. 오프라인으로 멈춘(paused) 동안은 닫을 수 있다 */
    locked: [save, attach].some((m) => m.isPending && !m.isPaused),
    error: fields.error ?? errorOf(save.error ?? attach.error),
  };
}

/**
 * 저장 실패 문구. 오류가 없으면 null. 일정 담기 문구 중 이름 · 도시 문구만 그대로 쓰고,
 * 나머지(권한 · 알 수 없는 오류)는 「일정」 이 아니라 보관함 문구로 바꾼다
 */
function errorOf(e: unknown): string | null {
  if (!e) return null;
  const text = addPlaceErrorMessage(e);
  if (text.startsWith("장소 이름") || text.startsWith("여행에 도시가")) return text;
  return saveErrorText(e, "장소를 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
}
