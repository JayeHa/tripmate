"use client";

import { useEffect, useState } from "react";

import { itemName, type Place, type ScheduleItem } from "@/entities/schedule-item";
import type { SearchCity } from "@/shared/lib/google-places";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

import { usePlaceEditForm } from "../model/use-place-edit-form";
import { usePlaceForm } from "../model/use-place-form";
import { PlaceFormLayout } from "./place-form-layout";

/** 일정 직접 추가 — ① 위치 선택 → ② 장소 정보, 「day N에 담기」로 그날 끝에 담는다 */
type AddMode = {
  kind: "add";
  dayIndex: number;
  /** 위치 검색칸의 처음 값(일정 추가 화면의 검색어) */
  initialQuery: string;
  /** 있으면 그날 끝이 아니라 이 일정의 대체 장소로 담는다(일정 상세의 대체 장소 「+ 직접 추가」) */
  alternativeOf?: ScheduleItem | null;
  /** 담기에 성공하면 부른다(폼은 부른 쪽이 닫는다) */
  onSaved: () => void;
};

/** 장소 정보 수정 — ② 부터 열고(단계 표시 없음) 「저장」 */
type EditMode = {
  kind: "edit";
  place: Place;
  /** 저장했거나 바뀐 칸이 없어 끝나면 부른다(폼은 부른 쪽이 닫는다). changed 는 실제로 고쳤는지 */
  onSaved: (changed: boolean) => void;
};

type PlaceFormDialogProps = {
  tripId: string;
  /** 검색 범위 · 처음 지도 중심 · 현지어 주소 · 「도쿄 장소」 안내의 도시. 없으면 제한 없이 찾고 고르기 전엔 지도가 없다 */
  city: (SearchCity & { name: string }) | null;
  mode: AddMode | EditMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * 장소 입력 폼 — 일정 직접 추가 · 장소 정보 수정. 1024px 아래는 전체 화면, 이상은 가운데 560×760 모달.
 * 이번 일정(상태 · 시간 · 메모)은 받지 않는다 — 일정 상세의 「이번 일정 · 수정」 에서 고친다.
 * 가이드 모드(장소만 저장)는 홈 가이드(#17)에서 붙인다.
 */
export function PlaceFormDialog({ open, onOpenChange, mode, ...rest }: PlaceFormDialogProps) {
  // 저장 중에는 Esc · 바깥 클릭 · 뒤로로 닫히지 않는다 — 닫힌 뒤 늦게 끝난 저장이 다른 창 · 날짜를 건드리지 않게.
  // 잠금 여부는 본문의 폼 훅이 알아서 본문이 알려 준다
  const [locked, setLocked] = useState(false);
  const body = { ...rest, onClose: () => onOpenChange(false), onLockChange: setLocked };
  return (
    <Dialog open={open} onOpenChange={(next) => (next || !locked) && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(760px,calc(100dvh-2rem))] lg:w-140 lg:max-w-140 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {open && mode.kind === "add" && <AddBody {...body} mode={mode} />}
        {open && mode.kind === "edit" && <EditBody {...body} mode={mode} />}
      </DialogContent>
    </Dialog>
  );
}

type BodyProps<M> = Omit<PlaceFormDialogProps, "open" | "onOpenChange" | "mode"> & {
  mode: M;
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
};

/** 일정 직접 추가. 뒤로는 ② → ①, ① 에서는 닫기 */
function AddBody({ tripId, city, mode, onClose, onLockChange }: BodyProps<AddMode>) {
  const form = usePlaceForm({
    tripId,
    city,
    dayIndex: mode.dayIndex,
    initialQuery: mode.initialQuery,
    alternativeOf: mode.alternativeOf ?? null,
    onSaved: mode.onSaved,
  });
  useEffect(() => onLockChange(form.locked), [form.locked, onLockChange]);
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
          <>
            <Button
              size="lg"
              className="h-13 w-full text-base font-bold"
              disabled={form.saving}
              onClick={form.attachExisting}
            >
              {copy.attach}
            </Button>
            <button
              type="button"
              onClick={form.registerNew}
              disabled={form.saving}
              className="h-9 text-sm font-semibold text-ink-500 disabled:opacity-40"
            >
              새로 등록할래요
            </button>
          </>
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

/**
 * 장소 정보 수정. 뒤로는 ①(위치 변경 중)이면 위치 변경을 취소하고 ② 로, ② 면 닫기 — 위치 변경은 ② 안의 한 칸이라
 * 고친 칸을 잃지 않게 한다. 옮긴 위치는 「이 위치로 선택」 으로만 반영된다(주소를 다 불러온 뒤)
 */
function EditBody({ tripId, city, mode, onClose, onLockChange }: BodyProps<EditMode>) {
  const form = usePlaceEditForm({ tripId, city, place: mode.place, onSaved: mode.onSaved });
  useEffect(() => onLockChange(form.locked), [form.locked, onLockChange]);
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
