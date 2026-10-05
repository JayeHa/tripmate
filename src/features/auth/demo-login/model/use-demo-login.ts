"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { queryKeys } from "@/shared/api/query-keys";
import { createClient } from "@/shared/api/supabase/client";

import { toSeedRows } from "../lib/seed-rows";
import { TOKYO_SEED } from "../lib/tokyo-seed";

type Client = ReturnType<typeof createClient>;

/**
 * 샘플 여행에 도시 · 장소 · 일정을 심는다. 실패해도 여행 자체는 볼 수 있어서 멈추지 않고 콘솔에만 남긴다.
 * 도시가 없으면 목록에 「도시 미정」으로 보이고, 일정이 없으면 빈 일정이 보인다.
 * 장소를 먼저 넣고 일정이 그 장소를 참조한다. 장소 id 는 미리 만들어 둔다(seed-rows.ts). 대체 장소는 일정 다음에 넣는다.
 */
async function seedTrip(supabase: Client, tripId: string) {
  const { error: citiesError } = await supabase
    .from("trip_cities")
    .insert(
      TOKYO_SEED.cityIds.map((city_id, position) => ({ trip_id: tripId, city_id, position })),
    );
  if (citiesError) console.error("샘플 도시 삽입 실패", citiesError);

  const rows = toSeedRows(TOKYO_SEED.items, {
    tripId,
    cityId: TOKYO_SEED.cityIds[0],
    newId: () => crypto.randomUUID(),
  });
  const { error: placesError } = await supabase.from("places").insert(rows.places);
  if (placesError) return console.error("샘플 장소 삽입 실패", placesError);
  // 행마다 키가 다르다(대체 장소가 붙은 일정만 id 를 미리 만든다). supabase-js 배열 insert 는 키를 합쳐 보내고
  // 기본값이 defaultToNull 이라, 끄지 않으면 키가 없는 행의 id 가 기본값 대신 NULL 로 가서 전체가 실패한다
  const { error: itemsError } = await supabase
    .from("schedule_items")
    .insert(rows.items, { defaultToNull: false });
  if (itemsError) return console.error("샘플 일정 삽입 실패", itemsError);
  // 대체 장소는 붙을 일정이 들어간 뒤에 넣는다(트리거가 붙을 일정을 확인한다)
  const { error: altsError } = await supabase
    .from("schedule_items")
    .insert(rows.alternatives, { defaultToNull: false });
  if (altsError) console.error("샘플 대체 장소 삽입 실패", altsError);
}

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

    await seedTrip(supabase, trip.id);

    // 목록 캐시를 비운다. staleTime 이 30초라, 이 화면에서 이미 빈 목록을 받아 왔으면
    // 방금 만든 여행이 안 보인다.
    await qc.invalidateQueries({ queryKey: queryKeys.trips.all });
    router.replace(`/trips/${trip.id}/home`);
  }

  return { enterDemo, loading, error };
}
