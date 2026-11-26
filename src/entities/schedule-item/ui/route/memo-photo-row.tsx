/* eslint-disable @next/next/no-img-element -- 서명 주소 사진이라 이미지 최적화를 거치지 않는다 */
"use client";

import type { MemoPhoto } from "../../model/place";
import { useVisitPhotoUrls } from "../../model/use-visit-photos";

type MemoPhotoRowProps = { tripId: string; photos: readonly MemoPhoto[] };

/**
 * 메모 카드의 사진 줄 — 3장까지 54(PC 64) · r9 · 6 간격, 4장 이상이면 셋째 칸을 어둡게 하고 「+n」.
 * 썸네일(긴 변 192)만 받는다. 누르면 카드와 같이 메모 창이 열린다(카드 버튼이 덮는다)
 */
export function MemoPhotoRow({ tripId, photos }: MemoPhotoRowProps) {
  const shown = photos.slice(0, 3);
  const { data: urls = {} } = useVisitPhotoUrls(
    tripId,
    shown.map((p) => p.thumb_key),
  );
  if (shown.length === 0) return null;
  const more = photos.length - shown.length;
  return (
    <div aria-label={`사진 ${photos.length}장`} role="img" className="flex gap-1.5">
      {shown.map((p, i) => (
        <span
          key={p.photo_key}
          className="relative size-13.5 shrink-0 overflow-hidden rounded-[9px] bg-surface-muted lg:size-16"
        >
          {urls[p.thumb_key] && (
            <img src={urls[p.thumb_key]} alt="" className="size-full object-cover" />
          )}
          {i === 2 && more > 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-[rgba(17,17,17,.45)] text-[13px] font-extrabold text-white">
              +{more}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
