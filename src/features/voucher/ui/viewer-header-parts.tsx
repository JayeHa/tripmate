"use client";

import { CircleCheck, Ellipsis, Pencil, Pin, Trash2, Undo2 } from "lucide-react";

import { iGa } from "@/shared/lib/josa";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import type { VoucherViewerState } from "../model/use-voucher-viewer";

type PinButtonProps = { viewer: VoucherViewerState };

/** 「홈에 고정」 pill(32 · r16) — 꺼짐 회색, 켜짐 파랑 「고정됨」 */
export function PinButton({ viewer }: PinButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={viewer.pinned}
      onClick={viewer.togglePin}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-[13px] font-bold",
        viewer.pinned ? "bg-primary text-white" : "bg-surface-muted text-ink-700",
      )}
    >
      <Pin className="size-3.5" aria-hidden="true" />
      {viewer.pinned ? "고정됨" : "홈에 고정"}
    </button>
  );
}

type ViewerMenuProps = {
  disabled: boolean;
  /** 이미 썼다 — 「사용했어요」 대신 「사용 표시 되돌리기」 */
  used: boolean;
  onToggleUsed: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/** ⋯ 메뉴(170) — 사용했어요(쓴 뒤에는 되돌리기) · 수정 · 삭제(빨강) */
export function ViewerMenu({ disabled, used, onToggleUsed, onEdit, onDelete }: ViewerMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="바우처 메뉴"
        disabled={disabled}
        className="flex size-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 data-popup-open:bg-white/10"
      >
        <Ellipsis className="size-5.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-42.5">
        <DropdownMenuItem onClick={onToggleUsed}>
          {used ? (
            <Undo2 className="size-4 text-ink-700" />
          ) : (
            <CircleCheck className="size-4 text-ink-700" />
          )}
          {used ? "사용 표시 되돌리기" : "사용했어요"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4 text-ink-700" />
          수정
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type DeleteVoucherDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onConfirm: () => void;
};

/** 지우기 확인 — 「바우처를 삭제할까요?」 */
export function DeleteVoucherDialog({
  open,
  onOpenChange,
  title,
  onConfirm,
}: DeleteVoucherDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>바우처를 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            「{title}」{iGa(title)} 노트와 일정에서 모두 사라져요.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="danger" onClick={onConfirm}>
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
