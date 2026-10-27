"use client";

import { Link as LinkIcon, Star, X } from "lucide-react";
import { useState } from "react";

import {
  itemName,
  type Memo,
  MEMO_MAX,
  NumberMarker,
  type TimelineRow,
} from "@/entities/schedule-item";
import { useReportLock } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { LinkRows } from "@/shared/ui/link-rows";
import { PinToggle } from "@/shared/ui/pin-toggle";

import { type MemoComposerState, useMemoComposer } from "../model/use-memo-composer";
import { DeleteMemoButton } from "./delete-memo-button";

/**
 * 모바일: 아래에서 올라오는 시트. 처음부터 정한 높이(592, 화면의 90% 까지)로 연다 — 링크 줄을 더할 때마다 창이 자라며 흔들리지 않게
 * (넘치는 내용은 가운데 칸이 스크롤한다)
 */
const MOBILE_CLASS =
  "top-auto bottom-0 left-0 flex h-[min(592px,90dvh)] w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none";
/** PC: 가운데 520 모달. 모바일처럼 처음부터 정한 높이(592 — 링크 한 줄이 스크롤 없이 들어간다, 화면이 작으면 화면 높이)로 연다 */
const PC_CLASS =
  "flex h-[min(592px,calc(100dvh-2rem))] w-130 max-w-130 flex-col gap-0 overflow-hidden rounded-sheet bg-white p-0 shadow-sheet ring-0 sm:max-w-130";

type MemoComposerDialogProps = {
  tripId: string;
  /** 메모를 붙일 일정의 줄(번호 마커 · 이름) */
  row: TimelineRow;
  /** 「day 1 · 10.31 (토) 13:00」 */
  when: string;
  /** 고치는 메모. 새로 쓰면 null */
  memo: Memo | null;
  isDesktop: boolean;
  onClose: () => void;
};

/**
 * 메모 작성 · 수정 — 모바일 바텀시트 / PC 520 모달. 대상(번호 · 이름 · 날짜) · ★ 중요 · 홈에 고정 · 본문(500자) · 링크(제목 + URL).
 * 고칠 때는 아래 왼쪽에 「삭제」. 저장 · 삭제 중에는 닫히지 않는다
 */
export function MemoComposerDialog({ isDesktop, onClose, ...rest }: MemoComposerDialogProps) {
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open locked={locked} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} className={isDesktop ? PC_CLASS : MOBILE_CLASS}>
        <ComposerBody {...rest} onClose={onClose} onLockChange={setLocked} />
      </DialogContent>
    </Dialog>
  );
}

type ComposerBodyProps = Omit<MemoComposerDialogProps, "isDesktop"> & {
  onLockChange: (locked: boolean) => void;
};

/** 작성 칸. 상태는 useMemoComposer 가 쥔다 */
function ComposerBody({ tripId, row, when, memo, onClose, onLockChange }: ComposerBodyProps) {
  const form = useMemoComposer({ tripId, item: row.item, memo, onDone: onClose });
  useReportLock(form.locked, onLockChange);
  return (
    <>
      <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-3">
        <DialogTitle className="text-lg font-extrabold text-ink-900">
          {form.editing ? "메모 수정" : "메모 추가"}
        </DialogTitle>
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          disabled={form.locked}
          className="flex text-ink-400 disabled:opacity-40"
        >
          <X className="size-5.5" strokeWidth={2} />
        </button>
      </div>
      {/* 스크롤 칸 안의 내용은 flex 로 줄어들지 않게 한 겹 감싼다 — 링크 줄이 많아지면 줄 · 버튼이 납작해지던 문제 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 rounded-card bg-surface-sunken px-3.5 py-3">
            <NumberMarker kind={row.kind} num={row.num} status={row.status} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-ink-900">{itemName(row.item)}</span>
              <span className="text-xs text-ink-400">{when}</span>
            </div>
          </div>
          <MemoFields form={form} />
          {form.error && <p className="text-[13px] text-destructive">{form.error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-divider px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {form.editing && <DeleteMemoButton disabled={form.pending} onConfirm={form.destroy} />}
        <Button
          variant="chip"
          size="form"
          className="ml-auto w-24"
          onClick={onClose}
          disabled={form.locked}
        >
          취소
        </Button>
        <Button
          size="form"
          className="w-36"
          disabled={!form.canSave || form.pending}
          onClick={form.save}
        >
          저장
        </Button>
      </div>
    </>
  );
}

type MemoFieldsProps = { form: MemoComposerState };

/** ★ 중요 · 링크 · 홈에 고정 버튼, 본문(글자 수), 링크 줄 */
function MemoFields({ form }: MemoFieldsProps) {
  const { draft } = form;
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={draft.starred}
          onClick={() => form.set("starred", !draft.starred)}
          className={cn(
            "flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-bold",
            draft.starred
              ? "border-important-line bg-important-bg text-important-text"
              : "border-line bg-white text-ink-500",
          )}
        >
          <Star className={cn("size-3.5", draft.starred && "fill-current")} />
          중요
        </button>
        <button
          type="button"
          onClick={form.addLink}
          className="flex h-8 items-center gap-1 rounded-full border border-line bg-white px-3 text-[13px] font-bold text-ink-500"
        >
          <LinkIcon className="size-3.5" />
          링크
        </button>
        <PinToggle
          pinned={draft.pinned}
          onToggle={() => form.set("pinned", !draft.pinned)}
          disabled={!form.pinReady}
          className="ml-auto"
        />
      </div>
      <div className="flex flex-col gap-1">
        <textarea
          value={draft.body}
          onChange={(e) => form.set("body", e.target.value)}
          maxLength={MEMO_MAX}
          rows={5}
          aria-label="메모"
          placeholder={
            draft.starred
              ? "예) 18:50까지 7층 매장 앞 집합 — 늦으면 정리번호 무효"
              : "메모를 입력하세요"
          }
          className="w-full resize-none rounded-memo border border-line px-3.5 py-3 text-[15px]/relaxed text-ink-900 outline-none focus:border-primary"
        />
        <span className="self-end text-xs text-ink-350">
          {draft.body.length}/{MEMO_MAX}
        </span>
      </div>
      {/* 링크가 없어도 「링크 추가」 가 보이게 늘 그린다 */}
      <LinkRows
        label="메모 링크"
        titlePlaceholder="링크 제목 (예: 예약 확인)"
        links={draft.links}
        onChange={(links) => form.set("links", links)}
      />
    </>
  );
}
