"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Wordmark } from "@/shared/ui/wordmark";
import { Button } from "@/shared/ui/button";
import { createClient } from "@/shared/api/supabase/client";

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" className="size-5">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function useGoogleSignIn() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/trips";
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

function GoogleButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={loading}
      className="h-[52px] w-full gap-2.5 rounded-button border-line-strong bg-white text-base font-bold text-ink-900 hover:bg-surface-sunken disabled:opacity-100"
    >
      <GoogleLogo />
      {loading ? "로그인 중…" : "Google로 계속하기"}
    </Button>
  );
}

function Terms() {
  return (
    <p className="text-center text-xs leading-[1.6] text-ink-400">
      계속하면{" "}
      <a href="#" className="text-ink-500 underline">
        이용약관
      </a>
      과{" "}
      <a href="#" className="text-ink-500 underline">
        개인정보처리방침
      </a>
      에 동의하게 돼요.
    </p>
  );
}

function LoginForm() {
  const { signIn, loading, error } = useGoogleSignIn();

  return (
    <>
      {/* 모바일 (7a): 세로 중앙 카피 + 하단 고정 버튼 */}
      <div className="flex flex-1 flex-col lg:hidden">
        <div className="flex flex-1 flex-col justify-center gap-3.5 px-8">
          <Wordmark className="text-[44px] leading-none tracking-[-0.04em]" />
          <p className="text-[19px] leading-[1.45] font-bold tracking-[-0.01em] text-ink-900">
            함께 가는 여행,
            <br />
            일정부터 가계부까지 한 곳에서.
          </p>
          <p className="text-[15px] leading-[1.5] text-ink-400">
            일행과 지도·메모·지출을 같이 정리해요.
          </p>
        </div>
        <div className="flex flex-col gap-3.5 px-5 pb-[calc(44px+env(safe-area-inset-bottom))]">
          <GoogleButton onClick={signIn} loading={loading} />
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          <Terms />
        </div>
      </div>

      {/* PC (7b): 상단 64 바 + 회색 배경 가운데 카드 420 */}
      <div className="hidden flex-1 flex-col lg:flex">
        <header className="flex h-16 shrink-0 items-center border-b border-divider px-7">
          <Wordmark className="text-[22px]" />
        </header>
        <div className="flex flex-1 items-center justify-center bg-surface-sunken">
          <div className="flex w-[420px] flex-col gap-3 rounded-sheet border border-line-card bg-white px-10 pt-11 pb-8 shadow-card">
            <Wordmark className="text-4xl leading-none tracking-[-0.04em]" />
            <p className="text-lg leading-[1.45] font-bold text-ink-900">
              함께 가는 여행, 일정부터 가계부까지 한 곳에서.
            </p>
            <p className="pb-5 text-sm text-ink-400">일행과 지도·메모·지출을 같이 정리해요.</p>
            <GoogleButton onClick={signIn} loading={loading} />
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <div className="pt-1.5">
              <Terms />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function LoginView() {
  return (
    <main className="flex flex-1 flex-col">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
