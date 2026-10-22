import type { NextRequest } from "next/server";

import { updateSession } from "@/shared/api/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일, 이미지, 인증 콜백, manifest 제외
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|auth/callback|serwist/|~offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
