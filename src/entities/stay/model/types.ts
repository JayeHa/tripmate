import type { Json, Tables } from "@/shared/api/supabase/database.types";

/** 숙소 예약 한 줄과 그 장소(이름 · 주소 · 좌표 · 구글맵은 장소에 있다) */
export type Stay = Tables<"stays"> & { place: Tables<"places"> };

/** 숙소 저장에 보내는 장소 — save_stay 의 p_place */
export type StayPlaceInput = {
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  address_local: string | null;
  address_ko: string | null;
  google_place_id: string | null;
  gmap_url: string | null;
};

/** 숙소 저장에 보내는 예약 정보 — save_stay 의 p_fields */
export type StayFieldsInput = {
  emoji: string | null;
  status: string | null;
  check_in_date: string;
  check_out_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  memo: string | null;
  links: { title: string; url: string }[];
};

/** save_stay 가 돌려주는 것 — 숙소 id 와 이번 저장으로 생긴 · 지운 연결 카드 수 */
export type StaySaveResult = { id: string; added: number; removed: number };

/** 숙소 링크 한 줄(저장된 것). 링크는 jsonb 라 읽을 때 모양을 확인한다 */
export type StayLink = { title: string; url: string };

/** jsonb 링크 칸을 안전하게 읽는다 — 모양이 다르면 빈 목록 */
export function stayLinksOf(links: Json): StayLink[] {
  if (!Array.isArray(links)) return [];
  return links.flatMap((l) =>
    l && typeof l === "object" && !Array.isArray(l) && typeof l.url === "string"
      ? [{ title: typeof l.title === "string" ? l.title : "", url: l.url }]
      : [],
  );
}
