"use client";

import type { ElementType, ReactNode } from "react";

import {
  CHECKLIST_STATUS_LABEL,
  CHECKLIST_STATUSES,
  type ChecklistItem,
} from "@/entities/checklist";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DateField } from "@/shared/ui/date-field";
import { Input } from "@/shared/ui/input";
import { LinkRows } from "@/shared/ui/link-rows";
import { Textarea } from "@/shared/ui/textarea";

import { BODY_MAX, TITLE_MAX } from "../lib/checklist-form";
import { type ChecklistFormState, useChecklistForm } from "../model/use-checklist-form";
import { DeleteChecklistButton } from "./delete-checklist-button";
import { PanelHeader } from "./panel-header";

type ChecklistEditorProps = {
  tripId: string;
  /** 고치는 항목. 새로 넣으면 null */
  item: ChecklistItem | null;
  /** 새 항목의 처음 제목 */
  title: string;
  onClose: () => void;
  onToast: (text: string) => void;
  /** 저장 · 삭제 중 — 모바일 시트가 닫히지 않게 */
  onLockChange?: (locked: boolean) => void;
  titleAs?: ElementType;
};

/**
 * 체크리스트 추가 · 편집 — 상태 3칸 · 제목 · 마감일 · 메모 · 링크, 아래 (편집이면 휴지통) + 「저장」.
 * 「홈에 고정」 은 여기서는 폼 값이라 저장할 때 함께 저장된다
 */
export function ChecklistEditor({
  tripId,
  item,
  title,
  onClose,
  onToast,
  onLockChange,
  titleAs,
}: ChecklistEditorProps) {
  const form = useChecklistForm({
    tripId,
    item,
    title,
    onClose,
    onToast,
  });
  useReportLock(form.locked, onLockChange);
  return (
    <>
      <PanelHeader
        heading={form.editing ? "체크리스트 편집" : "체크리스트 추가"}
        pinned={form.values.pinned}
        onPin={() => form.set("pinned", !form.values.pinned)}
        onClose={onClose}
        closeDisabled={form.locked}
        titleAs={titleAs}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
        <div className="flex flex-col gap-4">
          <EditorFields form={form} />
          {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 gap-2 border-t border-divider px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {form.editing && <DeleteChecklistButton disabled={form.pending} onConfirm={form.destroy} />}
        <Button
          size="form"
          className="flex-1"
          disabled={!form.canSave || form.pending}
          onClick={form.save}
        >
          저장
        </Button>
      </div>
    </>
  );
}

type EditorFieldsProps = { form: ChecklistFormState };

/** 입력 칸들 */
function EditorFields({ form }: EditorFieldsProps) {
  const { values: v, set } = form;
  return (
    <>
      <div role="radiogroup" aria-label="상태" className="grid grid-cols-3 gap-1.5">
        {CHECKLIST_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={v.status === s}
            onClick={() => set("status", s)}
            className={cn(
              "h-10 rounded-button border text-sm font-bold",
              v.status === s
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-input bg-white text-ink-500",
            )}
          >
            {CHECKLIST_STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      <Field label="제목">
        <Input
          value={v.title}
          onChange={(e) => set("title", e.target.value)}
          maxLength={TITLE_MAX}
          placeholder="예) 모구모구 본포 입장 방식 확인"
          aria-label="제목"
          className="font-bold"
        />
      </Field>
      <Field label="마감일" optional>
        <DateField
          value={v.due}
          onChange={(due) => set("due", due)}
          placeholder="날짜 선택"
          aria-label="마감일"
        />
      </Field>
      <Field label="메모">
        <Textarea
          value={v.body}
          onChange={(e) => set("body", e.target.value)}
          maxLength={BODY_MAX}
          rows={5}
          placeholder="결정 기준, 1지망·2지망, 확인할 곳 등"
          aria-label="메모"
          className="min-h-32 resize-none text-sm/[1.55]"
        />
      </Field>
      <Field label="링크">
        <LinkRows
          label="체크리스트 링크"
          titlePlaceholder="링크 제목"
          links={v.links}
          onChange={(links) => set("links", links)}
        />
      </Field>
    </>
  );
}

type FieldProps = { label: string; optional?: boolean; children: ReactNode };

/** 칸 — 13/700 이름(선택이면 「(선택)」) + 입력 */
function Field({ label, optional = false, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">
        {label}
        {optional && <span className="font-medium text-ink-350"> (선택)</span>}
      </span>
      {children}
    </div>
  );
}
