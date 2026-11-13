"use client";

import { useRef } from "react";

import {
  VISIT_PHOTO_LIMIT,
  VISIT_VIDEO_MAX_SECONDS,
  VISIT_VIDEO_MIMES,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { CrewMember } from "../../lib/crew";
import { countText, type DraftPhoto, uncaptioned } from "../../lib/photo-draft";
import type { RecordPhotos } from "../../model/use-record-photos";
import { PhotoPreview, type PreviewVideo } from "./photo-preview";
import { PhotoThumbs } from "./photo-thumbs";
import { RecordBlock } from "./record-block";

/** 고를 수 있는 파일 — 사진 전부(받는 종류는 줄인 뒤에 본다)와 받는 영상 종류 */
const ACCEPT = ["image/*", ...VISIT_VIDEO_MIMES].join(",");

type PhotoPickerProps = {
  tripId: string;
  photos: RecordPhotos;
  /** 저장된 사진의 키 → 읽기 주소 */
  urls: Readonly<Record<string, string>>;
  /** 오프라인 — 사진을 고칠 수 없다고 알리고 막는다 */
  offline: boolean;
  /** 저장 중 — 막기만 한다 */
  saving: boolean;
  /** 고른 결과 — 다 받지 못했으면 그 문구(10개를 넘겼거나 올릴 수 없는 영상), 다 받았으면 null(지난 문구를 지운다) */
  onNotice: (text: string | null) => void;
  /** 일행이 있는 여행 — 라벨에 「함께 올려요」 */
  shared: boolean;
  /** 사진을 올린 사람(null = 나, 방금 고른 사진). 그리지 않을 때는 null */
  uploader: (userId: string | null) => CrewMember | null;
};

/**
 * 기록 창의 사진 · 영상 — 「고르고 아래서 적기」. 썸네일 줄(56 · 가로 스크롤 · 끝에 「＋」) 아래 고른 것을 크게 보이고 설명을 적는다.
 * 하나도 없으면 큰 「사진 · 영상 추가」 칸. 라벨 오른쪽 「5 / 10 · 영상 1」, 설명 없는 것이 있으면 「· 설명 없음 N」(막지 않는다).
 * 새로 고른 것이 바로 골라진다. 영상은 고를 때 확인하고 표지를 만들어서 그동안(reading) 칸을 막는다.
 * 오프라인에서는 보기만 한다(사진 · 영상은 대기열에 넣지 않는다).
 * 일행이 함께 올린다 — 일행이 있으면 썸네일 왼쪽 위에 올린 사람 아바타, 큰 칸의 칩에 이름
 */
export function PhotoPicker({
  tripId,
  photos,
  urls,
  offline,
  saving,
  onNotice,
  shared,
  uploader,
}: PhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const { draft, selected } = photos;
  const disabled = offline || saving || photos.reading;
  const missing = uncaptioned(draft);
  const pick = () => input.current?.click();
  const current = draft[selected] as DraftPhoto | undefined;
  const by = (d: DraftPhoto) => uploader(d.saved?.user_id ?? null);
  return (
    <RecordBlock
      label="사진 · 영상"
      sub={shared ? "함께 올려요" : undefined}
      aside={
        <span
          className={cn("text-xs tabular-nums", missing > 0 ? "text-my-star-text" : "text-ink-350")}
        >
          {countText(draft, VISIT_PHOTO_LIMIT)}
        </span>
      }
    >
      {offline && (
        <p className="text-xs text-ink-350">
          오프라인이에요. 사진 · 영상은 연결되면 고칠 수 있어요
        </p>
      )}
      {photos.reading && <p className="text-xs text-ink-350">영상을 확인하는 중…</p>}
      {draft.length === 0 ? (
        <button
          type="button"
          onClick={pick}
          disabled={disabled}
          className="flex h-30 flex-col items-center justify-center gap-0.5 rounded-card border-[1.5px] border-dashed border-line-dashed text-ink-700 disabled:opacity-50"
        >
          <span aria-hidden className="text-xl">
            📷
          </span>
          <span className="text-sm font-bold">사진 · 영상 추가</span>
          <span className="text-xs text-ink-350">
            최대 {VISIT_PHOTO_LIMIT}개 · 영상은 {VISIT_VIDEO_MAX_SECONDS}초까지
          </span>
        </button>
      ) : (
        <>
          <PhotoThumbs
            draft={draft}
            urls={urls}
            selected={selected}
            by={by}
            onSelect={photos.select}
            onAdd={!disabled && draft.length < VISIT_PHOTO_LIMIT ? pick : undefined}
          />
          {current && (
            <PhotoPreview
              src={current.preview ?? (current.saved ? urls[current.saved.photo_key] : undefined)}
              video={previewVideo(tripId, current)}
              index={selected}
              count={draft.length}
              by={by(current)?.name}
              caption={current.caption}
              onCaption={(text) => photos.setCaption(selected, text)}
              onSelect={photos.select}
              onRemove={() => photos.remove(selected)}
              disabled={disabled}
            />
          )}
        </>
      )}
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          void photos.add(files).then(onNotice);
        }}
      />
    </RecordBlock>
  );
}

/** 큰 칸의 재생 칸에 넘길 값 — 새 영상은 고른 파일을 바로, 저장된 영상은 원본 키로 주소를 받아 재생한다. 사진은 null */
function previewVideo(tripId: string, d: DraftPhoto): PreviewVideo | null {
  if (!d.video) return null;
  return {
    id: d.key,
    tripId,
    duration: d.video.duration,
    posterAt: d.video.posterAt,
    localSrc: d.video.local?.src ?? null,
    videoKey: d.saved?.video_key ?? null,
  };
}
