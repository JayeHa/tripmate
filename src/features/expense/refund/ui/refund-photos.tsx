"use client";

import { Camera, LoaderCircle, Plus } from "lucide-react";
import { useState } from "react";

import {
  photoKindLabel,
  photosOf,
  REFUND_PHOTO_KIND_LABEL,
  REFUND_PHOTO_KINDS,
  REFUND_PHOTO_LIMIT,
  type TaxRefund,
  useRefundPhotos,
  useRefundPhotoUrls,
} from "@/entities/tax-refund";

import { useRefundPhotoActions } from "../model/use-refund-photo-actions";
import { RefundPhotoViewer } from "./refund-photo-viewer";

type RefundPhotosProps = { tripId: string; refund: TaxRefund; onToast: (text: string) => void };

/**
 * 상세의 「사진 N/6」 — 썸네일 64(아래 종류 이름, 누르면 전체 화면), 올리는 중이면 도는 칸, 아래 「+ 영수증」 · 「+ 물품」 · 「+ 캡처」
 * (여러 장 고르기, 고르면 바로 올린다). 6장이 차면 추가 버튼을 숨긴다
 */
export function RefundPhotos({ tripId, refund, onToast }: RefundPhotosProps) {
  const { data: all = [] } = useRefundPhotos(tripId);
  const photos = photosOf(all, refund.id);
  const { data: urls = {} } = useRefundPhotoUrls(
    tripId,
    photos.map((p) => p.thumb_key),
  );
  const actions = useRefundPhotoActions(tripId, refund.id, photos.length, onToast);
  const [viewing, setViewing] = useState<string | null>(null);
  const full = photos.length + actions.uploading >= REFUND_PHOTO_LIMIT;
  return (
    <section aria-label="사진" className="flex flex-col gap-2">
      <h3 className="text-[13px] font-bold text-ink-700">
        사진 {photos.length}/{REFUND_PHOTO_LIMIT}
      </h3>
      {photos.length + actions.uploading > 0 && (
        <ul className="flex flex-wrap gap-2">
          {photos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setViewing(p.id)}
                aria-label={`${photoKindLabel(p.kind)} 사진 크게 보기`}
                className="flex w-16 flex-col items-center gap-1"
              >
                <span className="flex size-16 items-center justify-center overflow-hidden rounded-memo bg-surface-muted">
                  {urls[p.thumb_key] ? (
                    // 서명 주소(1시간)라 next/image 최적화를 거치지 않는다
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={urls[p.thumb_key]} alt="" className="size-full object-cover" />
                  ) : (
                    <Camera className="size-5 text-ink-350" aria-hidden="true" />
                  )}
                </span>
                <span className="text-[11px] font-bold text-ink-450">{photoKindLabel(p.kind)}</span>
              </button>
            </li>
          ))}
          {Array.from({ length: actions.uploading }, (_, i) => `up-${photos.length + i}`).map(
            (key) => (
              <li
                key={key}
                role="status"
                aria-label="사진 올리는 중"
                className="flex size-16 items-center justify-center rounded-memo bg-surface-muted"
              >
                <LoaderCircle className="size-5 animate-spin text-ink-400" aria-hidden="true" />
              </li>
            ),
          )}
        </ul>
      )}
      {!full && (
        <div className="flex flex-wrap gap-1.5">
          {REFUND_PHOTO_KINDS.map((kind) => (
            <label
              key={kind}
              className="flex h-8 cursor-pointer items-center gap-1 rounded-full border-[1.5px] border-dashed border-line-dashed px-3 text-[13px] font-bold text-primary"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  e.target.value = "";
                  if (files.length > 0) actions.add(kind, files);
                }}
              />
              <Plus className="size-3.5" strokeWidth={2.4} aria-hidden="true" />
              {REFUND_PHOTO_KIND_LABEL[kind]}
            </label>
          ))}
        </div>
      )}
      <RefundPhotoViewer
        tripId={tripId}
        store={refund.store}
        photos={photos}
        viewing={viewing}
        onView={setViewing}
        onRemove={actions.remove}
        removing={actions.removing}
      />
    </section>
  );
}
