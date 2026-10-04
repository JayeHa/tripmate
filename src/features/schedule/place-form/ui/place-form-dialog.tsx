"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import type { SearchCity } from "@/shared/lib/google-places";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { type PlaceFormState, usePlaceForm } from "../model/use-place-form";
import { InfoStep } from "./info-step";
import { LocationStep } from "./location-step";

type PlaceFormDialogProps = {
  tripId: string;
  dayIndex: number;
  /** 검색 범위 · 처음 지도 중심 · 현지어 주소 · 「도쿄 장소」 안내의 도시. 없으면 제한 없이 찾고 고르기 전엔 지도가 없다 */
  city: (SearchCity & { name: string }) | null;
  /** 위치 검색칸의 처음 값(일정 추가 화면의 검색어) */
  initialQuery: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 담기에 성공하면 부른다(폼은 부른 쪽이 닫는다) */
  onSaved: () => void;
};

/**
 * 장소 입력 폼 — 일정 직접 추가(일정 모드). 1024px 아래는 전체 화면, 이상은 가운데 560×760 모달.
 * ① 위치 선택 → ② 장소 정보 두 단계로 받아 「day N에 담기」로 그날 끝에 담는다. 이번 일정(상태 · 시간 · 메모)은 담은 뒤 일정 상세에서 고친다.
 * 가이드 모드(장소만 저장)와 수정(② 부터, 단계 표시 없음)은 홈 가이드(#17) · 일정 상세(#13 ③)에서 붙인다.
 */
export function PlaceFormDialog({ open, onOpenChange, ...rest }: PlaceFormDialogProps) {
  // 저장 중에는 Esc · 바깥 클릭 · 뒤로로 닫히지 않는다 — 닫힌 뒤 늦게 끝난 저장이 다른 창 · 날짜를 건드리지 않게.
  // 잠금 여부는 본문의 usePlaceForm 이 알아서 본문이 알려 준다
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={open} onOpenChange={(next) => (next || !locked) && onOpenChange(next)}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(760px,calc(100dvh-2rem))] lg:w-140 lg:max-w-140 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {open && (
          <PlaceFormBody {...rest} onClose={() => onOpenChange(false)} onLockChange={setLocked} />
        )}
      </DialogContent>
    </Dialog>
  );
}

type PlaceFormBodyProps = Omit<PlaceFormDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
  onLockChange: (locked: boolean) => void;
};

/** 폼 내용. 상태는 usePlaceForm 이 쥐고, 단계마다 칸 묶음은 그리기만 한다. 뒤로는 ② → ①, ① 에서는 닫기 */
function PlaceFormBody({
  tripId,
  dayIndex,
  city,
  initialQuery,
  onSaved,
  onClose,
  onLockChange,
}: PlaceFormBodyProps) {
  const form = usePlaceForm({ tripId, dayIndex, city, initialQuery, onSaved });
  useEffect(() => onLockChange(form.locked), [form.locked, onLockChange]);
  const dayLabel = `day ${dayIndex + 1}`;
  const onInfo = form.step === "info";
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-divider px-4.5">
        <button
          type="button"
          aria-label={onInfo ? "위치 선택으로" : "닫기"}
          onClick={onInfo ? form.changeLocation : onClose}
          disabled={form.locked}
          className="flex text-ink-900 disabled:opacity-40"
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-px">
          <DialogTitle className="text-[17px] font-extrabold text-ink-900">
            일정 직접 추가
          </DialogTitle>
          <span className="text-xs text-ink-400">
            {onInfo ? "2/2 · 장소 정보" : "1/2 · 위치 선택"} · {dayLabel}에 담겨요
          </span>
        </div>
        <span className="w-6" />
      </div>
      {onInfo ? (
        <InfoStep form={form} cityName={city?.name ?? null} />
      ) : (
        <LocationStep form={form} />
      )}
      <div className="flex shrink-0 flex-col gap-2 border-t border-divider px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
        {onInfo ? (
          <Button
            size="lg"
            className="h-13 w-full text-base font-bold"
            disabled={!form.canSave || form.saving}
            onClick={form.save}
          >
            {dayLabel}에 담기
          </Button>
        ) : (
          <LocationFooter form={form} dayLabel={dayLabel} />
        )}
      </div>
    </div>
  );
}

type LocationFooterProps = { form: PlaceFormState; dayLabel: string };

/** ① 하단: 보통은 「이 위치로 선택」, 고른 곳이 이미 있는 장소면 「이 장소로 담기」 + 「새로 등록할래요」 */
function LocationFooter({ form, dayLabel }: LocationFooterProps) {
  if (form.existing) {
    return (
      <>
        <Button
          size="lg"
          className="h-13 w-full text-base font-bold"
          disabled={form.saving}
          onClick={form.attachExisting}
        >
          이 장소로 {dayLabel}에 담기
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
    );
  }
  return (
    <Button
      size="lg"
      className="h-13 w-full text-base font-bold"
      disabled={!form.canChooseLocation}
      onClick={form.chooseLocation}
    >
      이 위치로 선택
    </Button>
  );
}
