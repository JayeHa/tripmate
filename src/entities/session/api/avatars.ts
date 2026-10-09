/** 프로필 사진 라우트를 부른다 — 저장소는 서버가 정한다(지금 Supabase Storage, 최종 R2) */
async function callAvatars<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/avatars", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `avatars ${res.status}`);
  return json;
}

/** 사진을 올리고 공개 주소를 돌려준다 — 서명 주소를 받아 그 주소로 PUT */
export async function uploadAvatar(file: Blob): Promise<string> {
  const { url, publicUrl } = await callAvatars<{ url: string; publicUrl: string }>({
    action: "upload",
    mime: file.type,
    size: file.size,
  });
  const put = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`upload ${put.status}`);
  return publicUrl;
}

/** 앞 사진 파일을 지운다 — 우리 버킷에 올린 사진이 아니면(구글 사진) 서버가 아무것도 하지 않는다 */
export async function removeAvatar(url: string): Promise<void> {
  await callAvatars({ action: "remove", url });
}
