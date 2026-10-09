import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

// 배럴은 클라이언트 훅까지 끌고 와서, 순수 규칙만 full path 로 가져온다
// eslint-disable-next-line no-restricted-imports
import {
  AVATAR_MAX_BYTES,
  avatarKey,
  avatarKeyOf,
  isAvatarMime,
  isOwnAvatarKey,
} from "@/entities/session/lib/avatar-rules";
import { avatarBase, createAvatarUploadUrl, removeAvatar } from "@/shared/api/storage/avatars";
import { createClient } from "@/shared/api/supabase/server";

type Body = { action: "upload"; mime: string; size: number } | { action: "remove"; url: string };

/**
 * 프로필 사진 — 올리기(upload: 새 키 + 한 번 쓰는 PUT 주소 + 공개 주소) · 지우기(remove: 앞 사진 주소).
 * 로그인한 사람만, 둘러보기(익명)는 막는다. 자기 폴더의 파일만 지운다 — 구글 사진 등 우리 버킷이 아닌 주소는 할 일이 없다.
 * 저장소는 `shared/api/storage/avatars` 가 정한다(지금 Supabase Storage, 최종 R2)
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  try {
    if (body?.action === "upload") {
      if (!isAvatarMime(body.mime) || !(body.size > 0 && body.size <= AVATAR_MAX_BYTES)) {
        return NextResponse.json({ error: "JPG · PNG · WebP, 2MB 까지" }, { status: 400 });
      }
      const key = avatarKey(user.id, randomUUID(), body.mime);
      return NextResponse.json({
        url: await createAvatarUploadUrl(key),
        publicUrl: `${await avatarBase()}${key}`,
      });
    }
    if (body?.action === "remove") {
      const key = avatarKeyOf(body.url, await avatarBase());
      if (key !== null && isOwnAvatarKey(user.id, key)) await removeAvatar(key);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "모르는 동작" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
