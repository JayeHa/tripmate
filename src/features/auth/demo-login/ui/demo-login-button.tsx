"use client";

import { Button } from "@/shared/ui/button";
import { useDemoLogin } from "../model/use-demo-login";

/** 로그인 없이 둘러보기. 샘플 여행이 담긴 익명 계정으로 들어간다. */
export function DemoLoginButton() {
  const { enterDemo, loading, error } = useDemoLogin();

  return (
    <>
      <Button
        variant="text"
        size="text"
        onClick={enterDemo}
        disabled={loading}
        className="mx-auto text-sm"
      >
        {loading ? "샘플 여행을 준비하고 있어요…" : "로그인 없이 둘러보기"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </>
  );
}
