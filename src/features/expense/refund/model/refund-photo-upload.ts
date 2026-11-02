import {
  isRefundPhotoMime,
  REFUND_PHOTO_MAX_BYTES,
  REFUND_PHOTO_SIDE,
  REFUND_THUMB_SIDE,
  removeRefundPhotoFiles,
  uploadRefundPhotoFile,
} from "@/entities/tax-refund";
import { ApiError } from "@/shared/api/post-json";
import { saveErrorText } from "@/shared/api/sync";
import { compressImage } from "@/shared/lib/compress-image";

/** 화면에 그대로 보여 줄 사진 오류 — 받지 않는 사진 · 너무 큰 사진 · 장수 초과 */
export class RefundPhotoError extends Error {}

/**
 * 고른 사진 → 줄인 사진(긴 변 1600) + 썸네일(긴 변 192)을 올리고 두 키를 돌려준다. 줄은 아직 없다.
 * 줄인 결과가 받는 종류가 아니면(브라우저가 못 읽는 HEIC 등) 받지 않는다. 하나만 올라갔으면 그것을 지우고 던진다
 */
export async function uploadRefundPhoto(
  tripId: string,
  file: File,
): Promise<{ photo_key: string; thumb_key: string }> {
  const [photo, thumb] = await Promise.all([
    compressImage(file, REFUND_PHOTO_SIDE),
    compressImage(file, REFUND_THUMB_SIDE),
  ]);
  if (!isRefundPhotoMime(photo.type) || !isRefundPhotoMime(thumb.type)) {
    throw new RefundPhotoError("이 형식은 올릴 수 없어요 (JPG · PNG · WebP)");
  }
  if (photo.size > REFUND_PHOTO_MAX_BYTES)
    throw new RefundPhotoError("사진이 너무 커요 (5MB 까지)");
  const [p, t] = await Promise.allSettled([
    uploadRefundPhotoFile(tripId, photo),
    uploadRefundPhotoFile(tripId, thumb),
  ]);
  if (p.status === "fulfilled" && t.status === "fulfilled") {
    return { photo_key: p.value, thumb_key: t.value };
  }
  await removeRefundPhotoFiles(
    tripId,
    [p, t].flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
  );
  throw [p, t].find((r) => r.status === "rejected")?.reason;
}

/** 올리기 실패 토스트 — 우리가 만든 문구는 그대로, 장수 초과는 안내, 오프라인이면 그 안내, 아니면 다시 해 보라고만 */
export function refundPhotoErrorText(e: unknown): string {
  if (e instanceof RefundPhotoError) return e.message;
  // 서버에 닿지 못했으면(0) 오프라인 안내로 — 그 밖의 서버 문구는 그대로
  if (e instanceof ApiError && e.status !== 0) return e.message;
  if (e instanceof Error && /refund photo limit/.test(e.message))
    return "사진은 6장까지 붙일 수 있어요";
  return saveErrorText(e, "사진을 올리지 못했어요. 잠시 후 다시 시도해 주세요");
}
