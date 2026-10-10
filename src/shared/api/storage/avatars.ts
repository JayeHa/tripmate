import "server-only";

import { createClient } from "@/shared/api/supabase/server";

/**
 * 프로필 사진 저장소 — 서버에서만. 화면은 이 모듈이 만든 서명 주소로 올리고(PUT), 공개 주소를 profiles.avatar_url 에 둔다.
 * 지금은 Supabase Storage 공개 버킷 `avatars`, 영수증과 함께 Cloudflare R2 로 옮긴다(#18 ⑫-b) — 그때 이 파일만 바꾼다.
 * 사용자 세션으로 부르므로 버킷 정책(자기 폴더 · 익명 금지)이 함께 걸린다
 */
const BUCKET = "avatars";

/** 이 키로 한 번 올릴 수 있는 서명 주소(PUT 본문 = 파일) */
export async function createAvatarUploadUrl(key: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error) throw error;
  return data.signedUrl;
}

/** 공개 주소의 앞부분(키 앞까지) — 키를 붙이면 그 사진 주소, 주소에서 키를 꺼낼 때도 쓴다 */
export async function avatarBase(): Promise<string> {
  const supabase = await createClient();
  return supabase.storage.from(BUCKET).getPublicUrl("").data.publicUrl.replace(/\/?$/, "/");
}

/** 파일을 지운다 */
export async function removeAvatar(key: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([key]);
  if (error) throw error;
}
