/* eslint-disable @next/next/no-img-element -- 서명 주소 사진이라 이미지 최적화를 거치지 않는다 */
"use client";

import { useVisitPhotoUrls, type VisitPhoto } from "@/entities/schedule-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { CrewMember } from "../../lib/crew";

type RecordViewPhotosProps = {
  tripId: string;
  photos: readonly VisitPhoto[];
  /** 사진을 올린 사람. 혼자 여행이거나 나간 사람이면 null — 아바타 · 「○○님 사진」 을 그리지 않는다 */
  uploader: (userId: string | null) => CrewMember | null;
};

/**
 * 기록 자세히 보기의 사진 — 폭 그대로 한 장씩(250, PC 300 · r12), 사이 20.
 * 바로 아래 올린 사람 아바타 20 + 설명, 설명이 없으면 「○○님 사진」
 */
export function RecordViewPhotos({ tripId, photos, uploader }: RecordViewPhotosProps) {
  const { data: urls = NO_URLS } = useVisitPhotoUrls(
    tripId,
    photos.map((p) => p.photo_key),
  );
  if (photos.length === 0) return null;
  return (
    <ul className="flex flex-col gap-5">
      {photos.map((p, i) => (
        <li key={p.id} className="flex flex-col gap-2">
          <div className="h-62.5 overflow-hidden rounded-card bg-surface-muted lg:h-75">
            {urls[p.photo_key] && (
              <img
                src={urls[p.photo_key]}
                alt={p.caption ?? `사진 ${i + 1}`}
                className="size-full object-cover"
              />
            )}
          </div>
          <PhotoCaption caption={p.caption} by={uploader(p.user_id)} />
        </li>
      ))}
    </ul>
  );
}

const NO_URLS: Readonly<Record<string, string>> = {};

type PhotoCaptionProps = { caption: string | null; by: CrewMember | null };

/** 사진 아래 한 줄 — 올린 사람 아바타 + 설명(없으면 회색 「○○님 사진」). 둘 다 없으면 줄이 없다 */
function PhotoCaption({ caption, by }: PhotoCaptionProps) {
  if (!caption && !by) return null;
  return (
    <div className="flex items-start gap-2">
      {by && (
        <Avatar className="mt-px size-5">
          <AvatarImage src={by.avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{by.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      )}
      {caption ? (
        <p className="min-w-0 text-sm/normal wrap-break-word text-ink-700">{caption}</p>
      ) : (
        <p className="min-w-0 truncate text-sm/normal text-route-card-meta">{by?.name}님 사진</p>
      )}
    </div>
  );
}
