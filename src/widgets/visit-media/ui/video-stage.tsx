/* eslint-disable @next/next/no-img-element -- 서명 주소 · 미리보기(object URL) 표지라 이미지 최적화를 거치지 않는다 */
"use client";

import { useEffect, useRef, useState } from "react";

import { fetchVisitVideoUrl, videoClock } from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

export type VideoStageProps = {
  tripId: string;
  /** 표지 주소. 아직 없으면 회색 칸 */
  poster: string | undefined;
  alt: string;
  /** 길이 · 표지 지점(초) */
  duration: number;
  posterAt: number;
  /** 새 영상을 바로 재생할 주소(object URL). 저장된 영상은 null */
  localSrc: string | null;
  /** 저장된 영상의 원본 키 — 처음 재생할 때 읽기 주소를 받는다. 아직 올리지 않은 영상은 null */
  videoKey: string | null;
  /** 읽는 화면(기록 자세히 보기) — **소리를 켜고** 재생하고, ▶ 가 58 이고, 「표지 0:01」 이 없다. 기본은 기록 창(소리 없이) */
  reader?: boolean;
  /** 여러 영상 가운데 이 영상의 차례인가(기본 true). false 가 되면 표지로 돌아간다 — 한 번에 하나만 재생하게 */
  active?: boolean;
  /** 재생하려고 눌렀다 — 부모가 이 영상을 차례로 삼는다(다른 영상이 꺼진다) */
  onActivate?: () => void;
};

/** 멈춤(표지) → 받는 중(저장된 영상의 읽기 주소) → 재생 ↔ 잠깐 멈춤. 끝까지 보면 다시 표지 */
type Phase = "idle" | "loading" | "playing" | "paused";

const BADGE =
  "pointer-events-none absolute bottom-2.5 h-5.5 rounded-pill-sm px-1.75 text-[11px]/5.5";

/**
 * 큰 칸의 영상 — 표지 위 가운데 ▶(56), 오른쪽 아래 길이, 왼쪽 아래 「표지 0:01」. 누르면 **소리 없이** 재생하고 다시 누르면 멈춘다.
 * 재생하는 동안은 아래에 진행 줄(❚❚ · 줄 · 「0:05 / 0:12」 · 🔇). 부모의 relative 칸을 꽉 채운다.
 * 읽는 화면(reader)은 소리를 켜고 재생한다(🔊) — 브라우저가 소리 있는 재생을 막으면 멈춘 채로 ▶ 를 보이고, 한 번 더 누르면 재생된다
 * (주소를 받는 동안 누른 것으로 쳐 주는 시간이 지날 수 있다. 다시 누르면 그 자리에서 바로 재생해 막히지 않는다).
 * 저장된 영상의 주소는 처음 누를 때 받는다 — 받지 못하거나(오프라인) 이 브라우저가 재생하지 못하면(코덱) 왼쪽 아래에 알린다.
 * 다른 영상으로 바뀌면 key 로 새로 그린다(재생 상태를 물려받지 않게)
 */
export function VideoStage({
  tripId,
  poster,
  alt,
  duration,
  posterAt,
  localSrc,
  videoKey,
  reader = false,
  active = true,
  onActivate,
}: VideoStageProps) {
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(localSrc);
  const [phase, setPhase] = useState<Phase>("idle");
  const [time, setTime] = useState(0);
  const [fail, setFail] = useState<string | null>(null);
  // 차례가 아니면 표지 — 그동안 받던 주소가 와도 재생하지 않고, 다시 누르면 처음부터 재생한다
  const shown: Phase = active ? phase : "idle";
  const on = src !== null && (shown === "playing" || shown === "paused");

  // 영상이 그려지면 재생한다. 막히면(소리 있는 재생) 멈춘 것으로 — ▶ 가 보이고 다시 누르면 재생된다
  useEffect(() => {
    if (!on) return;
    void video.current?.play().catch(() => setPhase((p) => (p === "playing" ? "paused" : p)));
  }, [on]);

  /** 누르면 재생 ↔ 멈춤. 저장된 영상은 처음에 읽기 주소부터 받는다 */
  function toggle() {
    const el = video.current;
    if (el) {
      if (el.paused) void el.play().catch(() => undefined);
      else el.pause();
      return;
    }
    onActivate?.();
    if (phase === "loading") return;
    setFail(null);
    setTime(0);
    if (src !== null) return setPhase("playing");
    if (videoKey === null) return;
    setPhase("loading");
    fetchVisitVideoUrl(tripId, videoKey).then(
      (url) => {
        setSrc(url);
        setPhase("playing");
      },
      () => stop("영상을 불러오지 못했어요"),
    );
  }

  /** 표지로 돌아간다 — 알릴 것이 있으면 왼쪽 아래에 */
  function stop(text: string | null) {
    setPhase("idle");
    setTime(0);
    setFail(text);
  }

  return (
    <>
      {on ? (
        <video
          ref={video}
          src={src}
          poster={poster}
          muted={!reader}
          playsInline
          aria-label={alt}
          onPlay={() => setPhase("playing")}
          onPause={() => setPhase("paused")}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onEnded={() => stop(null)}
          onError={() => stop("이 기기에서는 재생할 수 없는 영상이에요")}
          className="size-full object-cover"
        />
      ) : (
        poster && <img src={poster} alt={alt} className="size-full object-cover" />
      )}
      <button
        type="button"
        aria-label={shown === "playing" ? "영상 멈춤" : "영상 재생"}
        aria-busy={shown === "loading"}
        onClick={toggle}
        className="absolute inset-0 flex items-center justify-center"
      >
        {shown !== "playing" && (
          <span
            aria-hidden
            className={cn(
              "flex size-14 items-center justify-center rounded-full bg-[rgba(17,17,17,.55)] pl-1 text-xl text-white",
              reader && "size-14.5",
            )}
          >
            ▶
          </span>
        )}
      </button>
      {on ? (
        <PlayBar playing={shown === "playing"} time={time} duration={duration} sound={reader} />
      ) : (
        <>
          {(fail !== null || !reader) && (
            <span className={`${BADGE} left-2.5 bg-white/88 font-bold text-ink-700`}>
              {fail ?? `표지 ${videoClock(posterAt)}`}
            </span>
          )}
          <span
            className={`${BADGE} right-2.5 bg-[rgba(17,17,17,.7)] font-extrabold text-white tabular-nums`}
          >
            {videoClock(duration)}
          </span>
        </>
      )}
    </>
  );
}

type PlayBarProps = { playing: boolean; time: number; duration: number; sound: boolean };

/** 재생 중 아래 줄 — ❚❚(멈췄으면 ▶) · 진행 줄(3) · 「0:05 / 0:12」 · 🔇(소리를 켰으면 🔊). 누르는 것은 칸 전체라 여기는 보기만 한다 */
function PlayBar({ playing, time, duration, sound }: PlayBarProps) {
  const done = Math.min(100, (time / duration) * 100);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-2 bg-linear-to-b from-transparent to-[rgba(17,17,17,.55)] px-3 py-2.5 text-xs text-white">
      <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
      <span className="h-0.75 flex-1 overflow-hidden rounded-full bg-white/40">
        <span className="block h-full bg-white" style={{ width: `${done}%` }} />
      </span>
      <span className="text-[11px] font-bold tabular-nums">
        {videoClock(time)} / {videoClock(duration)}
      </span>
      <span aria-hidden>{sound ? "🔊" : "🔇"}</span>
    </div>
  );
}
