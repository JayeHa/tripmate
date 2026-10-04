"use client";

import { X } from "lucide-react";

import type { SearchCity } from "@/shared/lib/google-places";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { usePlaceForm } from "../model/use-place-form";
import { PlaceInfoFields } from "./place-info-fields";

type PlaceFormDialogProps = {
  tripId: string;
  dayIndex: number;
  /** 검색 범위 · 처음 핀 위치 · 「도쿄 장소」 안내의 도시. 없으면 제한 없이 찾고 지도를 띄우지 않는다 */
  city: (SearchCity & { name: string }) | null;
  /** 처음 이름(일정 추가 화면의 검색어) */
  initialName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 담기에 성공하면 부른다(폼은 부른 쪽이 닫는다) */
  onSaved: () => void;
};

/**
 * 장소 입력 폼 — 일정 직접 추가(일정 모드). 1024px 아래는 전체 화면, 이상은 가운데 560×760 모달.
 * 장소 정보만 받아 「day N에 담기」로 그날 끝에 담는다. 이번 일정(상태 · 시간 · 메모)은 담은 뒤 일정 상세에서 고친다.
 * 가이드 모드(장소만 저장)와 수정은 홈 가이드(#17) · 일정 상세(#13 ③)에서 붙인다.
 */
export function PlaceFormDialog({ open, onOpenChange, ...rest }: PlaceFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(760px,calc(100dvh-2rem))] lg:w-140 lg:max-w-140 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {open && <PlaceFormBody {...rest} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

type PlaceFormBodyProps = Omit<PlaceFormDialogProps, "open" | "onOpenChange"> & {
  onClose: () => void;
};

/** 폼 내용. 상태는 usePlaceForm 이 쥐고 칸 묶음은 그리기만 한다 */
function PlaceFormBody({
  tripId,
  dayIndex,
  city,
  initialName,
  onSaved,
  onClose,
}: PlaceFormBodyProps) {
  const form = usePlaceForm({ tripId, dayIndex, city, initialName, onSaved });
  const dayLabel = `day ${dayIndex + 1}`;
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex h-13 shrink-0 items-center gap-3 px-4.5">
        <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6" strokeWidth={2} />
        </button>
        <DialogTitle className="flex-1 text-center text-[17px] font-extrabold text-ink-900">
          일정 직접 추가
        </DialogTitle>
        <span className="w-6" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5.5 overflow-y-auto px-5 pt-4.5 pb-6">
        <PlaceInfoFields form={form} cityName={city?.name ?? null} />
      </div>
      <div className="flex shrink-0 flex-col gap-2 border-t border-divider px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
        <Button
          size="lg"
          className="h-13 w-full text-base font-bold"
          disabled={!form.canSave || form.saving}
          onClick={form.save}
        >
          {dayLabel}에 담기
        </Button>
      </div>
    </div>
  );
}
