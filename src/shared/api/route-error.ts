import "server-only";

import { NextResponse } from "next/server";

/**
 * 라우트의 예상하지 못한 실패 — 원인(Supabase · 구글 오류, 대개 영어)은 서버 로그에만 남기고 화면에는 정해진 한국어 문구를 보낸다.
 * 화면은 `postJson` 이 이 문구를 ApiError 로 받는다
 */
export function routeError(cause: unknown, message: string, status = 500) {
  console.error(cause);
  return NextResponse.json({ error: message }, { status });
}
