/* eslint-disable @next/next/no-img-element -- 기기 안 미리보기 · 서명 주소 사진이라 이미지 최적화를 거치지 않는다 */
"use client";

import { Camera, X } from "lucide-react";
import { useRef } from "react";

import { MEMO_PHOTO_MAX, useVisitPhotoUrls } from "@/entities/schedule-item";

import type { DraftMemoPhoto } from "../lib/memo-photos";
import type { useMemoEditor } from "../model/use-memo-editor";

type MemoPhotoStripProps = {
  tripId: string;
  photos: readonly DraftMemoPhoto[];
  onRemove: (id: string) => void;
};

/**
 * 메모 창 첨부 영역의 사진 줄 — 58 썸네일 가로 스크롤, 첫 장에 「대표」 배지 · 장마다 ✕.
 * 방금 고른 사진은 기기 안 미리보기, 저장된 사진은 썸네일 주소를 받아 그린다
 */
export function MemoPhotoStrip({ tripId, photos, onRemove }: MemoPhotoStripProps) {
  const { data: urls = {} } = useVisitPhotoUrls(
    tripId,
    photos.flatMap((p) => (p.saved ? [p.saved.thumb_key] : [])),
  );
  return (
    <ul className="-mx-3 flex gap-1.5 overflow-x-auto px-3 pt-0.5">
      {photos.map((p, i) => {
        const src = p.saved ? urls[p.saved.thumb_key] : p.preview;
        return (
          <li
            key={p.id}
            className="relative size-14.5 shrink-0 overflow-hidden rounded-memo bg-surface-muted"
          >
            {src && <img src={src} alt="" className="size-full object-cover" />}
            {i === 0 && (
              <span className="absolute bottom-1 left-1 rounded-tag bg-[rgba(17,17,17,.6)] px-1 text-[10px]/4 font-extrabold text-white">
                대표
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(p.id)}
              aria-label={`사진 ${i + 1} 빼기`}
              className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-[rgba(17,17,17,.6)] text-white"
            >
              <X aria-hidden="true" className="size-3" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type PhotoButtonProps = { count: number; editor: ReturnType<typeof useMemoEditor> };

/** 첨부 바 「📷 사진 n/10」 — 숨은 파일 고르기(여러 장). 10장이면 막는다 */
export function PhotoButton({ count, editor }: PhotoButtonProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={editor.photosFull}
        className="flex h-8 items-center gap-1 rounded-button px-2 text-[13px] font-bold text-ink-700 hover:bg-surface-muted disabled:opacity-40"
      >
        <Camera aria-hidden="true" className="size-4" />
        사진
        {count > 0 && (
          <span className="font-medium text-ink-350">
            {count}/{MEMO_PHOTO_MAX}
          </span>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          editor.addPhotos([...(e.target.files ?? [])]);
          // 같은 사진을 빼고 다시 골라도 바뀜이 오게
          e.target.value = "";
        }}
      />
    </>
  );
}
