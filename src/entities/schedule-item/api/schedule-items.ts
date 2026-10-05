import { createClient } from "@/shared/api/supabase/client";
import type { TablesUpdate } from "@/shared/api/supabase/database.types";

import type { WeekHours } from "../model/hours";
import type { Place, ScheduleItem } from "../model/types";

/** 일정과 그 일정이 쓰는 장소를 함께 읽는 select */
const WITH_PLACE = "*, place:places(*)";

/** 여행의 타임라인 일정(날짜 · 순서). 대체 장소 줄(alternative_of)은 빼고 fetchAlternatives 로 따로 읽는다 */
export async function fetchScheduleItems(tripId: string): Promise<ScheduleItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_items")
    .select(WITH_PLACE)
    .eq("trip_id", tripId)
    .is("alternative_of", null)
    .order("day_index")
    .order("position");
  if (error) throw error;
  return data;
}

export async function updateScheduleItem(
  id: string,
  patch: TablesUpdate<"schedule_items">,
): Promise<ScheduleItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("schedule_items")
    .update(patch)
    .eq("id", id)
    .select(WITH_PLACE)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScheduleItem(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("schedule_items").delete().eq("id", id);
  if (error) throw error;
}

/** 두 아이템의 position 을 서로 바꿈 (위/아래 이동) */
export async function swapScheduleItems(a: ScheduleItem, b: ScheduleItem): Promise<void> {
  const supabase = createClient();
  const [ra, rb] = await Promise.all([
    supabase.from("schedule_items").update({ position: b.position }).eq("id", a.id),
    supabase.from("schedule_items").update({ position: a.position }).eq("id", b.id),
  ]);
  if (ra.error) throw ra.error;
  if (rb.error) throw rb.error;
}

/** 다른 날로 이동: 대상 날의 맨 끝으로 */
export async function moveScheduleItemToDay(
  item: ScheduleItem,
  dayIndex: number,
): Promise<ScheduleItem> {
  const supabase = createClient();
  const { data: last } = await supabase
    .from("schedule_items")
    .select("position")
    .eq("trip_id", item.trip_id)
    .eq("day_index", dayIndex)
    .is("alternative_of", null)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return updateScheduleItem(item.id, {
    day_index: dayIndex,
    position: last ? last.position + 1 : 0,
  });
}

/** dayIndex 일째부터 끝까지의 일정 수(대체 장소 빼고). 기간을 줄일 때 옮겨질 일정을 미리 센다 */
export async function countScheduleItemsFrom(tripId: string, dayIndex: number): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("schedule_items")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", tripId)
    .is("alternative_of", null)
    .gte("day_index", dayIndex);
  if (error) throw error;
  return count ?? 0;
}

/** 장소 검색에서 고른 곳. 0013 add_schedule_place 가 받는 모양 */
/** 구글 검색 · 이름만 입력으로 고른 곳. 0015 add_schedule_place 가 받는 모양 */
export type PickedPlaceInput = {
  name: string;
  google_place_id: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
};

/** 일정에 담을 한 곳: 저장한 장소(이미 있는 places 행) 또는 새로 고른 곳 */
export type ScheduleEntry = { place_id: string } | PickedPlaceInput;

/**
 * 여러 곳을 고른 순서대로 그날 끝에 담는다(0016 add_schedule_places). 한 트랜잭션이라 하나가 실패하면 아무것도 안 남는다.
 * 새로 고른 곳은 같은 구글 장소를 이미 담았으면 그 장소를 다시 쓴다. 담은 일정 id 를 순서대로 돌려준다.
 */
export async function addPlacesToSchedule(
  tripId: string,
  dayIndex: number,
  entries: ScheduleEntry[],
): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_schedule_places", {
    p_trip: tripId,
    p_day: dayIndex,
    p_places: entries,
  });
  if (error) throw error;
  return data;
}

/**
 * 「저장한 장소」 — 내가 만든 장소 중 이 도시들에 있는 것. 이름순.
 * 일정에 쓰지 않는 장소도 나온다(보관함). 도시가 없으면 빈 목록.
 */
export async function fetchSavedPlaces(userId: string, cityIds: string[]): Promise<Place[]> {
  if (cityIds.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("created_by", userId)
    .in("city_id", cityIds)
    .order("name");
  if (error) throw error;
  return data;
}

/**
 * 이 여행에 붙일 수 있는 장소 중 같은 구글 장소 — 내가 만든 것, 없으면 이 여행 일정이 쓰는 것(can_attach_place 와 같은 범위).
 * 없으면 null. 직접 추가에서 이미 있는 장소를 고르면 새로 만들지 않고 그 장소를 쓰게 묻는 데 쓴다
 */
export async function findAttachablePlace(
  tripId: string,
  userId: string,
  googlePlaceId: string,
): Promise<Place | null> {
  const supabase = createClient();
  const mine = await supabase
    .from("places")
    .select("*")
    .eq("created_by", userId)
    .eq("google_place_id", googlePlaceId)
    .maybeSingle();
  if (mine.error) throw mine.error;
  if (mine.data) return mine.data;
  const used = await supabase
    .from("schedule_items")
    .select("place:places!inner(*)")
    .eq("trip_id", tripId)
    .eq("place.google_place_id", googlePlaceId)
    .limit(1);
  if (used.error) throw used.error;
  return used.data[0]?.place ?? null;
}

/** 장소 정보를 고친다. 만든 사람만 된다(RLS) — 남의 장소면 0행이 바뀌어 오류를 낸다 */
export async function updatePlace(id: string, patch: TablesUpdate<"places">): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("places").update(patch).eq("id", id).select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error("이 장소는 만든 사람만 고칠 수 있어요");
}

/** 장소 입력 폼의 장소 정보 칸. 0017 create_place_schedule 의 p_place */
export type NewPlaceFields = {
  name: string;
  category: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  /** 현지어 주소(일본이면 일본어) */
  address_local: string | null;
  /** 한글 주소(일본은 한글 동네 이름 + 번지 숫자). 한국은 address 와 같아 null */
  address_ko: string | null;
  /** 사용자가 적는 상세 위치(「파르코 본관 8F」) */
  address_detail: string | null;
  google_place_id: string | null;
  hours: string | null;
  /** 요일별 운영시간(값 null = 휴무, 키 없음 = 모름). {} 이면 이미 있는 장소의 요일별 값을 지우고, null 이면 둔다 */
  hours_week: WeekHours | null;
  rating: number | null;
  review_count: number | null;
  wait: string | null;
  description: string | null;
  gmap_url: string | null;
  links: { title: string; url: string }[];
};

/**
 * 장소를 직접 입력해 그날 끝에 담는다(create_place_schedule). 장소와 일정을 한 트랜잭션으로 만든다.
 * 이번 일정 칸(p_item)은 아이콘만 보낸다 — 직접 추가는 장소만 받고, 상태 · 시간 · 메모는 일정 상세에서 고친다.
 * `alternativeOf` 가 있으면 그날 끝이 아니라 그 일정의 대체 장소로 넣는다(0024 — 날짜는 그 일정을 따른다).
 * 새 일정 id 를 돌려준다.
 */
export async function createPlaceSchedule(
  tripId: string,
  dayIndex: number,
  place: NewPlaceFields,
  /** 이 일정에만 붙는 아이콘(장소가 아니라 일정에 — 0023). 없으면 null */
  emoji: string | null,
  alternativeOf: string | null = null,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_place_schedule", {
    p_trip: tripId,
    p_day: dayIndex,
    p_place: place,
    p_item: { emoji, alternative_of: alternativeOf },
  });
  if (error) throw error;
  return data;
}
