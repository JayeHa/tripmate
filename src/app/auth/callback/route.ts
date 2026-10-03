import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/shared/api/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/trips";
  // open redirect 방지: 내부 경로만 허용
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/trips";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
