"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";
import { Button } from "@/shared/ui/button";

export function JoinButton({ token, isAnonymous }: { token: string; isAnonymous: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function join() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data: tripId, error } = await supabase.rpc("join_trip_by_token", { p_token: token });
    if (error || !tripId) {
      setError(error?.message ?? "참여에 실패했어요");
      setPending(false);
      return;
    }
    await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    router.replace(`/trips/${tripId}/home`);
  }

  // 둘러보기 계정으로 합류하면 쿠키가 지워지는 순간 멤버십을 되찾을 수 없다.
  if (isAnonymous) {
    return (
      <div className="mt-6 flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={<Link href={`/login?next=${encodeURIComponent(`/join/${token}`)}`} />}
        >
          Google로 로그인하고 참여하기
        </Button>
        <p className="text-center text-sm text-ink-400">
          둘러보기 중에는 일행으로 참여할 수 없어요. 기록이 사라지지 않게 로그인해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <Button size="lg" className="w-full" onClick={() => void join()} disabled={pending}>
        {pending ? "참여 중..." : "참여하기"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
