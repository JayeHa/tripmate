import { postJson } from "@/shared/api/post-json";

import type { PackPhoto } from "../lib/photo-rules";

/** 서명 주소 라우트를 부른다 — 저장소는 서버가 정한다(지금 Supabase Storage, 최종 R2) */
function callPhotos<T>(body: Record<string, unknown>): Promise<T> {
  return postJson<T>("/api/pack-photos", body, "사진을 처리하지 못했어요");
}

/** 키마다 잠깐 볼 수 있는 주소 */
export async function fetchPackPhotoUrls(
  tripId: string,
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  return (await callPhotos<{ urls: Record<string, string> }>({ action: "read", tripId, keys }))
    .urls;
}

/** 파일 하나를 저장소에 올린다 — 서명 주소를 받아 그 주소로 PUT. 키를 돌려준다(항목에는 아직 붙지 않는다) */
export async function uploadPackPhotoFile(tripId: string, file: Blob): Promise<string> {
  const { key, url } = await callPhotos<{ key: string; url: string }>({
    action: "upload",
    tripId,
    mime: file.type,
    size: file.size,
  });
  const put = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`upload ${put.status}`);
  return key;
}

/** 저장소의 파일을 지운다 — 실패해도 던지지 않는다(남은 파일은 따로 정리한다, #155) */
export async function removePackPhotoFiles(tripId: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await callPhotos({ action: "remove", tripId, keys }).catch(() => undefined);
}

/** 항목 사진(사진 · 썸네일)의 파일을 지운다. null 은 건너뛴다 */
export function removePackPhotos(
  tripId: string,
  photos: readonly (PackPhoto | null)[],
): Promise<void> {
  return removePackPhotoFiles(
    tripId,
    photos.flatMap((p) => (p ? [p.photo_key, p.thumb_key] : [])),
  );
}
