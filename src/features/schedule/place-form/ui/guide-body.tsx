"use client";

import { useReportLock } from "@/shared/lib/use-dialog-state";

import { useGuidePlaceForm } from "../model/use-guide-place-form";
import { ExistingFooter } from "./existing-footer";
import { PlaceFormLayout } from "./place-form-layout";
import type { BodyProps, GuideMode } from "./place-form-modes";

/** 가이드 장소 추가. 뒤로는 ② → ①, ① 에서는 닫기. 일정 직접 추가와 같은 화면이고 담는 곳만 보관함이다 */
export function GuideBody({ tripId, city, mode, onClose, onLockChange }: BodyProps<GuideMode>) {
  const form = useGuidePlaceForm({
    tripId,
    city,
    category: mode.category,
    onSaved: mode.onSaved,
  });
  useReportLock(form.locked, onLockChange);
  const onInfo = form.step === "info";
  return (
    <PlaceFormLayout
      form={form}
      cityName={city?.name ?? null}
      title="장소 추가"
      subtitle={`${onInfo ? "2/2 · 장소 정보" : "1/2 · 위치 선택"} · 이 여행 보관함에 담겨요`}
      back={
        onInfo
          ? { label: "위치 선택으로", onClick: form.changeLocation }
          : { label: "닫기", onClick: onClose }
      }
      saveLabel="장소 저장"
      addNote="이 여행 보관함에 저장돼요. 일정에는 카드의 「+ 일정」 으로 넣어요."
      locationFooter={
        form.existing ? (
          <ExistingFooter
            attachLabel="이 장소를 보관함에 담기"
            saving={form.saving}
            onAttach={form.attachExisting}
            onRegisterNew={form.registerNew}
          />
        ) : null
      }
    />
  );
}
