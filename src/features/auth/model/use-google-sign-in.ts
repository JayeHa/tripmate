"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/shared/api/supabase/client";

/**
 * Google OAuth 로그인. 성공하면 Supabase 가 /auth/callback 으로 돌려보내고,
 * 거기서 next 파라미터가 가리키는 경로로 넘어간다.
 */
export function useGoogleSignIn() {
  const next = useSearchParams().get("next") ?? "/trips";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    if (loading) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
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
