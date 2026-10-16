import { postJson } from "@/shared/api/post-json";
import { createClient } from "@/shared/api/supabase/client";

import type { Voucher } from "../model/types";

/** 서명 주소 라우트를 부른다 — 저장소는 서버가 정한다(지금 Supabase Storage, 최종 R2) */
function callVouchers<T>(body: Record<string, unknown>): Promise<T> {
  return postJson<T>("/api/vouchers", body, "바우처 파일을 처리하지 못했어요");
}

/** 여행의 바우처 — 넣은 순서(묶음 안에서 이 순서를 지킨다) */
export async function fetchVouchers(tripId: string): Promise<Voucher[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** 키마다 잠깐 볼 수 있는 주소 */
export async function fetchVoucherUrls(
  tripId: string,
  keys: string[],
): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  return (await callVouchers<{ urls: Record<string, string> }>({ action: "read", tripId, keys }))
    .urls;
}
