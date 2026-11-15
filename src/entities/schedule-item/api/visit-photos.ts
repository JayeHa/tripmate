import { postJson } from "@/shared/api/post-json";
import { createClient } from "@/shared/api/supabase/client";
import { compressImage } from "@/shared/lib/compress-image";

import {
  isVisitPhotoMime,
  VISIT_PHOTO_MAX_BYTES,
  VISIT_PHOTO_SIDE,
  VISIT_THUMB_SIDE,
} from "../lib/visit-photo-rules";
import type { VisitPhoto } from "../model/visit-photo";

/** 화면에 그대로 보여 줄 사진 오류 — 받지 않는 사진 · 너무 큰 사진 */
export class VisitPhotoError extends Error {}

/** 서명 주소 라우트를 부른다 — 저장소는 서버가 정한다(지금 Supabase Storage, 최종 R2) */
function callPhotos<T>(body: Record<string, unknown>): Promise<T> {
  return postJson<T>("/api/visit-photos", body, "사진을 처리하지 못했어요");
}

/** 여행의 기록 사진 줄 전부(일행 것까지) */
export async function fetchVisitPhotos(tripId: string): Promise<VisitPhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("visit_photos").select("*").eq("trip_id", tripId);
  if (error) throw error;
  return data;
}

/** 키마다 잠깐 볼 수 있는 주소 */
export async function fetchVisitPhotoUrls(
  tripId: string,
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  return (await callPhotos<{ urls: Record<string, string> }>({ action: "read", tripId, keys }))
    .urls;
}

/** 파일 하나를 저장소에 올린다 — 서명 주소를 받아 그 주소로 PUT. 키를 돌려준다 */
async function uploadFile(tripId: string, file: Blob): Promise<string> {
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
export async function removeVisitPhotoFiles(tripId: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await callPhotos({ action: "remove", tripId, keys }).catch(() => undefined);
}

/** 올린 사진 하나의 두 키 */
export type VisitPhotoKeys = { photo_key: string; thumb_key: string };

/** 줄 하나에 붙는 파일 값 — 사진이면 영상 칸 셋이 null, 영상이면 사진 키 둘이 표지 */
export type VisitMediaKeys = Pick<
  VisitPhoto,
  "photo_key" | "thumb_key" | "video_key" | "duration" | "poster_at"
>;

/**
 * 고른 사진 → 줄인 사진(긴 변 1600) + 썸네일(긴 변 192)을 올리고 두 키를 돌려준다. 줄은 아직 없다(`insertVisitPhoto`).
 * 줄인 결과가 받는 종류가 아니면(브라우저가 못 읽는 HEIC 등) 받지 않는다. 하나만 올라갔으면 그것을 지우고 던진다
 */
export async function uploadVisitPhoto(tripId: string, file: File): Promise<VisitPhotoKeys> {
  const [photo, thumb] = await Promise.all([
    compressImage(file, VISIT_PHOTO_SIDE),
    compressImage(file, VISIT_THUMB_SIDE),
  ]);
  if (!isVisitPhotoMime(photo.type) || !isVisitPhotoMime(thumb.type)) {
    throw new VisitPhotoError("이 형식은 올릴 수 없어요 (JPG · PNG · WebP)");
  }
  if (photo.size > VISIT_PHOTO_MAX_BYTES) throw new VisitPhotoError("사진이 너무 커요 (5MB 까지)");
  const [p, t] = await Promise.allSettled([uploadFile(tripId, photo), uploadFile(tripId, thumb)]);
  if (p.status === "fulfilled" && t.status === "fulfilled") {
    return { photo_key: p.value, thumb_key: t.value };
  }
  await removeVisitPhotoFiles(
    tripId,
    [p, t].flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
  );
  throw [p, t].find((r) => r.status === "rejected")?.reason;
}

/**
 * 올려 둔 키를 줄로 붙이고 그 줄을 돌려준다(영상이면 원본 키 · 길이 · 표지 지점까지). 올린 사람은 DB 기본값이 나로 채운다(사람 id 를 보내지 않는다).
 * 실패해도 파일은 지우지 않는다 — 부르는 쪽이 올린 파일을 함께 정리한다
 */
export async function insertVisitPhoto(
  v: { tripId: string; itemId: string; caption: string | null; position: number } & VisitMediaKeys,
): Promise<VisitPhoto> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("visit_photos")
    .insert({
      item_id: v.itemId,
      trip_id: v.tripId,
      caption: v.caption,
      position: v.position,
      photo_key: v.photo_key,
      thumb_key: v.thumb_key,
      video_key: v.video_key,
      duration: v.duration,
      poster_at: v.poster_at,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 사진 설명을 바꾼다(null = 지우기) — 일행이 올린 사진도 고친다 */
export async function updateVisitPhotoCaption(id: string, caption: string | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("visit_photos").update({ caption }).eq("id", id);
  if (error) throw error;
}

/** 사진 줄만 지운다(일행이 올린 사진도). 이미 없으면 그대로 끝낸다 — 파일은 부르는 쪽이 줄을 지운 뒤 지운다(버킷은 붙은 줄이 없는 파일만 지운다) */
export async function deleteVisitPhotoRow(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("visit_photos").delete().eq("id", id);
  if (error) throw error;
}
