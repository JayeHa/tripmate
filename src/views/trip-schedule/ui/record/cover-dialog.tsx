/* eslint-disable @next/next/no-img-element -- 서명 주소 · 미리보기(object URL) 장면이라 이미지 최적화를 거치지 않는다 */
"use client";

import { useState } from "react";

import { videoClock, VISIT_COVER_FRAMES } from "@/entities/schedule-item";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

import { type CoverFrame, useCoverFrames } from "../../model/use-cover-frames";

/** 표지를 고를 영상 — 화면 key · 길이 · 지금 표지(주소 · 초) · 읽을 곳(새 영상은 고른 파일, 저장된 영상은 원본 키) */
export type CoverTarget = {
  key: string;
  duration: number;
  posterAt: number;
  poster: string | undefined;
  localSrc: string | null;
  videoKey: string | null;
};

type CoverDialogProps = {
  tripId: string;
  /** 연 영상. null 이면 닫힌다 */
  target: CoverTarget | null;
  onClose: () => void;
  /** 「완료」 — 고른 장면(초 · JPEG). 고르지 않았으면 부르지 않는다 */
  onPick: (key: string, at: number, frame: Blob) => void;
};

/**
 * 표지 고르기 — 기록 창 위에 겹치는 창(모바일 바텀시트 · PC 가운데 480). 머리 「취소 · 표지 고르기 · 완료」 →
 * 큰 미리보기(250) + 왼쪽 아래 「0:02 / 0:12」 → 필름 띠 8칸(58, 고른 칸 파랑 3 안쪽 테두리 · 나머지 .75) → 슬라이더(0–7) → 안내.
 * 고르지 않으면 지금 표지 그대로다. 장면은 열 때 영상에서 읽는다
 */
export function CoverDialog({ tripId, target, onClose, onPick }: CoverDialogProps) {
  const open = target !== null;
  const shown = useHeldWhileClosing(open, target);
  const openCount = useOpenCount(open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        forceOverlay
        className="top-auto bottom-0 left-0 flex w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none rounded-t-sheet bg-white p-0 ring-0 sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:w-120 lg:max-w-120 lg:-translate-1/2 lg:rounded-[16px] lg:shadow-[0_12px_40px_rgba(0,0,0,.2)]"
      >
        {shown && (
          <CoverPicker
            key={openCount}
            tripId={tripId}
            target={shown}
            onClose={onClose}
            onPick={(at, frame) => onPick(shown.key, at, frame)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CoverPickerProps = {
  tripId: string;
  target: CoverTarget;
  onClose: () => void;
  onPick: (at: number, frame: Blob) => void;
};

/** 표지 고르기 창의 내용 — 열 때마다 새로 그려 장면을 다시 읽는다 */
function CoverPicker({ tripId, target, onClose, onPick }: CoverPickerProps) {
  const read = useCoverFrames(tripId, target.localSrc, target.videoKey);
  const frames = read.state === "ready" ? read.frames : null;
  const [pick, setPick] = useState<number | null>(null);
  const chosen = frames && pick !== null ? frames[pick] : null;
  const at = chosen?.at ?? target.posterAt;
  return (
    <div className="flex flex-col gap-3 px-5 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="text-[15px] font-bold text-route-card-meta"
        >
          취소
        </button>
        <DialogTitle className="text-[17px] font-extrabold text-ink-900">표지 고르기</DialogTitle>
        <button
          type="button"
          disabled={!frames}
          onClick={() => {
            if (chosen) onPick(chosen.at, chosen.frame);
            onClose();
          }}
          className="text-[15px] font-extrabold text-action disabled:opacity-40"
        >
          완료
        </button>
      </div>
      <div className="relative h-62.5 overflow-hidden rounded-[14px] bg-surface-muted">
        {(chosen?.url ?? target.poster) && (
          <img
            src={chosen?.url ?? target.poster}
            alt="고른 표지"
            className="size-full object-cover"
          />
        )}
        <span className="absolute bottom-2.5 left-2.5 h-5.5 rounded-pill-sm bg-[rgba(17,17,17,.7)] px-1.75 text-[11px]/5.5 font-extrabold text-white tabular-nums">
          {videoClock(at)} / {videoClock(target.duration)}
        </span>
      </div>
      <FilmStrip frames={frames} pick={pick} onPick={setPick} />
      <input
        type="range"
        min={0}
        max={VISIT_COVER_FRAMES - 1}
        step={1}
        value={pick ?? nearest(frames, target.posterAt)}
        disabled={!frames}
        onChange={(e) => setPick(Number(e.target.value))}
        aria-label="표지 장면"
        className="w-full accent-action"
      />
      <p className="text-xs text-route-sub">
        {read.state === "failed"
          ? "영상을 불러오지 못했어요. 연결을 확인하고 다시 열어 주세요"
          : "영상에서 표지로 쓸 장면을 골라요 · 고르지 않으면 지금 표지 그대로"}
      </p>
    </div>
  );
}

type FilmStripProps = {
  frames: CoverFrame[] | null;
  pick: number | null;
  onPick: (index: number) => void;
};

/** 필름 띠 8칸(58) — 고른 칸은 파랑 3 안쪽 테두리, 나머지는 흐리게(.75). 읽는 동안은 빈 회색 칸 */
function FilmStrip({ frames, pick, onPick }: FilmStripProps) {
  if (!frames) {
    return (
      <div
        aria-hidden
        className="h-14.5 animate-pulse overflow-hidden rounded-memo bg-surface-muted"
      />
    );
  }
  return (
    <div className="flex h-14.5 overflow-hidden rounded-memo">
      {frames.map((f, i) => (
        <button
          key={f.url}
          type="button"
          aria-label={`${videoClock(f.at)} 장면`}
          aria-pressed={i === pick}
          onClick={() => onPick(i)}
          className={cn("relative min-w-0 flex-1", i !== pick && "opacity-75")}
        >
          <img src={f.url} alt="" className="size-full object-cover" />
          {i === pick && <span className="absolute inset-0 border-3 border-action" />}
        </button>
      ))}
    </div>
  );
}

/** 지금 표지 지점에 가장 가까운 칸 — 슬라이더의 처음 자리. 장면이 없으면 0 */
function nearest(frames: CoverFrame[] | null, at: number): number {
  if (!frames) return 0;
  let best = 0;
  frames.forEach((f, i) => {
    if (Math.abs(f.at - at) < Math.abs(frames[best].at - at)) best = i;
  });
  return best;
}
