import { createClient } from "@/shared/api/supabase/client";

import type { PackItemPatch } from "../lib/board";
import { photoOf } from "../lib/photo-rules";
import type { PackGroup, PackItem, PackKind, PackLists, PackPreset } from "../model/types";
import { removePackPhotos } from "./photos";

/** 고치려는 그룹 · 항목이 없다 — 그사이 일행이 지웠다 */
export const PACK_GONE = "이미 지워진 항목이에요";

/** 0행이면(그사이 지웠거나 권한이 없다 — RLS 는 오류 없이 0행으로 끝난다) 던진다 */
function ensureRow(data: unknown[]) {
  if (data.length === 0) throw new Error(PACK_GONE);
}

/** 여행의 준비물 · 쇼핑 — 그룹 · 항목 모두 순서(position) · 넣은 순서로 */
export async function fetchPackLists(tripId: string): Promise<PackLists> {
  const supabase = createClient();
  const [groups, items] = await Promise.all([
    supabase
      .from("pack_groups")
      .select("*")
      .eq("trip_id", tripId)
      .order("position")
      .order("created_at"),
    supabase
      .from("pack_items")
      .select("*")
      .eq("trip_id", tripId)
      .order("position")
      .order("created_at"),
  ]);
  if (groups.error) throw groups.error;
  if (items.error) throw items.error;
  return { groups: groups.data, items: items.data };
}

/** 그룹을 맨 뒤(position)에 넣는다 */
export async function addPackGroup(
  tripId: string,
  kind: PackKind,
  name: string,
  position: number,
): Promise<PackGroup> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pack_groups")
    .insert({ trip_id: tripId, kind, name: name.trim(), position })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** 그룹 이름 바꾸기 */
export async function renamePackGroup(id: string, name: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pack_groups")
    .update({ name: name.trim() })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  ensureRow(data);
}

/**
 * 그룹 지우기 — 항목도 함께(cascade). 이미 지워졌으면(0행) 그대로 끝낸다.
 * 항목의 사진 키를 먼저 읽어 두고, 지운 뒤 그 파일을 지운다(cascade 로 지운 줄은 돌려받지 못한다)
 */
export async function deletePackGroup(tripId: string, id: string): Promise<void> {
  const supabase = createClient();
  const photos = await supabase
    .from("pack_items")
    .select("photo_key, thumb_key")
    .eq("group_id", id)
    .not("photo_key", "is", null);
  if (photos.error) throw photos.error;
  const { error } = await supabase.from("pack_groups").delete().eq("id", id);
  if (error) throw error;
  await removePackPhotos(tripId, photos.data.map(photoOf));
}

/** 항목을 그룹 맨 뒤(position)에 넣는다 */
export async function addPackItem(
  tripId: string,
  groupId: string,
  name: string,
  position: number,
): Promise<PackItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pack_items")
    .insert({ trip_id: tripId, group_id: groupId, name: name.trim(), position })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** 챙김 바꾸기 — checkedBy 가 있으면 지금 시각으로 챙기고, null 이면 푼다 */
export async function setPackItemChecked(id: string, checkedBy: string | null): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pack_items")
    .update({
      checked_by: checkedBy,
      checked_at: checkedBy ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  ensureRow(data);
}

/** 항목 고치기(상세의 저장) — 받은 칸만 */
export async function updatePackItem(id: string, patch: PackItemPatch): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase.from("pack_items").update(patch).eq("id", id).select("id");
  if (error) throw error;
  ensureRow(data);
}

/** 항목 지우기 — 이미 지워졌으면(0행) 그대로 끝낸다. 지운 줄의 사진 파일도 지운다 */
export async function deletePackItem(tripId: string, id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pack_items")
    .delete()
    .eq("id", id)
    .select("photo_key, thumb_key");
  if (error) throw error;
  await removePackPhotos(tripId, data.map(photoOf));
}

/** 「모두 해제」 — 받은 항목의 챙김을 모두 푼다. 그사이 지워진 것은 건너뛴다 */
export async function uncheckPackItems(ids: string[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("pack_items")
    .update({ checked_at: null, checked_by: null })
    .in("id", ids);
  if (error) throw error;
}

/** 그룹 여러 개와 그 항목을 한 번에(「기본 목록으로 시작」) — 빈 목록에만(그룹이 있으면 DB 가 아무것도 하지 않는다), 한 트랜잭션 */
export async function addPackPresets(
  tripId: string,
  kind: PackKind,
  presets: PackPreset[],
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_pack_groups", {
    p_trip: tripId,
    p_kind: kind,
    p_groups: presets,
  });
  if (error) throw error;
}
