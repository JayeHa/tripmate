// 타입만 — 번들에는 아래 동적 import 로만 들어간다
import type { PDFPageProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

import { parsePages } from "@/entities/voucher";

import { canvasBlob, releaseCanvas } from "./canvas";

/** 현장용 페이지 그림의 폭(px) — 휴대폰 전체 화면(390pt × 3)보다 넉넉해 QR · 바코드가 또렷하다. A4 면 1600 × 2263 */
export const PAGE_WIDTH = 1600;
/** 그림의 긴 변 최대(px) — iOS Safari 캔버스 한도(4096²) 안에서 아주 긴 페이지도 그려지게 */
export const PAGE_MAX_SIDE = 4096;

/** 페이지 크기(pt, 배율 1) → 그릴 배율. 폭을 PAGE_WIDTH 로 맞추되 긴 변이 PAGE_MAX_SIDE 를 넘지 않게 */
export function pageScale(width: number, height: number): number {
  return Math.min(PAGE_WIDTH / width, PAGE_MAX_SIDE / Math.max(width, height));
}

/**
 * PDF 의 현장용 페이지(「1, 3」, parsePages)를 PNG 그림으로 — 적은 순서대로, 한 장씩 그려 메모리를 아낀다.
 * pdf.js(legacy 빌드 — 기본 빌드는 우리 지원 브라우저 밖 API 를 쓴다)는 여기서만 불러온다. 워커 · 글꼴 표 · 기본 글꼴은
 * `public/pdfjs/{버전}/`(scripts/copy-pdfjs.mjs). 글꼴이 안 들어 있는 PDF 는 기기 글꼴로 그린다.
 * 읽지 못하는 PDF(암호 · 깨짐) · 그리기 실패는 던진다 — 부르는 쪽이 그림 없이 원본만 저장한다
 */
export async function renderPdfPages(file: Blob, pages: string): Promise<Blob[]> {
  const task = await loadPdf(file);
  try {
    const doc = await task.promise;
    const out: Blob[] = [];
    for (const n of parsePages(pages, doc.numPages)) {
      out.push(await renderPage(await doc.getPage(n)));
    }
    return out;
  } finally {
    // 문서와 워커를 함께 정리한다 — 6.x 의 문서(PDFDocumentProxy)에는 destroy 가 없고 불러오기 작업에 있다
    void task.destroy();
  }
}

/** pdf.js 로 PDF 를 연다(불러오기 작업). 다 쓰면 부른 쪽이 task.destroy() — 문서와 워커를 함께 정리한다 */
async function loadPdf(file: Blob) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const base = `/pdfjs/${pdfjs.version}/`;
  pdfjs.GlobalWorkerOptions.workerSrc = `${base}pdf.worker.min.mjs`;
  return pdfjs.getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    cMapUrl: `${base}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}standard_fonts/`,
    wasmUrl: `${base}wasm/`,
    iccUrl: `${base}iccs/`,
  });
}

/** 열어 둔 PDF — 쪽마다 크기(pt, 그리기 전 자리 잡기용), 한 쪽씩 그림으로, 다 보면 닫는다 */
export type OpenedPdf = {
  sizes: { width: number; height: number }[];
  /** n 쪽(1부터)을 현장용 페이지와 같은 크기의 흰 바탕 PNG 로 */
  render: (n: number) => Promise<Blob>;
  close: () => void;
};

/**
 * PDF 를 열어 쪽 수와 쪽마다 크기를 읽는다 — 뷰어의 「PDF 전체 보기」 가 그리기 전에 자리를 잡고 한 쪽씩 그린다.
 * 읽지 못하는 PDF(암호 · 깨짐)는 던진다
 */
export async function openPdf(file: Blob): Promise<OpenedPdf> {
  const task = await loadPdf(file);
  try {
    const doc = await task.promise;
    const sizes = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const { width, height } = (await doc.getPage(n)).getViewport({ scale: 1 });
      sizes.push({ width, height });
    }
    return {
      sizes,
      render: async (n) => renderPage(await doc.getPage(n)),
      close: () => void task.destroy(),
    };
  } catch (e) {
    void task.destroy();
    throw e;
  }
}

/** 한 페이지를 흰 바탕 PNG 로 */
async function renderPage(page: PDFPageProxy): Promise<Blob> {
  const size = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: pageScale(size.width, size.height) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvas, viewport }).promise;
  page.cleanup();
  const blob = await canvasBlob(canvas, "image/png");
  releaseCanvas(canvas);
  if (!blob) throw new Error("page image");
  return blob;
}
