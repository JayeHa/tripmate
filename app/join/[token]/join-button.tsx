"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { queryKeys } from "@/lib/queries/keys";
import { createClient } from "@/lib/supabase/client";

export function JoinButton({ token }: { token: string }) {
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
    router.replace(`/trips/${tripId}/itinerary`);
  }

  return (
    <div className="mt-6 flex flex-col gap-2">
      <Button size="lg" className="w-full" onClick={join} disabled={pending}>
        {pending ? "참여 중..." : "참여하기"}
      </Button>
      {error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
