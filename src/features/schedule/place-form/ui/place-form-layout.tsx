import { ArrowLeft } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { DialogTitle } from "@/shared/ui/dialog";

import type { PlaceFormState } from "../model/use-place-fields";
import { InfoStep } from "./info-step";
import { LocationStep } from "./location-step";

type PlaceFormLayoutProps = {
  form: PlaceFormState;
  cityName: string | null;
  title: string;
  /** 제목 밑 작은 줄(단계 · 담길 날). 없으면 제목만 */
  subtitle: string | null;
  back: { label: string; onClick: () => void };
  /** ② 하단 버튼 글자 */
  saveLabel: string;
  /** 장소 정보 수정이면 true(InfoStep 참고) */
  editing?: boolean;
  /** 새로 담을 때 ② 맨 아래 안내(InfoStep 참고) */
  addNote?: string;
  /** ① 하단을 바꿀 때(이미 있는 장소를 쓸지 묻기). null 이면 「이 위치로 선택」 */
  locationFooter: React.ReactNode;
};

/** 장소 입력 폼의 틀 — 위 뒤로 · 제목, 단계별 본문(① 위치 · ② 장소 정보), 아래 오류 문구 · 버튼 */
export function PlaceFormLayout({
  form,
  cityName,
  title,
  subtitle,
  back,
  saveLabel,
  editing = false,
  addNote,
  locationFooter,
}: PlaceFormLayoutProps) {
  const onInfo = form.step === "info";
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="flex h-13 shrink-0 items-center gap-3 border-b border-divider px-4.5">
        <button
          type="button"
          aria-label={back.label}
          onClick={back.onClick}
          disabled={form.locked}
          className="flex text-ink-900 disabled:opacity-40"
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-px">
          <DialogTitle className="text-[17px] font-extrabold text-ink-900">{title}</DialogTitle>
          {subtitle && <span className="text-xs text-ink-400">{subtitle}</span>}
        </div>
        <span className="w-6" />
      </div>
      {onInfo ? (
        <InfoStep form={form} cityName={cityName} editing={editing} addNote={addNote} />
      ) : (
        <LocationStep form={form} />
      )}
      <div className="flex shrink-0 flex-col gap-2 border-t border-divider px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
        {onInfo && (
          <Button
            size="lg"
            className="h-13 w-full text-base font-bold"
            disabled={!form.canSave || form.saving}
            onClick={form.save}
          >
            {saveLabel}
          </Button>
        )}
        {!onInfo && locationFooter}
        {!onInfo && !locationFooter && (
          <Button
            size="lg"
            className="h-13 w-full text-base font-bold"
            disabled={!form.canChooseLocation}
            onClick={form.chooseLocation}
          >
            이 위치로 선택
          </Button>
        )}
      </div>
    </div>
  );
}
