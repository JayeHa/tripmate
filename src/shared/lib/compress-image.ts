/** 긴 변의 최대 길이(px) — 영수증 글씨가 읽히는 정도. 1~2MB 사진이 200~300KB 로 준다 */
const MAX_SIDE = 2000;
/** JPEG 품질 */
const QUALITY = 0.82;

/** 긴 변이 max 를 넘으면 비율을 지켜 줄인 크기, 아니면 그대로 */
export function fitSize(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/**
 * 사진을 줄여 JPEG 으로 — 긴 변 2000px. 브라우저가 그 사진을 못 읽으면(예: Chrome 의 HEIC) 원본 그대로 돌려준다.
 * 줄인 결과가 원본보다 크면 원본. PDF · 사진이 아닌 파일도 그대로
 */
export async function compressImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const { width, height } = fitSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  // 투명한 PNG 를 JPEG 으로 바꾸면 비친 곳이 검게 된다 — 흰 바탕을 먼저 깐다
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY),
  );
  return blob && blob.size < file.size ? blob : file;
}
