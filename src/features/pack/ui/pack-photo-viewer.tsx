"use client";

import { LoaderCircle, RefreshCw, Trash2, X } from "lucide-react";

import { type PackItem, usePackPhotoUrls } from "@/entities/pack";
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

import type { PackPhotoActions } from "../model/use-pack-photo-actions";
import { PhotoInput } from "./photo-input";

type PackPhotoViewerProps = { tripId: string; photos: PackPhotoActions };

/**
 * 쇼핑 사진 전체 화면 — 어두운 바탕(#111 92%), 머리(✕ · 이름 + 메모 · 「교체」 · 「삭제」 pill 32), 가운데 사진(잘리지 않게).
 * 삭제는 확인을 거친다. 닫히는 동안은 마지막 항목을 그린다. 모바일 · PC 같은 화면
 */
export function PackPhotoViewer({ tripId, photos }: PackPhotoViewerProps) {
  const open = photos.viewing !== null;
  const item = useHeldWhileClosing(open, photos.viewing);
  const held = useHeldWhileClosing(photos.removing, item);
  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !next && photos.closeViewer()}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none bg-ink-900/92 p-0 pt-[env(safe-area-inset-top)] text-white ring-0 sm:max-w-none"
        >
          {item && <ViewerBody tripId={tripId} item={item} photos={photos} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={photos.removing} onOpenChange={(next) => !next && photos.cancelRemove()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사진을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              「{held?.name}」의 참고 사진이 일행의 목록에서도 사라져요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={photos.confirmRemove}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type ViewerBodyProps = { tripId: string; item: PackItem; photos: PackPhotoActions };

/** 머리 + 사진 — 교체하는 동안은 「교체」 · 「삭제」 를 막고 가운데에 도는 표시 */
function ViewerBody({ tripId, item, photos }: ViewerBodyProps) {
  const key = item.photo_key;
  const { data: urls = {} } = usePackPhotoUrls(tripId, key ? [key] : []);
  const url = key ? urls[key] : undefined;
  const busy = photos.isBusy(item.id);
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4.5">
        <button type="button" aria-label="닫기" onClick={photos.closeViewer} className="flex">
          <X className="size-6 text-white" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col">
          <DialogTitle className="truncate text-base font-extrabold text-white">
            {item.name}
          </DialogTitle>
          {item.memo && <span className="truncate text-xs text-ink-350">{item.memo}</span>}
        </div>
        <label
          aria-disabled={busy}
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-full bg-white/14 px-3 text-[13px] font-bold aria-disabled:opacity-40"
        >
          <PhotoInput onPick={(file) => photos.put(item, file)} disabled={busy} />
          <RefreshCw className="size-3.5" aria-hidden="true" />
          교체
        </label>
        <button
          type="button"
          onClick={photos.askRemove}
          disabled={busy}
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
          <img src={url} alt={`${item.name} 참고 사진`} className="size-full object-contain" />
        )}
        {busy && (
          <span
            role="status"
            aria-label="사진 올리는 중"
            className="absolute inset-0 flex items-center justify-center"
          >
            <LoaderCircle className="size-7 animate-spin text-white" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  );
}
