"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";
import { TOKYO_SEED } from "../lib/tokyo-seed";

/**
 * 둘러보기. 익명 계정을 만들고 도쿄 여행 샘플을 심은 뒤 그 여행으로 보낸다.
 * 방문자마다 자기 데이터를 받으므로 마음껏 고치고 지워도 서로 영향이 없다.
 */
export function useDemoLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enterDemo() {
    if (loading) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // 앞선 시도가 시딩에서 멈췄다면 익명 세션이 이미 있다. 그 세션을 그대로 쓴다.
    // 세션을 버리고 다시 로그인하면 시도할 때마다 auth.users 에 고아가 하나씩 쌓인다.
    const { data: existing } = await supabase.auth.getUser();
    let user = existing.user?.is_anonymous ? existing.user : null;

    if (!user) {
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
      user = auth.user;
    }

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert({ ...TOKYO_SEED.trip, owner_id: user.id })
      .select("id")
      .single();
    if (tripError || !trip) {
      // 여기서 signOut 하면 안 된다. auth-js 는 서버 응답과 무관하게 로컬 세션을 지우므로
      // 위의 재사용 분기가 무력해지고, 누를 때마다 익명 계정이 하나씩 늘어난다.
      // 세션은 두고 DemoLoginButton 이 「여행 없는 익명」에게 다시 버튼을 보여 준다.
      setError(tripError?.message ?? "샘플 여행을 만들지 못했어요. 다시 시도해 주세요.");
      setLoading(false);
      return;
    }

    const { error: itemsError } = await supabase
      .from("schedule_items")
      .insert(TOKYO_SEED.items.map((item) => ({ ...item, trip_id: trip.id })));
    // 일정이 비어도 여행 자체는 볼 수 있으니 여기서 멈추지 않는다.
    if (itemsError) console.error("샘플 일정 삽입 실패", itemsError);

    // 목록 캐시를 비운다. staleTime 이 30초라, 이 화면에서 이미 빈 목록을 받아 왔으면
    // 방금 만든 여행이 안 보인다.
    await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    router.replace(`/trips/${trip.id}/home`);
  }

  return { enterDemo, loading, error };
}
