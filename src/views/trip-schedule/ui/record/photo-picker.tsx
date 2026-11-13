/* eslint-disable @next/next/no-img-element -- 서명 주소 · 미리보기(object URL) 사진이라 이미지 최적화를 거치지 않는다 */
"use client";

import { useRef } from "react";

import { VISIT_PHOTO_LIMIT } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { CrewMember } from "../../lib/crew";
import { type DraftPhoto, uncaptioned } from "../../lib/photo-draft";
import type { RecordPhotos } from "../../model/use-record-photos";
import { PhotoPreview } from "./photo-preview";
import { RecordBlock } from "./record-block";

type PhotoPickerProps = {
  photos: RecordPhotos;
  /** 저장된 사진의 키 → 읽기 주소 */
  urls: Readonly<Record<string, string>>;
  /** 오프라인 — 사진을 고칠 수 없다고 알리고 막는다 */
  offline: boolean;
  /** 저장 중 — 막기만 한다 */
  saving: boolean;
  /** 10장을 넘게 골랐다 */
  onOverflow: () => void;
  /** 일행이 있는 여행 — 라벨에 「함께 올려요」 */
  shared: boolean;
  /** 사진을 올린 사람(null = 나, 방금 고른 사진). 그리지 않을 때는 null */
  uploader: (userId: string | null) => CrewMember | null;
};

/**
 * 기록 창의 사진 — 「고르고 아래서 적기」. 썸네일 줄(56 · 가로 스크롤 · 끝에 「＋」) 아래 고른 사진을 크게 보이고 설명을 적는다.
 * 0장이면 큰 「사진 추가」 칸. 라벨 오른쪽 「3 / 10」, 설명 없는 사진이 있으면 「· 설명 없는 사진 N장」(막지 않는다).
 * 새로 고른 사진이 바로 골라진다. 오프라인에서는 보기만 한다(사진은 대기열에 넣지 않는다).
 * 사진은 일행이 함께 올린다 — 일행이 있으면 썸네일 왼쪽 위에 올린 사람 아바타, 큰 사진 칩에 이름
 */
export function PhotoPicker({
  photos,
  urls,
  offline,
  saving,
  onOverflow,
  shared,
  uploader,
}: PhotoPickerProps) {
  const input = useRef<HTMLInputElement>(null);
  const { draft, selected } = photos;
  const disabled = offline || saving;
  const missing = uncaptioned(draft);
  const pick = () => input.current?.click();
  const current = draft[selected] as DraftPhoto | undefined;
  const by = (d: DraftPhoto) => uploader(d.saved?.user_id ?? null);
  return (
    <RecordBlock
      label="사진"
      sub={shared ? "함께 올려요" : undefined}
      aside={
        <span
          className={cn("text-xs tabular-nums", missing > 0 ? "text-my-star-text" : "text-ink-350")}
        >
          {draft.length} / {VISIT_PHOTO_LIMIT}
          {missing > 0 && ` · 설명 없는 사진 ${missing}장`}
        </span>
      }
    >
      {offline && (
        <p className="text-xs text-ink-350">오프라인이에요. 사진은 연결되면 고칠 수 있어요</p>
      )}
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
          <span className="text-sm font-bold">사진 추가</span>
          <span className="text-xs text-ink-350">최대 {VISIT_PHOTO_LIMIT}장</span>
        </button>
      ) : (
        <>
          <ThumbStrip
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
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (photos.add([...(e.target.files ?? [])])) onOverflow();
          e.target.value = "";
        }}
      />
    </RecordBlock>
  );
}

type ThumbStripProps = {
  draft: readonly DraftPhoto[];
  urls: Readonly<Record<string, string>>;
  selected: number;
  /** 그 사진을 올린 사람. 그리지 않을 때는 null */
  by: (d: DraftPhoto) => CrewMember | null;
  onSelect: (index: number) => void;
  /** 「＋」 — 10장이거나 막혔으면 없다 */
  onAdd?: () => void;
};

/**
 * 썸네일 줄 — 56 · r10 · 사이 8, 고른 것은 흰 2 + 파랑 2 링, 설명이 있으면 오른쪽 아래 💬,
 * 올린 사람이 있으면 왼쪽 위 아바타 16(흰 테두리 1.5)
 */
function ThumbStrip({ draft, urls, selected, by, onSelect, onAdd }: ThumbStripProps) {
  return (
    <div className="-m-1 flex scrollbar-none gap-2 overflow-x-auto p-1">
      {draft.map((d, i) => (
        <button
          key={d.key}
          type="button"
          aria-label={thumbLabel(i, by(d))}
          aria-pressed={i === selected}
          onClick={() => onSelect(i)}
          className={cn(
            "relative size-14 shrink-0 overflow-hidden rounded-memo bg-surface-muted",
            i === selected && "shadow-[0_0_0_2px_#fff,0_0_0_4px_#3a8bff]",
          )}
        >
          {thumbSrc(d, urls) && (
            <img src={thumbSrc(d, urls)} alt="" className="size-full object-cover" />
          )}
          <Uploader person={by(d)} />
          {d.caption.trim() && (
            <span aria-hidden className="absolute right-0.5 bottom-0.5 text-[10px] leading-none">
              💬
            </span>
          )}
        </button>
      ))}
      {onAdd && (
        <button
          type="button"
          aria-label="사진 추가"
          onClick={onAdd}
          className="flex size-14 shrink-0 items-center justify-center rounded-memo border-[1.5px] border-dashed border-line-dashed text-xl text-ink-350"
        >
          ＋
        </button>
      )}
    </div>
  );
}

type UploaderProps = { person: CrewMember | null };

/** 썸네일 왼쪽 위의 올린 사람 아바타. 그릴 사람이 없으면 아무것도 없다 */
function Uploader({ person }: UploaderProps) {
  if (!person) return null;
  return (
    <Avatar className="absolute top-0.75 left-0.75 size-4 border-[1.5px] border-white bg-white">
      <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
      <AvatarFallback className="text-[7px] font-extrabold">
        {person.name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}

/** 썸네일 버튼의 이름 — 「사진 2 · 김동규」 */
function thumbLabel(i: number, person: CrewMember | null): string {
  return person ? `사진 ${i + 1} · ${person.name}` : `사진 ${i + 1}`;
}

/** 썸네일 주소 — 새 사진은 미리보기, 저장된 사진은 썸네일 읽기 주소 */
function thumbSrc(d: DraftPhoto, urls: Readonly<Record<string, string>>): string | undefined {
  return d.preview ?? (d.saved ? urls[d.saved.thumb_key] : undefined);
}
