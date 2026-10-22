"use client";

import { ImagePlus, LoaderCircle, RefreshCw } from "lucide-react";

import { usePackPhotoUrls } from "@/entities/pack";

import type { usePhotoDraft } from "../model/use-photo-draft";
import { PhotoInput } from "./photo-input";

type PackSheetPhotoProps = { tripId: string; draft: ReturnType<typeof usePhotoDraft> };

/**
 * 상세 시트의 큰 사진 칸(200 · r12 · 점선) — 없으면 「참고 사진 추가」, 있으면 사진(잘리지 않게) + 오른쪽 아래 「교체」,
 * 칸 아래 오른쪽 「사진 지우기」. 바꾼 사진은 「저장」 때 항목에 붙는다
 */
export function PackSheetPhoto({ tripId, draft }: PackSheetPhotoProps) {
  const key = draft.photo?.photo_key;
  const { data: urls = {} } = usePackPhotoUrls(tripId, key ? [key] : []);
  const url = key ? urls[key] : undefined;
  return (
    <div className="flex flex-col gap-1">
      <label className="relative flex h-50 cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-card border-[1.5px] border-dashed border-line-dashed bg-surface-sunken">
        <PhotoInput onPick={draft.pick} disabled={draft.uploading} />
        {key ? (
          <>
            {url && (
              // 서명 주소(1시간)라 next/image 최적화를 거치지 않는다
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="참고 사진"
                className="absolute inset-0 size-full bg-white object-contain"
              />
            )}
            <span className="absolute right-2.5 bottom-2.5 flex h-7 items-center gap-1 rounded-full bg-ink-900/70 px-2.5 text-xs font-bold text-white">
              <RefreshCw className="size-3" aria-hidden="true" />
              교체
            </span>
          </>
        ) : (
          <>
            <ImagePlus className="size-6.5 text-ink-400" aria-hidden="true" />
            <span className="text-sm font-bold text-ink-500">참고 사진 추가</span>
            <span className="text-xs text-ink-350">인터넷에서 본 포장 · 제품 캡처</span>
          </>
        )}
        {draft.uploading && (
          <span
            role="status"
            aria-label="사진 올리는 중"
            className="absolute inset-0 flex items-center justify-center bg-white/70"
          >
            <LoaderCircle className="size-6 animate-spin text-ink-400" aria-hidden="true" />
          </span>
        )}
      </label>
      {key && (
        <button
          type="button"
          onClick={draft.clear}
          disabled={draft.uploading}
          className="self-end text-[13px] text-ink-400 disabled:opacity-40"
        >
          사진 지우기
        </button>
      )}
    </div>
  );
}
