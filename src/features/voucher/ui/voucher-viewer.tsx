"use client";

import { Download, FileText, X } from "lucide-react";
import { useState } from "react";

import { isPdf, type Voucher } from "@/entities/voucher";
import { useOpenCount, useReportLock } from "@/shared/lib/use-dialog-state";
import { useWakeLock } from "@/shared/lib/use-wake-lock";
import { cn } from "@/shared/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { type ViewerContent, viewerSubText } from "../lib/voucher-view";
import { useVoucherDownload } from "../model/use-voucher-download";
import { useVoucherViewer } from "../model/use-voucher-viewer";
import { PdfAllPagesView } from "./pdf-all-pages";
import { DeleteVoucherDialog, PinButton, ViewerMenu } from "./viewer-header-parts";
import { ViewerPanel } from "./viewer-panel";
import { ViewerStage } from "./viewer-stage";

type VoucherViewerProps = {
  tripId: string;
  open: boolean;
  /** 그릴 바우처 — 닫히는 동안에도 마지막 것을 넘긴다 */
  content: ViewerContent | null;
  onClose: () => void;
  onEdit: (voucher: Voucher) => void;
  /** 지운 뒤 — 뷰어를 연 쪽(상세)도 닫는다 */
  onDeleted: () => void;
  onToast: (text: string) => void;
};

/**
 * 바우처 뷰어 — 현장에서 보여 주는 전체 화면(#111). 머리(✕ · 제목 + 「주인 · 연결 · 1 / 3」 · 원본 저장 · 홈에 고정 · ⋯ 수정/삭제),
 * 가운데 그림(현장용 페이지를 좌우로 넘긴다), 아래 흰 판(번호 · 메모). 보는 동안 화면이 꺼지지 않게 한다. 모바일 · PC 같은 화면.
 * PDF 는 그림 아래 「PDF 전체 보기」 로 원본의 모든 쪽을 세로로 이어 본다(받지 않고 앱 안에서)
 */
export function VoucherViewer({
  tripId,
  open,
  content,
  onClose,
  onEdit,
  onDeleted,
  onToast,
}: VoucherViewerProps) {
  const openCount = useOpenCount(open);
  const [locked, setLocked] = useState(false);
  return (
    <Dialog open={open} locked={locked} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-[#111] p-0 pt-[env(safe-area-inset-top)] text-white ring-0 sm:max-w-none"
      >
        {content && (
          <ViewerBody
            key={openCount}
            tripId={tripId}
            open={open}
            content={content}
            onClose={onClose}
            onEdit={onEdit}
            onDeleted={onDeleted}
            onToast={onToast}
            onLockChange={setLocked}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type ViewerBodyProps = Omit<VoucherViewerProps, "content"> & {
  content: ViewerContent;
  onLockChange: (locked: boolean) => void;
};

/** 뷰어 내용 — 열 때마다 새로 마운트돼 첫 쪽에서 시작한다 */
function ViewerBody({
  tripId,
  open,
  content,
  onClose,
  onEdit,
  onDeleted,
  onToast,
  onLockChange,
}: ViewerBodyProps) {
  const { voucher } = content;
  const viewer = useVoucherViewer({ tripId, voucher, onDeleted, onToast });
  const download = useVoucherDownload(tripId, onToast);
  const awake = useWakeLock(open);
  const [confirming, setConfirming] = useState(false);
  // 「PDF 전체 보기」 — 원본 PDF 의 모든 쪽. 현장용 페이지(그림)만으로는 나머지 쪽을 볼 수 없다
  const [allPages, setAllPages] = useState(false);
  const pdfKey = isPdf(voucher) ? voucher.file_key : null;
  useReportLock(viewer.deleting, onLockChange);
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-2.5 pr-3.5 pl-4.5">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          disabled={viewer.deleting}
          className="flex text-white disabled:opacity-40"
        >
          <X className="size-6" strokeWidth={2} />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <DialogTitle className="truncate text-base font-extrabold text-white">
            {voucher.title}
          </DialogTitle>
          <span className="truncate text-xs text-ink-350">
            {/* 「1 / 2」 는 현장용 페이지의 쪽이라 전체 보기에서는 뺀다(그 화면 위에 「전체 N쪽」) */}
            {viewerSubText(
              content.owners,
              content.target,
              viewer.page,
              allPages ? 0 : viewer.total,
            )}
          </span>
        </div>
        {voucher.file_key && (
          <button
            type="button"
            aria-label="원본 저장"
            disabled={download.busy}
            onClick={() => download.download(voucher)}
            className="flex size-9 shrink-0 items-center justify-center text-white disabled:opacity-40"
          >
            <Download className="size-5.5" strokeWidth={2} />
          </button>
        )}
        <PinButton viewer={viewer} />
        <ViewerMenu
          disabled={viewer.deleting}
          onEdit={() => onEdit(voucher)}
          onDelete={() => setConfirming(true)}
        />
      </div>
      {/* PC 처럼 넓은 화면에서도 휴대폰 폭(480)으로 가운데에 — 판이 화면 폭으로 늘어나지 않게. 전체 보기는 글을 읽게 PC 에서 800 까지 */}
      <div
        className={cn(
          "mx-auto flex min-h-0 w-full flex-1 flex-col",
          allPages ? "max-w-120 lg:max-w-200" : "max-w-120",
        )}
      >
        {allPages && pdfKey ? (
          <PdfAllPagesView
            tripId={tripId}
            fileKey={pdfKey}
            title={voucher.title}
            onBack={() => setAllPages(false)}
          />
        ) : (
          <>
            <ViewerStage
              voucher={voucher}
              viewer={viewer}
              numbers={content.numbers}
              dateText={content.date ?? content.target}
            />
            {pdfKey && (
              <button
                type="button"
                onClick={() => setAllPages(true)}
                className="mx-auto mb-3 flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-4 text-[13px] font-bold text-white"
              >
                <FileText className="size-3.75" aria-hidden="true" />
                PDF 전체 보기
              </button>
            )}
            <ViewerPanel numbers={content.numbers} memo={voucher.memo} awake={awake} />
          </>
        )}
      </div>
      <DeleteVoucherDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={voucher.title}
        onConfirm={viewer.remove}
      />
    </>
  );
}
