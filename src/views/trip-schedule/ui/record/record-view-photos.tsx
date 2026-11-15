/* eslint-disable @next/next/no-img-element -- 서명 주소 사진이라 이미지 최적화를 거치지 않는다 */
"use client";

import { useState } from "react";

import { useVisitPhotoUrls, type VisitPhoto, visitVideoOf } from "@/entities/schedule-item";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { CrewMember } from "../../lib/crew";
import { VideoStage } from "./video-stage";

type RecordViewPhotosProps = {
  tripId: string;
  photos: readonly VisitPhoto[];
  /** 사진을 올린 사람. 혼자 여행이거나 나간 사람이면 null — 아바타 · 「○○님 사진」 을 그리지 않는다 */
  uploader: (userId: string | null) => CrewMember | null;
};

/**
 * 기록 자세히 보기의 사진 · 영상 — 폭 그대로 하나씩(250, PC 300 · r12), 사이 20.
 * 바로 아래 올린 사람 아바타 20 + 설명, 설명이 없으면 「○○님 사진」(영상이면 「○○님 영상」).
 * 영상은 표지 + ▶ + 길이이고 눌러야 재생한다(소리 켜짐) — **한 번에 하나**: 다른 영상을 누르면 보던 영상은 표지로 돌아간다
 */
export function RecordViewPhotos({ tripId, photos, uploader }: RecordViewPhotosProps) {
  const { data: urls = NO_URLS } = useVisitPhotoUrls(
    tripId,
    photos.map((p) => p.photo_key),
  );
  /** 지금 재생할 차례인 영상(줄 id) */
  const [playing, setPlaying] = useState<string | null>(null);
  if (photos.length === 0) return null;
  return (
    <ul className="flex flex-col gap-5">
      {photos.map((p, i) => {
        const video = visitVideoOf(p);
        const kind = video ? "영상" : "사진";
        const alt = p.caption ?? `${kind} ${i + 1}`;
        return (
          <li key={p.id} className="flex flex-col gap-2">
            <div className="relative h-62.5 overflow-hidden rounded-card bg-surface-muted lg:h-75">
              {video ? (
                <VideoStage
                  reader
                  tripId={tripId}
                  poster={urls[p.photo_key]}
                  alt={alt}
                  duration={video.duration}
                  posterAt={video.posterAt}
                  localSrc={null}
                  videoKey={video.key}
                  active={playing === p.id}
                  onActivate={() => setPlaying(p.id)}
                />
              ) : (
                urls[p.photo_key] && (
                  <img src={urls[p.photo_key]} alt={alt} className="size-full object-cover" />
                )
              )}
            </div>
            <PhotoCaption caption={p.caption} by={uploader(p.user_id)} kind={kind} />
          </li>
        );
      })}
    </ul>
  );
}

const NO_URLS: Readonly<Record<string, string>> = {};

type PhotoCaptionProps = { caption: string | null; by: CrewMember | null; kind: "사진" | "영상" };

/** 사진 · 영상 아래 한 줄 — 올린 사람 아바타 + 설명(없으면 회색 「○○님 사진」 · 「○○님 영상」). 둘 다 없으면 줄이 없다 */
function PhotoCaption({ caption, by, kind }: PhotoCaptionProps) {
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
        <p className="min-w-0 truncate text-sm/normal text-route-card-meta">
          {by?.name}님 {kind}
        </p>
      )}
    </div>
  );
}
