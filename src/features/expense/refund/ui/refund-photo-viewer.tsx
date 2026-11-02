"use client";

import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import { useState } from "react";

import { photoKindLabel, type TaxRefundPhoto, useRefundPhotoUrls } from "@/entities/tax-refund";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
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
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

type RefundPhotoViewerProps = {
  tripId: string;
  store: string;
  /** 그 기록의 사진(보이는 순서) */
  photos: TaxRefundPhoto[];
  /** 보는 사진 id — null 이면 닫혀 있다 */
  viewing: string | null;
  onView: (id: string | null) => void;
  onRemove: (photo: TaxRefundPhoto) => void;
  removing: boolean;
};

/**
 * 환급 사진 전체 화면 — 어두운 바탕(#111 92%), 머리(✕ · 「AlpenTOKYO · 캡처 2/4」 · 「삭제」), 가운데 사진(잘리지 않게),
 * 양옆 ‹ › 로 같은 기록의 다른 사진. 삭제는 확인을 거치고, 지우면 닫는다. 보던 사진이 그사이 지워지면 닫힌다
 */
export function RefundPhotoViewer({
  tripId,
  store,
  photos,
  viewing,
  onView,
  onRemove,
  removing,
}: RefundPhotoViewerProps) {
  const index = photos.findIndex((p) => p.id === viewing);
  const current = index >= 0 ? photos[index] : null;
  const open = current !== null;
  const shown = useHeldWhileClosing(open, current);
  const [asking, setAsking] = useState(false);
  const { data: urls = {} } = useRefundPhotoUrls(tripId, shown ? [shown.photo_key] : []);
  const url = shown ? urls[shown.photo_key] : undefined;
  /** 앞 · 뒤 사진으로 — 끝에서는 멈춘다 */
  const step = (d: number) => {
    const next = photos[index + d];
    if (next) onView(next.id);
  };
  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && onView(null)}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-ink-900/92 p-0 pt-[env(safe-area-inset-top)] text-white ring-0 sm:max-w-none"
        >
          <div className="flex h-14 shrink-0 items-center gap-3 px-4.5">
            <button type="button" aria-label="닫기" onClick={() => onView(null)} className="flex">
              <X className="size-6 text-white" />
            </button>
            <DialogTitle className="min-w-0 flex-1 truncate text-base font-extrabold text-white">
              {store} · {shown ? photoKindLabel(shown.kind) : ""} {index + 1}/{photos.length}
            </DialogTitle>
            <button
              type="button"
              onClick={() => setAsking(true)}
              disabled={removing || !current}
              className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-white/14 px-3 text-[13px] font-bold disabled:opacity-40"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              삭제
            </button>
          </div>
          <div className="relative mx-4 mt-3 mb-10 min-h-0 flex-1">
            {url && (
              // 서명 주소(1시간)라 next/image 최적화를 거치지 않는다
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`${store} ${shown ? photoKindLabel(shown.kind) : ""} 사진`}
                className="size-full object-contain"
              />
            )}
            {index > 0 && (
              <button
                type="button"
                aria-label="앞 사진"
                onClick={() => step(-1)}
                className="absolute top-1/2 left-0 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
            {index >= 0 && index < photos.length - 1 && (
              <button
                type="button"
                aria-label="다음 사진"
                onClick={() => step(1)}
                className="absolute top-1/2 right-0 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={asking} onOpenChange={setAsking}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사진을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              일행의 환급 기록에서도 사라지고 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              onClick={() => {
                if (current) onRemove(current);
                onView(null);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
