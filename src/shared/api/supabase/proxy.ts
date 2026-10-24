import "server-only";

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import type { Database } from "./database.types";

const PROTECTED_PREFIXES = ["/trips", "/join"];

/** 요청마다 로그인을 확인하고 세션 쿠키를 갱신한다 — 로그인이 필요한 화면은 /login 으로, 로그인한 사람의 /login 은 /trips 로 보낸다 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 토큰을 검증하고 필요하면 세션을 갱신한다. 반드시 다른 로직보다 먼저 호출.
  // getUser() 는 화면 이동 · 프리페치마다 Supabase Auth 에 한 번 다녀와서, 서명 키(ES256)로 여기서 확인하는 getClaims() 를 쓴다.
  // 다른 기기에서 로그아웃해도 이 토큰이 만료될 때까지(최대 1시간) 여기서는 로그인으로 본다 — 화면을 열어 줄지만 정하고,
  // 데이터 권한은 DB(RLS)가 요청마다 확인한다. 대칭 키(HS256)로 서명된 옛 토큰이면 getClaims 가 알아서 getUser 로 확인한다
  // @see https://supabase.com/docs/reference/javascript/auth-getclaims
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const { pathname, search } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // 익명(둘러보기) 사용자는 /login 을 막지 않는다. 막으면 Google 로 갈아탈 길이 없어진다.
  if (user && !user.is_anonymous && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/trips";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
