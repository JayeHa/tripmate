import { postJson } from "@/shared/api/post-json";
import { createClient } from "@/shared/api/supabase/client";

import { voucherFileKeys } from "../lib/voucher";
import type { Voucher, VoucherSave } from "../model/types";

/** 고치려는 바우처가 없다 — 그사이 일행이 지웠다 */
export const VOUCHER_GONE = "이미 지워진 바우처예요";

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

/** 파일 하나를 저장소에 올린다 — 서명 주소를 받아 그 주소로 PUT. 키를 돌려준다(바우처에는 아직 붙지 않는다) */
export async function uploadVoucherFile(tripId: string, file: Blob): Promise<string> {
  const { key, url } = await callVouchers<{ key: string; url: string }>({
    action: "upload",
    tripId,
    mime: file.type,
    size: file.size,
  });
  const put = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) throw new Error(`upload ${put.status}`);
  return key;
}

/** 저장소의 파일을 지운다 — 실패해도 던지지 않는다(남은 파일은 따로 정리한다, #155) */
export async function removeVoucherFiles(tripId: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await callVouchers({ action: "remove", tripId, keys }).catch(() => undefined);
}

/**
 * keys 가운데 다른 바우처(exceptId 말고)가 아직 쓰는 키. 그림 키는 DB 가 겹침을 막지 않아서(files.md 「키 겹침」),
 * 파일을 지우기 전에 이것을 빼고 지운다. 못 읽으면 모두 쓰는 것으로 본다(지우지 않는 쪽이 안전하다)
 */
export async function fetchVoucherKeysInUse(
  tripId: string,
  keys: string[],
  exceptId: string | null,
): Promise<Set<string>> {
  if (keys.length === 0) return new Set();
  const supabase = createClient();
  let query = supabase
    .from("vouchers")
    .select("id, file_key, thumb_key, page_keys")
    .eq("trip_id", tripId);
  if (exceptId) query = query.neq("id", exceptId);
  const { data, error } = await query;
  if (error) return new Set(keys);
  const used = new Set(data.flatMap((v) => [v.file_key, v.thumb_key, ...v.page_keys]));
  return new Set(keys.filter((k) => used.has(k)));
}

/** 넣거나 고친다 — 바우처 id 를 돌려준다. 고칠 줄이 없으면(그사이 지워졌다 · RLS 0행) 던진다 */
export async function saveVoucher(tripId: string, save: VoucherSave): Promise<string> {
  const supabase = createClient();
  if (save.id === null) {
    const { data, error } = await supabase
      .from("vouchers")
      .insert({ ...save.fields, trip_id: tripId })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
  const { data, error } = await supabase
    .from("vouchers")
    .update(save.fields)
    .eq("id", save.id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(VOUCHER_GONE);
  return save.id;
}

/** 홈에 고정 · 풀기 — 고정한 사람을 남긴다(null 이면 푼다). 0행이면 던진다 */
export async function setVoucherPin(id: string, pinnedBy: string | null): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .update({ pinned_by: pinnedBy })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(VOUCHER_GONE);
}

/** 「사용했어요」 · 되돌리기 — 표시한 시각(null 이면 되돌린다). 0행이면 던진다 */
export async function setVoucherUsed(id: string, usedAt: string | null): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .update({ used_at: usedAt })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) throw new Error(VOUCHER_GONE);
}

/**
 * 지우기 — 줄을 지운 뒤 그 줄의 원본 · 그림 · 썸네일 가운데 다른 바우처가 쓰지 않는 키만 저장소에서 지운다(files.md 「키 겹침」).
 * 이미 지워졌으면(0행) 그대로 끝낸다 — 지우려던 결과와 같고, 파일은 지운 쪽이 정리했다
 */
export async function deleteVoucher(tripId: string, id: string): Promise<void> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vouchers")
    .delete()
    .eq("id", id)
    .select("file_key, thumb_key, page_keys");
  if (error) throw error;
  const keys = data.flatMap((v) => voucherFileKeys(v));
  const inUse = await fetchVoucherKeysInUse(tripId, keys, id);
  await removeVoucherFiles(
    tripId,
    keys.filter((k) => !inUse.has(k)),
  );
}
