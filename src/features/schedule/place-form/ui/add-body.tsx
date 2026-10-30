"use client";

import { itemName } from "@/entities/schedule-item";
import { useReportLock } from "@/shared/lib/use-dialog-state";

import { usePlaceForm } from "../model/use-place-form";
import { ExistingFooter } from "./existing-footer";
import { PlaceFormLayout } from "./place-form-layout";
import type { AddMode, BodyProps } from "./place-form-modes";

/** 일정 직접 추가. 뒤로는 ② → ①, ① 에서는 닫기 */
export function AddBody({ tripId, city, mode, onClose, onLockChange }: BodyProps<AddMode>) {
  const form = usePlaceForm({
    tripId,
    city,
    dayIndex: mode.dayIndex,
    initialQuery: mode.initialQuery,
    alternativeOf: mode.alternativeOf ?? null,
    onSaved: mode.onSaved,
  });
  useReportLock(form.locked, onLockChange);
  const onInfo = form.step === "info";
  const copy = addCopy(mode);
  return (
    <PlaceFormLayout
      form={form}
      cityName={city?.name ?? null}
      title={copy.title}
      subtitle={`${onInfo ? "2/2 · 장소 정보" : "1/2 · 위치 선택"} · ${copy.target}`}
      back={
        onInfo
          ? { label: "위치 선택으로", onClick: form.changeLocation }
          : { label: "닫기", onClick: onClose }
      }
      saveLabel={copy.save}
      locationFooter={
        form.existing ? (
          <ExistingFooter
            attachLabel={copy.attach}
            saving={form.saving}
            onAttach={form.attachExisting}
            onRegisterNew={form.registerNew}
          />
        ) : null
      }
    />
  );
}

/** 담는 곳에 따른 문구 — 그날 끝(일정 직접 추가) · 일정의 대체 장소 */
function addCopy(mode: AddMode) {
  if (mode.alternativeOf) {
    return {
      title: "대체 장소 추가",
      target: `${itemName(mode.alternativeOf)}의 대체 장소`,
      save: "대체 장소로 담기",
      attach: "이 장소를 대체 장소로 담기",
    };
  }
  const day = `day ${mode.dayIndex + 1}`;
  return {
    title: "일정 직접 추가",
    target: `${day}에 담겨요`,
    save: `${day}에 담기`,
    attach: `이 장소로 ${day}에 담기`,
  };
}
