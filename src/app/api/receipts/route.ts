import { randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

// 배럴은 클라이언트 훅까지 끌고 와서, 순수 규칙만 full path 로 가져온다
// eslint-disable-next-line no-restricted-imports
import {
  isReceiptMime,
  keysInTrip,
  RECEIPT_MAX_BYTES,
  receiptKey,
} from "@/entities/expense/lib/receipt-rules";
import { routeError } from "@/shared/api/route-error";
import { createReadUrls, createUploadUrl, removeFiles } from "@/shared/api/storage/receipts";
import { createClient } from "@/shared/api/supabase/server";

/** 예상하지 못한 실패 때 화면에 보낼 문구 — 원인은 서버 로그에만 */
const FAILED = "영수증을 처리하지 못했어요";

type Body =
  | { action: "upload"; tripId: string; mime: string; size: number }
  | { action: "read" | "remove"; tripId: string; keys: string[] };

/** 로그인했고 그 여행의 멤버인가 — RLS 로 여행이 보이면 멤버 */
async function isMember(tripId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("trips").select("id").eq("id", tripId).maybeSingle();
  return data !== null;
}

/**
 * 영수증 파일 서명 주소 — 올리기(upload: 새 키 + 한 번 쓰는 PUT 주소) · 보기(read: 키마다 GET 주소) · 지우기(remove).
 * 그 여행 멤버만, 그 여행 폴더의 키만. 저장소는 `shared/api/storage/receipts` 가 정한다(지금 Supabase Storage, 최종 R2)
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Body | null;
  if (!body?.tripId) return NextResponse.json({ error: "tripId 필요" }, { status: 400 });
  if (!(await isMember(body.tripId))) {
    return NextResponse.json({ error: "권한이 없어요" }, { status: 403 });
  }
  try {
    if (body.action === "upload") {
      if (!isReceiptMime(body.mime) || !(body.size > 0 && body.size <= RECEIPT_MAX_BYTES)) {
        return NextResponse.json({ error: "사진 · PDF, 10MB 까지" }, { status: 400 });
      }
      const key = receiptKey(body.tripId, randomUUID(), body.mime);
      return NextResponse.json({ key, url: await createUploadUrl(key) });
    }
    if (!Array.isArray(body.keys) || !keysInTrip(body.tripId, body.keys)) {
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
