"use client";

import { Star, X } from "lucide-react";
import type { ReactNode } from "react";

import type { Voucher, VoucherTargetRef } from "@/entities/voucher";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { MoreSection } from "@/shared/ui/more-section";

import { PAGES_MAX, pagesInput, TITLE_MAX } from "../lib/voucher-form";
import { useOwnerOptions } from "../model/use-owner-options";
import { useVoucherForm, type VoucherFormState } from "../model/use-voucher-form";
import { FileDrop } from "./file-drop";
import { FormField } from "./form-field";
import { MoreFields } from "./more-fields";
import { OwnerChips } from "./owner-chips";

/** 「연결된 일정」 칸을 그리는 함수 — 일정 · 항공편 · 숙소 고르기는 체크리스트와 같은 것을 화면(view)이 넣는다 */
export type RenderVoucherTarget = (
  value: VoucherTargetRef | null,
  onChange: (target: VoucherTargetRef | null) => void,
) => ReactNode;

type VoucherFormPanelProps = {
  tripId: string;
  /** 고치는 바우처(연 때의 것). 새로 넣으면 null */
  voucher: Voucher | null;
  onClose: () => void;
  onToast: (text: string) => void;
  /** 저장 중 — 창이 닫히지 않게 */
  onLockChange: (locked: boolean) => void;
  renderTarget: RenderVoucherTarget;
};

/**
 * 바우처 추가 · 수정 창의 내용 — 머리(제목 18/800 · ✕), 칸들(원본 · PDF 현장용 페이지 · 제목 · 누구 거 · 연결 · 추가 정보),
 * 아래 「저장」(48 · r8 · 16/700). 저장은 그림을 만드느라 몇 초 걸릴 수 있어 그동안 「저장 중」 으로 막는다
 */
export function VoucherFormPanel({
  tripId,
  voucher,
  onClose,
  onToast,
  onLockChange,
  renderTarget,
}: VoucherFormPanelProps) {
  const form = useVoucherForm({ tripId, voucher, onClose, onToast });
  const members = useOwnerOptions(tripId);
  useReportLock(form.locked, onLockChange);
  return (
    <>
      <div className="flex h-14 shrink-0 items-center px-5">
        <DialogTitle className="flex-1 text-lg font-extrabold text-ink-900">
          {form.editing ? "바우처 수정" : "바우처 추가"}
        </DialogTitle>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          disabled={form.locked}
          className="flex text-ink-900 disabled:opacity-40"
        >
          <X className="size-5.5" strokeWidth={2} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
        <div className="flex flex-col gap-3.5">
          <FileDrop tripId={tripId} voucher={voucher} file={form.file} onPick={form.pick} />
          {form.file.mime === "application/pdf" && <PagesRow form={form} />}
          <Input
            value={form.values.title}
            onChange={(e) => form.set("title", e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="제목 (예: 치이카와 파크 입장권)"
            aria-label="제목"
            className="font-bold"
          />
          {members && (
            <FormField label="누구 거">
              <OwnerChips
                members={members}
                value={form.values.owners}
                onChange={(owners) => form.set("owners", owners)}
              />
            </FormField>
          )}
          <FormField label="연결된 일정">
            {renderTarget(form.values.target, (target) => form.set("target", target))}
          </FormField>
          <MoreSection
            title="추가 정보 입력"
            hint="사용일 · 번호 · 링크 · 메모"
            open={form.moreOpen}
            onOpenChange={form.setMoreOpen}
          >
            <MoreFields form={form} members={members} />
          </MoreSection>
          {form.error && (
            <p role="alert" className="text-[13px] text-destructive">
              {form.error}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 border-t border-surface-muted px-5 pt-3 pb-[calc(1.625rem+env(safe-area-inset-bottom))]">
        <Button
          size="cta"
          className="h-12 w-full"
          disabled={!form.canSave || form.pending}
          onClick={form.submit}
        >
          {saveLabel(form)}
        </Button>
      </div>
    </>
  );
}

/** 저장 버튼 글 — 파일을 올리는 중 · 저장 중이면 그 상태 */
function saveLabel(form: VoucherFormState): string {
  if (form.file.uploading) return "파일 올리는 중…";
  if (form.pending) return "저장 중…";
  return "저장";
}

type PagesRowProps = { form: VoucherFormState };

/** PDF 현장용 페이지 — ★ 「현장용 페이지」(블루) · 입력 96 × 34 · 회색 안내 */
function PagesRow({ form }: PagesRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Star className="size-3.5 text-primary-pressed" strokeWidth={2.4} aria-hidden="true" />
      <span className="text-[13px] font-bold text-primary-pressed">현장용 페이지</span>
      <input
        value={form.values.pages}
        onChange={(e) => form.set("pages", pagesInput(e.target.value))}
        maxLength={PAGES_MAX}
        inputMode="numeric"
        placeholder="1"
        aria-label="현장용 페이지"
        className="h-8.5 w-24 rounded-button border border-input bg-white px-2.5 text-sm text-ink-900 outline-none focus-visible:border-primary"
      />
      <span className="text-xs text-ink-400">예: 1, 3 · 열면 이 페이지부터 보여요</span>
    </div>
  );
}
