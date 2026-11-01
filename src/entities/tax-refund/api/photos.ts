import { postJson } from "@/shared/api/post-json";
import { createClient } from "@/shared/api/supabase/client";

import type { TaxRefundPhoto } from "../model/types";

/** 서명 주소 라우트를 부른다 — 저장소는 서버가 정한다(지금 Supabase Storage, 최종 R2) */
function callPhotos<T>(body: Record<string, unknown>): Promise<T> {
  return postJson<T>("/api/refund-photos", body, "사진을 처리하지 못했어요");
}

/** 여행의 환급 사진 줄 — 올린 순 */
export async function fetchRefundPhotos(tripId: string): Promise<TaxRefundPhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tax_refund_photos")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 키마다 잠깐 볼 수 있는 주소 */
export async function fetchRefundPhotoUrls(
  tripId: string,
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  return (await callPhotos<{ urls: Record<string, string> }>({ action: "read", tripId, keys }))
    .urls;
}

/** 파일 하나를 저장소에 올린다 — 서명 주소를 받아 그 주소로 PUT. 키를 돌려준다(줄은 아직 없다) */
export async function uploadRefundPhotoFile(tripId: string, file: Blob): Promise<string> {
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
export async function removeRefundPhotoFiles(tripId: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await callPhotos({ action: "remove", tripId, keys }).catch(() => undefined);
}

/** 사진 줄을 넣는다 — 올린 두 키를 그 기록에 붙인다 */
export async function addRefundPhoto(
  tripId: string,
  row: Pick<TaxRefundPhoto, "refund_id" | "kind" | "photo_key" | "thumb_key">,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tax_refund_photos").insert({ trip_id: tripId, ...row });
  if (error) throw error;
}

/** 기록 하나의 사진 키(사진 · 썸네일) — 기록을 지우기 전에 읽어 두고, 지운 뒤 파일을 지운다 */
export async function refundPhotoKeys(refundId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tax_refund_photos")
    .select("photo_key, thumb_key")
    .eq("refund_id", refundId);
  if (error) throw error;
  return data.flatMap((p) => [p.photo_key, p.thumb_key]);
}

/** 사진 줄을 지운다. 이미 없으면 그대로 끝낸다 */
export async function deleteRefundPhoto(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("tax_refund_photos").delete().eq("id", id);
  if (error) throw error;
}
