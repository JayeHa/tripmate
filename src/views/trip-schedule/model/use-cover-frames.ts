"use client";

import { useEffect, useState } from "react";

import { fetchVisitVideoUrl, readVisitCoverFrames } from "@/entities/schedule-item";

/** 표지 고르기의 장면 하나 — 지점(초) · JPEG · 볼 주소(object URL) */
export type CoverFrame = { at: number; frame: Blob; url: string };

/** 장면 읽기 — 읽는 중 · 다 읽음 · 못 읽음(주소를 받지 못했거나 이 브라우저가 못 읽는 영상) */
export type CoverFrames =
  { state: "loading" } | { state: "ready"; frames: CoverFrame[] } | { state: "failed" };

/**
 * 표지 고르기 창이 열려 있는 동안 그 영상의 장면 8개를 읽는다 — 마운트할 때 한 번 읽고, 사라질 때 볼 주소를 놓는다.
 * 새 영상은 고른 파일(localSrc)을 바로, 저장된 영상은 읽기 주소를 받아(다른 출처라 crossOrigin) 읽는다
 */
export function useCoverFrames(
  tripId: string,
  localSrc: string | null,
  videoKey: string | null,
): CoverFrames {
  const [result, setResult] = useState<CoverFrames>({ state: "loading" });
  useEffect(() => {
    let alive = true;
    const urls: string[] = [];
    /** 주소를 정하고 장면을 읽는다. 창이 그새 사라졌으면 버린다 */
    async function load(): Promise<CoverFrames> {
      const src = localSrc ?? (videoKey && (await fetchVisitVideoUrl(tripId, videoKey)));
      if (!src) return { state: "failed" };
      const read = await readVisitCoverFrames(src, localSrc === null);
      if (!read || !alive) return { state: "failed" };
      const frames = read.frames.map(({ at, frame }) => {
        const url = URL.createObjectURL(frame);
        urls.push(url);
        return { at, frame, url };
      });
      return { state: "ready", frames };
    }
    void load()
      .catch((): CoverFrames => ({ state: "failed" }))
      .then((r) => alive && setResult(r));
    return () => {
      alive = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [tripId, localSrc, videoKey]);
  return result;
}
