import { fitSize } from "@/shared/lib/compress-image";

import { canvasBlob, releaseCanvas } from "./canvas";

/** 썸네일 긴 변(px) — 목록 48 · 상세 132 칸을 3배 화면에서도 또렷하게 */
export const THUMB_SIDE = 400;

/**
 * 사진 · 그림 → 목록 썸네일(JPEG, 긴 변 400). 브라우저가 읽지 못하는 사진(예: Chrome 의 HEIC)이면 null —
 * 목록은 아이콘으로 그린다
 */
export async function makeThumbnail(source: Blob): Promise<Blob | null> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(source);
  } catch {
    return null;
  }
  const { width, height } = fitSize(bitmap.width, bitmap.height, THUMB_SIDE);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // 투명한 곳이 JPEG 에서 검게 되지 않게 흰 바탕을 먼저 깐다
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await canvasBlob(canvas, "image/jpeg", 0.82);
  releaseCanvas(canvas);
  return blob;
}
