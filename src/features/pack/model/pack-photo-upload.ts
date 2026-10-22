import {
  isPackPhotoMime,
  PACK_PHOTO_MAX_BYTES,
  PACK_PHOTO_SIDE,
  PACK_THUMB_SIDE,
  type PackPhoto,
  removePackPhotoFiles,
  uploadPackPhotoFile,
} from "@/entities/pack";
import { ApiError } from "@/shared/api/post-json";
import { compressImage } from "@/shared/lib/compress-image";

/** 화면에 그대로 보여 줄 사진 오류 — 받지 않는 사진 · 너무 큰 사진 */
class PhotoError extends Error {}

/**
 * 고른 사진 → 줄인 사진(긴 변 1600) + 목록 썸네일(긴 변 192)을 올리고 두 키를 돌려준다. 항목에는 아직 붙지 않는다.
 * 브라우저가 못 읽는 사진(예: Chrome 의 HEIC)은 줄이지 못해 받지 않는다. 하나만 올라갔으면 그것을 지우고 던진다
 */
export async function uploadPackPhoto(tripId: string, file: File): Promise<PackPhoto> {
  const [photo, thumb] = await Promise.all([
    compressImage(file, PACK_PHOTO_SIDE),
    compressImage(file, PACK_THUMB_SIDE),
  ]);
  if (!isPackPhotoMime(photo.type) || !isPackPhotoMime(thumb.type)) {
    throw new PhotoError("이 사진은 열 수 없어요. JPG · PNG 로 올려 주세요");
  }
  if (photo.size > PACK_PHOTO_MAX_BYTES) throw new PhotoError("사진이 너무 커요 (5MB 까지)");
  const [p, t] = await Promise.allSettled([
    uploadPackPhotoFile(tripId, photo),
    uploadPackPhotoFile(tripId, thumb),
  ]);
  if (p.status === "fulfilled" && t.status === "fulfilled") {
    return { photo_key: p.value, thumb_key: t.value };
  }
  await removePackPhotoFiles(
    tripId,
    [p, t].flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
  );
  throw [p, t].find((r) => r.status === "rejected")?.reason;
}

/** 올리기 실패 토스트 — 우리가 만든 문구(받지 않는 사진 · 서버 문구)는 그대로, 아니면 다시 해 보라고만 */
export function photoErrorText(e: unknown): string {
  if (e instanceof PhotoError || e instanceof ApiError) return e.message;
  return "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요";
}
