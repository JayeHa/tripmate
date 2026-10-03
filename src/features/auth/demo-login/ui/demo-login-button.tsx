"use client";

import { useUser } from "@/entities/session";
import { useTrips } from "@/entities/trip";
import { Button } from "@/shared/ui/button";
import { useDemoLogin } from "../model/use-demo-login";

/**
 * 로그인 없이 둘러보기. 샘플 여행이 담긴 익명 계정으로 들어간다.
 *
 * 이미 샘플을 가진 익명 사용자에게는 버튼 대신 안내만 보여 준다.
 * 다만 시딩이 중간에 끊겨 여행이 없는 익명 사용자는 다시 시작할 수 있어야 한다.
 * 그 경우에도 버튼을 숨기면 빈 목록과 로그인 화면 사이에 갇힌다.
 */
export function DemoLoginButton() {
  const { data: user } = useUser();
  const { enterDemo, loading, error } = useDemoLogin();
  const isAnonymous = user?.is_anonymous ?? false;
  // 익명일 때만 물어본다. 로그인 전에는 어차피 빈 배열이라 받아 올 필요가 없다.
  const { data: trips, isPending: tripsPending } = useTrips({ enabled: isAnonymous });

  // 시딩 중에는 익명 분기를 건너뛴다. signInAnonymously 직후 isAnonymous 가 참이 되는데
  // 여기서 갈라지면 누르자마자 버튼이 사라졌다가 문구로 바뀌며 깜빡인다.
  if (isAnonymous && !loading) {
    if (tripsPending) return null;
    if (trips && trips.length > 0) {
      return (
        <p className="text-center text-[13px] leading-[1.6] text-ink-400">
          지금은 둘러보는 중이에요. 위에서 로그인하면 기록이 계정에 남아요.
        </p>
      );
    }
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
        {loading
          ? "샘플 여행을 준비하고 있어요…"
          : isAnonymous
            ? "샘플 여행 다시 만들기"
            : "로그인 없이 둘러보기"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </>
  );
}
