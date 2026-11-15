/* eslint-disable @next/next/no-img-element -- 서명 주소 · 미리보기(object URL) 사진이라 이미지 최적화를 거치지 않는다 */
import { videoClock } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { CrewMember } from "../../lib/crew";
import type { DraftPhoto } from "../../lib/photo-draft";

type PhotoThumbsProps = {
  draft: readonly DraftPhoto[];
  /** 저장된 사진의 키 → 읽기 주소 */
  urls: Readonly<Record<string, string>>;
  selected: number;
  /** 그것을 올린 사람. 그리지 않을 때는 null */
  by: (d: DraftPhoto) => CrewMember | null;
  onSelect: (index: number) => void;
  /** 「＋」 — 10개이거나 막혔으면 없다 */
  onAdd?: () => void;
};

/**
 * 썸네일 줄 — 56 · r10 · 사이 8, 고른 것은 흰 2 + 파랑 2 링, 설명이 있으면 왼쪽 아래 💬,
 * 올린 사람이 있으면 왼쪽 위 아바타 16(흰 테두리 1.5). 영상은 표지 가운데 ▶(22) + 오른쪽 아래 길이
 */
export function PhotoThumbs({ draft, urls, selected, by, onSelect, onAdd }: PhotoThumbsProps) {
  return (
    <div className="-m-1 flex scrollbar-none gap-2 overflow-x-auto p-1">
      {draft.map((d, i) => (
        <button
          key={d.key}
          type="button"
          aria-label={thumbLabel(d, i, by(d))}
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
          {d.video && <VideoMark duration={d.video.duration} />}
          <Uploader person={by(d)} />
          {d.caption.trim() && (
            <span aria-hidden className="absolute bottom-0.75 left-0.75 text-[9px]/none">
              💬
            </span>
          )}
        </button>
      ))}
      {onAdd && (
        <button
          type="button"
          aria-label="사진 · 영상 추가"
          onClick={onAdd}
          className="flex size-14 shrink-0 items-center justify-center rounded-memo border-[1.5px] border-dashed border-line-dashed text-xl text-ink-350"
        >
          ＋
        </button>
      )}
    </div>
  );
}

type VideoMarkProps = { duration: number };

/** 영상 썸네일 표시 — 가운데 ▶(22 · 어두운 원) + 오른쪽 아래 길이 「0:12」 */
function VideoMark({ duration }: VideoMarkProps) {
  return (
    <>
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 flex size-5.5 -translate-1/2 items-center justify-center rounded-full bg-[rgba(17,17,17,.55)] pl-0.5 text-[9px] text-white"
      >
        ▶
      </span>
      <span className="absolute right-0.75 bottom-0.75 rounded-tag bg-[rgba(17,17,17,.7)] px-0.75 text-[8px]/[13px] font-extrabold text-white tabular-nums">
        {videoClock(duration)}
      </span>
    </>
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

/** 썸네일 버튼의 이름 — 「사진 2 · 김동규」 · 「영상 3」 */
function thumbLabel(d: DraftPhoto, i: number, person: CrewMember | null): string {
  const name = `${d.video ? "영상" : "사진"} ${i + 1}`;
  return person ? `${name} · ${person.name}` : name;
}

/** 썸네일 주소 — 새 사진은 미리보기(영상은 표지), 저장된 사진은 썸네일 읽기 주소 */
function thumbSrc(d: DraftPhoto, urls: Readonly<Record<string, string>>): string | undefined {
  return d.preview ?? (d.saved ? urls[d.saved.thumb_key] : undefined);
}
