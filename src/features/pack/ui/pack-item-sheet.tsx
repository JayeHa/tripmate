"use client";

import { Check, Trash2, X } from "lucide-react";
import { useState } from "react";

import { isChecked, type PackBoard, type PackItem, type PackKind } from "@/entities/pack";
import type { MemberBadge } from "@/entities/trip-member";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { FilterSelect } from "@/shared/ui/filter-select";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import { ITEM_MEMO_MAX, ITEM_NAME_MAX, PACK_COPY } from "../lib/copy";
import type { PackItemActions } from "../model/use-pack-item-actions";
import { CheckerAvatar } from "./checker-avatar";

type PackItemSheetProps = {
  kind: PackKind;
  board: PackBoard;
  actions: PackItemActions;
  /** 체크한 사람 — 이미 챙긴 항목이면 그 사람, 이 창에서 새로 챙기면 나 */
  checkerOf: (userId: string | null) => MemberBadge | null;
  me: string | null;
};

/**
 * 항목 상세 — 1024 아래는 아래에서 올라오는 시트(r22 위 모서리 · 최대 88%), 이상은 가운데 540 창.
 * 이름 · 메모 · 그룹 · 챙김을 고쳐 「저장」 으로 한 번에. 휴지통은 확인을 거쳐 지운다.
 * 열 때마다 새로 그리고, 닫히는 동안은 마지막 내용을 그린다
 */
export function PackItemSheet({ kind, board, actions, checkerOf, me }: PackItemSheetProps) {
  const open = actions.detail !== null;
  const item = useHeldWhileClosing(open, actions.detail);
  const opens = useOpenCount(open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && actions.closeDetail()}>
      <DialogContent
        showCloseButton={false}
        className="top-auto bottom-0 left-0 flex max-h-[88dvh] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-h-[86dvh] lg:w-135 lg:max-w-135 lg:-translate-1/2 lg:rounded-sheet lg:shadow-sheet"
      >
        {item && (
          <ItemForm
            key={opens}
            kind={kind}
            item={item}
            board={board}
            actions={actions}
            checkerOf={checkerOf}
            me={me}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type ItemFormProps = Omit<PackItemSheetProps, "actions"> & {
  item: PackItem;
  actions: PackItemActions;
};

/**
 * 시트 안 — 고친 값은 저장할 때까지 이 안에만.
 * 저장은 연 순간의 행(base)과 비교한다. 받은 item 은 실시간으로 바뀌어서, 그걸 기준으로 하면
 * 그사이 일행이 바꾼 칸(체크 · 이름 · 그룹)을 손대지 않았는데도 「바뀐 칸」 으로 보고 되돌린다
 */
function ItemForm({ kind, item, board, actions, checkerOf, me }: ItemFormProps) {
  const copy = PACK_COPY[kind];
  const [base] = useState(item);
  const [name, setName] = useState(base.name);
  const [memo, setMemo] = useState(base.memo);
  const [groupId, setGroupId] = useState(base.group_id);
  const [checked, setChecked] = useState(isChecked(base));
  const checker = checkerOf(isChecked(base) ? base.checked_by : me);
  const groups = board.groups.map((g) => ({ value: g.group.id, label: g.group.name }));
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
        <DialogTitle className="flex-1 text-lg font-extrabold text-ink-900">
          {copy.sheetTitle}
        </DialogTitle>
        <button type="button" aria-label="닫기" onClick={actions.closeDetail} className="flex">
          <X className="size-5.5 text-ink-900" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-3">
        <Field label="이름">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={ITEM_NAME_MAX}
            className="font-bold"
          />
        </Field>
        <Field label={copy.memoLabel}>
          <Textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={ITEM_MEMO_MAX}
            rows={3}
            placeholder={copy.memoPlaceholder}
            className="resize-none text-sm/[1.55]"
          />
        </Field>
        <Field label="그룹">
          <FilterSelect
            label="그룹"
            options={groups}
            value={groupId}
            onChange={setGroupId}
            allLabel={null}
            layout="dropdown"
          />
        </Field>
        <button
          type="button"
          role="checkbox"
          aria-checked={checked}
          onClick={() => setChecked((c) => !c)}
          className="flex h-12 items-center gap-2.5 rounded-memo bg-surface-sunken px-3.5 text-left"
        >
          <span
            className={cn(
              "flex size-5.5 shrink-0 items-center justify-center rounded-pill-sm border-[1.5px]",
              checked ? "border-primary bg-primary" : "border-line-dashed bg-white",
            )}
          >
            {checked && (
              <Check className="size-3.5 text-white" strokeWidth={3} aria-hidden="true" />
            )}
          </span>
          <span className="flex-1 text-[15px] font-semibold text-ink-900">
            {checked ? copy.checkedLabel : copy.uncheckedLabel}
          </span>
          {checked && checker && <CheckerAvatar checker={checker} />}
        </button>
      </div>
      <div className="flex shrink-0 gap-2 border-t border-surface-muted px-5 pt-3 pb-[calc(1.875rem+env(safe-area-inset-bottom))]">
        <button
          type="button"
          aria-label="항목 삭제"
          onClick={() => actions.askDelete(base)}
          className="flex h-11 w-12 shrink-0 items-center justify-center rounded-button bg-destructive-soft"
        >
          <Trash2 className="size-4.5 text-destructive" aria-hidden="true" />
        </button>
        <Button
          size="form"
          className="flex-1"
          disabled={!name.trim()}
          onClick={() => actions.save(base, { name, memo, groupId, checked })}
        >
          저장
        </Button>
      </div>
    </>
  );
}

type FieldProps = { label: string; children: React.ReactNode };

/** 칸 — 라벨 13/700 #444 + 입력 */
function Field({ label, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold text-ink-700">{label}</span>
      {children}
    </label>
  );
}
