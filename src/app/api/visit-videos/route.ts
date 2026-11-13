import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

// 배럴은 클라이언트 훅까지 끌고 와서, 순수 규칙만 full path 로 가져온다
// eslint-disable-next-line no-restricted-imports
import { visitPhotoKeysInTrip } from "@/entities/schedule-item/lib/visit-photo-rules";
// eslint-disable-next-line no-restricted-imports
import {
  isVisitVideoMime,
  VISIT_VIDEO_MAX_BYTES,
  visitVideoKey,
} from "@/entities/schedule-item/lib/visit-video-rules";
import { routeError } from "@/shared/api/route-error";
import { createReadUrls, createUploadUrl, removeFiles } from "@/shared/api/storage/visit-videos";
import { createClient } from "@/shared/api/supabase/server";

/** 예상하지 못한 실패 때 화면에 보낼 문구 — 원인은 서버 로그에만 */
const FAILED = "영상을 처리하지 못했어요";

type Body =
  | { action: "upload"; tripId: string; mime: string; size: number }
  | { action: "read" | "remove"; tripId: string; keys: string[] };

/** 그 여행의 멤버면 둘러보기(익명) 계정인지를, 아니면 null — RLS 로 여행이 보이면 멤버 */
async function memberOf(tripId: string): Promise<{ anonymous: boolean } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("trips").select("id").eq("id", tripId).maybeSingle();
  return data && { anonymous: user.is_anonymous === true };
}

/**
 * 기록 영상 서명 주소 — 올리기(upload: 새 키 + 한 번 쓰는 PUT 주소) · 보기(read: 키마다 GET 주소) · 지우기(remove).
 * 영상 원본만 이 길로 다닌다(표지 사진은 기록 사진 라우트). 그 여행 멤버만, 그 여행 폴더의 키만.
 * **올리기는 둘러보기(익명)를 막는다** — 한 개가 50MB 라 매일 지워지는 계정이 저장 공간을 채우지 못하게(버킷 정책도 같다).
 * 지우기는 버킷 정책이 붙은 줄이 없는 파일만 지운다
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.tripId) return NextResponse.json({ error: "tripId 필요" }, { status: 400 });
  const member = await memberOf(body.tripId);
  if (!member) return NextResponse.json({ error: "권한이 없어요" }, { status: 403 });
  try {
    if (body.action === "upload") {
      if (member.anonymous) {
        return NextResponse.json(
          { error: "둘러보기에서는 영상을 올릴 수 없어요" },
          { status: 403 },
        );
      }
      if (!isVisitVideoMime(body.mime) || !(body.size > 0 && body.size <= VISIT_VIDEO_MAX_BYTES)) {
        return NextResponse.json({ error: "MP4 · MOV · WebM, 50MB 까지" }, { status: 400 });
      }
      const key = visitVideoKey(body.tripId, randomUUID(), body.mime);
      return NextResponse.json({ key, url: await createUploadUrl(key) });
    }
    if (!Array.isArray(body.keys) || !visitPhotoKeysInTrip(body.tripId, body.keys)) {
      return NextResponse.json({ error: "그 여행의 파일만" }, { status: 400 });
    }
    if (body.action === "read") return NextResponse.json({ urls: await createReadUrls(body.keys) });
    if (body.action === "remove") {
      await removeFiles(body.keys);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "모르는 동작" }, { status: 400 });
  } catch (e) {
    return routeError(e, FAILED);
  }
}
