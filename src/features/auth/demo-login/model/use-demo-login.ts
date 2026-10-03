"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/shared/api/supabase/client";
import { TOKYO_SEED } from "../lib/tokyo-seed";

/**
 * 둘러보기. 익명 계정을 만들고 도쿄 여행 샘플을 심은 뒤 그 여행으로 보낸다.
 * 방문자마다 자기 데이터를 받으므로 마음껏 고치고 지워도 서로 영향이 없다.
 */
export function useDemoLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enterDemo() {
    if (loading) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    // handle_new_user 트리거가 raw_user_meta_data 로 profiles 를 채운다.
    // 이름을 주지 않으면 익명 사용자는 display_name 이 비어 멤버 목록에 공백으로 보인다.
    const { data: auth, error: authError } = await supabase.auth.signInAnonymously({
      options: { data: { full_name: "둘러보는 중" } },
    });
    if (authError || !auth.user) {
      setError(authError?.message ?? "둘러보기를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({ ...TOKYO_SEED.trip, owner_id: auth.user.id })
      .select("id")
      .single();
    if (tripError || !trip) {
      setError(tripError?.message ?? "샘플 여행을 만들지 못했어요.");
      setLoading(false);
      return;
    }

    const { error: itemsError } = await supabase
      .from("schedule_items")
      .insert(TOKYO_SEED.items.map((item) => ({ ...item, trip_id: trip.id })));
    // 일정이 비어도 여행 자체는 볼 수 있으니 여기서 멈추지 않는다.
    if (itemsError) console.error("샘플 일정 삽입 실패", itemsError);

    router.replace(`/trips/${trip.id}/home`);
  }

  return { enterDemo, loading, error };
}
