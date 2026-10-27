"use client";

import { useEffect, useState } from "react";

import { type OpenedPdf, openPdf } from "../lib/pdf-pages";
import { downloadOriginal } from "./voucher-files";

/** 「PDF 전체 보기」 의 상태 — 받는 중 · 실패 · 쪽마다 그림(아직 못 그린 쪽은 null) */
export type PdfAllPages =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; sizes: { width: number; height: number }[]; images: (string | null)[] };

/**
 * 바우처 원본 PDF 의 모든 쪽 — 원본을 앱 안으로 받아(기기에 저장하지 않는다) 쪽 수 · 크기를 먼저 알리고, 앞에서부터 한 쪽씩 그려 채운다.
 * 한 번에 캔버스 하나만 쓰고 그림(PNG)으로 바꿔 두어, 쪽이 많은 스캔 PDF 도 메모리가 넘치지 않는다(iOS Safari 캔버스 한도).
 * 화면을 떠나면 그리기를 멈추고 문서 · 그림 주소를 정리한다. 원본과 pdf.js 는 오프라인에 저장하지 않아 오프라인이면 실패한다
 */
export function usePdfAllPages(tripId: string, fileKey: string) {
  const [state, setState] = useState<PdfAllPages>({ status: "loading" });
  // 「다시 시도」 를 누를 때마다 바뀌어 처음부터 다시 받는다
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stopped = false;
    let pdf: OpenedPdf | null = null;
    const urls: string[] = [];
    /** 받고 열고 한 쪽씩 그린다 — 화면을 떠났으면 멈춘다 */
    async function run() {
      const opened = await openPdf(await downloadOriginal(tripId, fileKey));
      pdf = opened;
      if (stopped) return opened.close();
      const { sizes } = opened;
      setState({ status: "ready", sizes, images: sizes.map(() => null) });
      for (let i = 0; i < sizes.length && !stopped; i++) {
        const image = await opened.render(i + 1);
        // 그리는 동안 화면을 떠났으면 주소를 만들지 않는다 — 정리가 이미 끝나 풀리지 않는다
        if (stopped) return;
        const url = URL.createObjectURL(image);
        urls.push(url);
        setState((s) => (s.status === "ready" ? { ...s, images: s.images.with(i, url) } : s));
      }
    }
    run().catch(() => {
      if (!stopped) setState({ status: "failed" });
    });
    return () => {
      stopped = true;
      pdf?.close();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [tripId, fileKey, attempt]);

  return {
    state,
    /** 실패한 뒤 「다시 시도」 */
    retry: () => {
      setState({ status: "loading" });
      setAttempt((a) => a + 1);
    },
  };
}
