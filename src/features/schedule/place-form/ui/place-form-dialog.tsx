"use client";

import { useState } from "react";

import { useReportLock } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { useLocationPick } from "../model/use-location-pick";
import { usePlaceEditForm } from "../model/use-place-edit-form";
import { AddBody } from "./add-body";
import { GuideBody } from "./guide-body";
import { PlaceFormLayout } from "./place-form-layout";
import type {
  AddMode,
  BodyProps,
  EditMode,
  FormCity,
  GuideMode,
  LocationMode,
} from "./place-form-modes";

type PlaceFormDialogProps = {
  tripId: string;
  city: FormCity;
  mode: AddMode | EditMode | GuideMode | LocationMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * 장소 입력 폼 — 일정 직접 추가 · 장소 정보 수정 · 가이드 장소 추가 · 위치만 고르기(숙소 주소). 1024px 아래는 전체 화면, 이상은 가운데 560×760 모달.
 * 이번 일정(상태 · 시간 · 메모)은 받지 않는다 — 일정 상세의 「이번 일정 · 수정」 에서 고친다.
 */
export function PlaceFormDialog({ open, onOpenChange, mode, ...rest }: PlaceFormDialogProps) {
  // 저장 중에는 Esc · 바깥 클릭 · 뒤로로 닫히지 않는다 — 닫힌 뒤 늦게 끝난 저장이 다른 창 · 날짜를 건드리지 않게.
  // 잠금 여부는 본문의 폼 훅이 알아서 본문이 알려 준다
  const [locked, setLocked] = useState(false);
  const body = { ...rest, onClose: () => onOpenChange(false), onLockChange: setLocked };
  return (
    <Dialog open={open} locked={locked} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(760px,calc(100dvh-2rem))] lg:w-140 lg:max-w-140 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {open && mode.kind === "add" && <AddBody {...body} mode={mode} />}
        {open && mode.kind === "edit" && <EditBody {...body} mode={mode} />}
        {open && mode.kind === "guide" && <GuideBody {...body} mode={mode} />}
        {open && mode.kind === "location" && <LocationBody {...body} mode={mode} />}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 장소 정보 수정. 뒤로는 ①(위치 변경 중)이면 위치 변경을 취소하고 ② 로, ② 면 닫기 — 위치 변경은 ② 안의 한 칸이라
 * 고친 칸을 잃지 않게 한다. 옮긴 위치는 「이 위치로 선택」 으로만 반영된다(주소를 다 불러온 뒤)
 */
function EditBody({ tripId, city, mode, onClose, onLockChange }: BodyProps<EditMode>) {
  const form = usePlaceEditForm({ tripId, city, place: mode.place, onSaved: mode.onSaved });
  useReportLock(form.locked, onLockChange);
  const onInfo = form.step === "info";
  return (
    <PlaceFormLayout
      form={form}
      cityName={city?.name ?? null}
      title="장소 정보 수정"
      subtitle={onInfo ? null : "위치 변경"}
      back={
        onInfo
          ? { label: "닫기", onClick: onClose }
          : { label: "위치 변경 취소", onClick: form.cancelLocation }
      }
      saveLabel="저장"
      editing
      locationFooter={null}
    />
  );
}

/** 위치만 고르기. 뒤로는 닫기, 「이 위치로 선택」 이 곧 완료 */
function LocationBody({ tripId, city, mode, onClose }: BodyProps<LocationMode>) {
  const form = useLocationPick({ tripId, city, initial: mode.initial, onPicked: mode.onPicked });
  return (
    <PlaceFormLayout
      form={form}
      cityName={city?.name ?? null}
      title={mode.title}
      subtitle={null}
      back={{ label: "닫기", onClick: onClose }}
      saveLabel=""
      locationFooter={null}
    />
  );
}
