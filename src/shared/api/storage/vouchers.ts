import "server-only";

import { createClient } from "@/shared/api/supabase/server";

/**
 * 바우처 파일 저장소 — 서버에서만. 영수증(`./receipts`)과 같은 구조로, 화면은 이 모듈이 만든 서명 주소로 올리고(PUT) 본다(GET).
 * 지금은 Supabase Storage 비공개 버킷 `vouchers`(원본 20MB 라 영수증 버킷과 크기 제한이 달라 따로 둔다), 최종 저장소는 Cloudflare R2 다.
 * 사용자 세션으로 부르므로 버킷 정책(경로 첫 칸 여행의 멤버)이 함께 걸린다
 */
const BUCKET = "vouchers";

/** 읽기 주소가 유효한 시간(초) */
const READ_SECONDS = 60 * 60;

/** 이 키로 한 번 올릴 수 있는 서명 주소(PUT 본문 = 파일) */
export async function createUploadUrl(key: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error) throw error;
  return data.signedUrl;
}

/** 키마다 잠깐 볼 수 있는 서명 주소. 만들지 못한 키는 빠진다 */
export async function createReadUrls(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(keys, READ_SECONDS);
  if (error) throw error;
  return Object.fromEntries(
    data.flatMap((d) => (d.path && d.signedUrl ? [[d.path, d.signedUrl]] : [])),
  );
}

/** 파일을 지운다 */
export async function removeFiles(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove(keys);
  if (error) throw error;
}
