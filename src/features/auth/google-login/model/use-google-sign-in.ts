"use client";

import { useQueryClient } from "@tanstack/react-query";
import { del } from "idb-keyval";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { QUERY_PERSIST_KEY } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";

/**
 * Google OAuth 로그인. 성공하면 Supabase 가 /auth/callback 으로 돌려보내고,
 * 거기서 next 파라미터가 가리키는 경로로 넘어간다.
 */
export function useGoogleSignIn() {
  const next = useSearchParams().get("next") ?? "/trips";
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();

    // 둘러보기(익명)에서 갈아타는 경우 그 캐시를 먼저 버린다.
    // signInWithOAuth 는 SIGNED_OUT 없이 세션만 교체하므로 로그아웃 경로의 정리가
    // 돌지 않고, 쿼리 키에 user id 가 없어 익명 여행이 새 계정 목록에 되살아난다.
    // 리다이렉트 전에 비우면 돌아왔을 때 복원할 것이 없어 경쟁이 생기지 않는다.
    const { data } = await supabase.auth.getUser();
    if (data.user?.is_anonymous) {
      queryClient.clear();
      try {
        await del(QUERY_PERSIST_KEY);
      } catch {
        // IndexedDB 를 못 쓰는 환경(일부 사생활 보호 모드)에서는 del 이 reject 한다.
        // 저장소가 없으면 복원될 저장본도 없으니 무시하고 로그인을 이어 간다.
        // 여기서 throw 하면 loading 이 풀리지 않아 버튼이 멈춘다.
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return { signIn, loading, error };
}
