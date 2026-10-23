import { createClient } from "@/shared/api/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/shared/api/supabase/database.types";
import { isDuplicateKey, type SyncResult, updateLatestWins } from "@/shared/api/sync";

import type { Memo } from "../model/memo";

/** 여행의 메모 전부. 일정마다 모으는 건 부른 쪽(memosByItem) */
export async function fetchMemos(tripId: string): Promise<Memo[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("memos")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at");
  if (error) throw error;
  return data;
}

/**
 * 메모를 쓴다 — 오프라인 대기열로 올라온다. id 는 화면에서 만들어, 같은 메모가 두 번 올라가도 하나만 생긴다(이미 있으면 그 버전을 돌려준다).
 * 작성자는 DB 트리거가 나로 채운다. 돌려주는 값은 서버의 updated_at — 이어서 고치는 저장이 비교할 버전
 */
export async function createMemo(memo: TablesInsert<"memos"> & { id: string }): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.from("memos").insert(memo).select("updated_at").single();
  if (!error) return data.updated_at;
  if (!isDuplicateKey(error)) throw error;
  const existing = await supabase.from("memos").select("updated_at").eq("id", memo.id).single();
  if (existing.error) throw existing.error;
  return existing.data.updated_at;
}

/** 그 사이 일행이 지워 고칠 메모가 없다 — 부른 쪽이 이 문구를 그대로 보인다 */
export const MEMO_GONE = "이미 지워진 메모예요";

/** 메모 글 칸 — 멤버 누구나 고친다. 작성자는 바뀌지 않는다 */
export type MemoPatch = Pick<TablesUpdate<"memos">, "body" | "starred" | "links">;

/**
 * 메모를 고친다 — 오프라인 대기열로 올라온다. 본 버전(version)이면 그대로, 그사이 일행이 고쳤으면 내 것으로 덮는다(나중 수정 우선).
 * 지워졌으면 MEMO_GONE
 */
export function updateMemo(id: string, patch: MemoPatch, version: string): Promise<SyncResult> {
  const supabase = createClient();
  return updateLatestWins(
    (onlyIf) => {
      const q = supabase.from("memos").update(patch).eq("id", id);
      return (onlyIf ? q.eq("updated_at", onlyIf) : q).select("updated_at");
    },
    version,
    MEMO_GONE,
  );
}

/**
 * 메모를 지운다 — 오프라인 대기열로 올라온다. 본 버전이면 그대로, 그사이 일행이 고쳤으면 그래도 지우고 알린다(overwrote).
 * 이미 지워졌으면 그대로 끝 — 같은 삭제가 두 번 올라가도 결과가 같다
 */
export async function deleteMemo(id: string, version: string): Promise<SyncResult> {
  const supabase = createClient();
  try {
    return await updateLatestWins(
      (onlyIf) => {
        const q = supabase.from("memos").delete().eq("id", id);
        return (onlyIf ? q.eq("updated_at", onlyIf) : q).select("updated_at");
      },
      version,
      MEMO_GONE,
    );
  } catch (e) {
    if (e instanceof Error && e.message === MEMO_GONE)
      return { updatedAt: version, overwrote: false };
    throw e;
  }
}
