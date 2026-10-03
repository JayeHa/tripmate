"use client";

import { Button } from "@/shared/ui/button";

import { useGoogleSignIn } from "../model/use-google-sign-in";
import { GoogleLogo } from "./google-logo";

/** 높이 52, radius 8, 흰 배경에 1px 테두리 (design-system.md · 로그인). */
export function GoogleSignInButton() {
  const { signIn, loading, error } = useGoogleSignIn();

  return (
    <>
      <Button
        variant="outline"
        onClick={() => void signIn()}
        disabled={loading}
        className="h-13 w-full gap-2.5 rounded-button border-line-strong bg-white text-base font-bold text-ink-900 hover:bg-surface-sunken disabled:opacity-100"
      >
        <GoogleLogo className="size-5" />
        {loading ? "로그인 중…" : "Google로 계속하기"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </>
  );
}
