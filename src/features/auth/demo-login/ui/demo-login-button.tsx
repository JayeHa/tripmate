"use client";

import { useUser } from "@/entities/session";
import { Button } from "@/shared/ui/button";
import { useDemoLogin } from "../model/use-demo-login";

/**
 * 로그인 없이 둘러보기. 샘플 여행이 담긴 익명 계정으로 들어간다.
 * 이미 둘러보는 중이면 그 사실과 돌아갈 길을 알려 준다.
 */
export function DemoLoginButton() {
  const { data: user } = useUser();
  const { enterDemo, loading, error } = useDemoLogin();

  if (user?.is_anonymous) {
    return (
      <p className="text-center text-[13px] leading-[1.6] text-ink-400">
        지금은 둘러보는 중이에요. 위에서 로그인하면 기록이 계정에 남아요.
      </p>
    );
  }

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
