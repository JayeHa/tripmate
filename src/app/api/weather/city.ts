import "server-only";

import { createClient } from "@/shared/api/supabase/server";

/** 도시 id 모양 — 소문자 · 숫자 · 하이픈(`tokyo`) */
const CITY_ID = /^[a-z0-9-]{1,40}$/;

/**
 * 주소의 `city` → 그 도시의 좌표. 바깥 호출을 도시 목록(cities)으로 닫는다 — 아무 좌표나 받으면 좌표를 바꿔 가며 불러
 * Open-Meteo 무료 한도(Vercel 이 함께 쓰는 IP 기준)를 바깥에서 써 버릴 수 있다. 서버 저장분도 도시마다 하나가 된다.
 * cities 는 로그인한 사람(둘러보기 포함)만 읽어서(RLS) 로그인하지 않았거나 모르는 도시면 null. 읽기 실패는 던진다
 */
export async function cityCoords(
  params: URLSearchParams,
): Promise<{ lat: number; lng: number } | null> {
  const id = params.get("city") ?? "";
  if (!CITY_ID.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("lat, lng")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
