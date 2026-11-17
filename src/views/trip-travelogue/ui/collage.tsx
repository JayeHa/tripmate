/* eslint-disable @next/next/no-img-element -- 서명 주소 사진이라 이미지 최적화를 거치지 않는다 */
"use client";

import {
  useVisitPhotoUrls,
  videoClock,
  type VisitPhoto,
  visitVideoOf,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

type CollageProps = { tripId: string; media: readonly VisitPhoto[] };

/**
 * 하루 카드의 사진 콜라주 — 3장 이상 = 큰 칸(2fr) + 작은 칸 둘(1fr, 84 + 84), 2장 = 반반 171, 1장 = 꽉 171. 없으면 없다.
 * 4장 이상이면 셋째 칸을 어둡게 하고 「+n」. 영상 칸은 표지 위에 큰 칸 「▶ 0:12」 · 작은 칸 「▶」
 */
export function Collage({ tripId, media }: CollageProps) {
  const shown = media.slice(0, 3);
  const { data: urls = {} } = useVisitPhotoUrls(
    tripId,
    shown.map((p) => p.photo_key),
  );
  if (shown.length === 0) return null;
  const more = media.length - shown.length;
  return (
    <div
      className={cn(
        "grid h-42.75 gap-0.5 overflow-hidden",
        shown.length === 3 && "grid-cols-[2fr_1fr] grid-rows-2",
        shown.length === 2 && "grid-cols-2",
      )}
    >
      {shown.map((p, i) => (
        <Cell
          key={p.id}
          src={urls[p.photo_key]}
          photo={p}
          big={i === 0}
          className={cn(shown.length === 3 && i === 0 && "row-span-2")}
          more={i === 2 && more > 0 ? more : 0}
        />
      ))}
    </div>
  );
}

type CellProps = {
  src: string | undefined;
  photo: VisitPhoto;
  big: boolean;
  className?: string;
  more: number;
};

/** 콜라주 한 칸 — 사진(아직 주소가 없으면 회색), 영상 표시, 「+n」 */
function Cell({ src, photo, big, className, more }: CellProps) {
  const video = visitVideoOf(photo);
  return (
    <div className={cn("relative min-h-0 bg-surface-muted", className)}>
      {src && <img src={src} alt="" className="size-full object-cover" />}
      {video && (
        <span className="absolute right-1.5 bottom-1.5 rounded-tag bg-[rgba(17,17,17,.7)] px-1.5 text-[11px]/5 font-extrabold text-white">
          ▶{big && ` ${videoClock(video.duration)}`}
        </span>
      )}
      {more > 0 && (
        <span className="absolute inset-0 flex items-center justify-center bg-[rgba(17,17,17,.5)] text-lg font-extrabold text-white">
          +{more}
        </span>
      )}
    </div>
  );
}
