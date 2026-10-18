"use client";

import { ArrowLeft, Download, Maximize2 } from "lucide-react";

import type { Voucher } from "@/entities/voucher";
import { useVoucherDownload } from "@/features/voucher";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { useVoucherDetail } from "@/widgets/trip-voucher";

import { VoucherDetailBody } from "./voucher-detail-body";

type MobileVoucherDetailProps = {
  tripId: string;
  /** 고른 바우처 id, 닫혀 있으면 null */
  id: string | null;
  onClose: () => void;
  onEdit: (voucher: Voucher) => void;
  /** 뷰어를 연다(「현장에서 보여주기」 · 썸네일) */
  onShow: () => void;
  onToast: (text: string) => void;
};

/**
 * 모바일 바우처 상세 — 전체 화면 페이지. 머리 52(← · 「바우처」 17/800 · 원본 저장 ⬇ · 「수정」) + 스크롤 본문 +
 * 아래 고정 「현장에서 보여주기」(52 · 잉크).
 * 그사이 일행이 지우면 닫힌다. 닫히는 동안에는 마지막 바우처를 그대로 그린다(지워져 닫히면 빈 틀)
 */
export function MobileVoucherDetail({
  tripId,
  id,
  onClose,
  onEdit,
  onShow,
  onToast,
}: MobileVoucherDetailProps) {
  // id 를 잡는다 — 상세 객체는 렌더마다 새로 만들어져 그대로 잡으면 매번 바뀐 것으로 본다
  const heldId = useHeldWhileClosing(id !== null, id);
  const shown = useVoucherDetail(tripId, heldId);
  // 그사이 일행이 지웠으면(찾지 못하면) 닫는다
  const open = id !== null && shown !== null;
  const download = useVoucherDownload(tripId, onToast);
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-white p-0 pt-[env(safe-area-inset-top)] ring-0 sm:max-w-none"
      >
        <div className="flex h-13 shrink-0 items-center gap-3 px-4.5">
          <button type="button" aria-label="뒤로" onClick={onClose} className="flex text-ink-900">
            <ArrowLeft className="size-6" strokeWidth={2} />
          </button>
          <DialogTitle className="flex-1 text-[17px] font-extrabold text-ink-900">
            바우처
          </DialogTitle>
          {shown?.voucher.file_key && (
            <button
              type="button"
              aria-label="원본 저장"
              disabled={download.busy}
              onClick={() => download.download(shown.voucher)}
              className="mr-0.5 flex size-9 items-center justify-center text-ink-900 disabled:opacity-40"
            >
              <Download className="size-5.5" strokeWidth={2} />
            </button>
          )}
          <button
            type="button"
            disabled={!shown}
            onClick={() => shown && onEdit(shown.voucher)}
            className="text-[15px] font-bold text-primary"
          >
            수정
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-7">
          {shown && <VoucherDetailBody detail={shown} onShow={onShow} />}
        </div>
        <div className="shrink-0 border-t border-surface-muted px-5 pt-3 pb-[calc(1.875rem+env(safe-area-inset-bottom))]">
          <Button
            size="cta"
            className="w-full gap-1.5 bg-ink-900 hover:bg-ink-800"
            onClick={onShow}
          >
            <Maximize2 className="size-4.5" aria-hidden="true" />
            현장에서 보여주기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
