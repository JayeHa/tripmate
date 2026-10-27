import { MEMO_MAX, type ScheduleItem } from "@/entities/schedule-item";
import { isTimeValue } from "@/shared/lib/time-input";

/** 중요 날짜 메모의 앞머리. 날짜 메모는 note 일정의 제목 한 칸이라 ★ 를 글 앞에 붙여 둔다 */
const STAR = "★ ";

export type DayMemoResult = { ok: true; text: string } | { ok: false; error: string };

/** 새 날짜 메모 글 — 앞뒤 공백을 떼고 1~500자, 중요면 「★ 」 를 앞에 */
export function toDayMemoText(body: string, starred: boolean): DayMemoResult {
  const text = body.trim();
  if (!text) return { ok: false, error: "메모를 입력해 주세요" };
  if (text.length > MEMO_MAX) return { ok: false, error: `메모는 ${MEMO_MAX}자까지 쓸 수 있어요` };
  return { ok: true, text: starred ? `${STAR}${text}` : text };
}

/** 날짜 메모 고치기 칸 — 시간(「HH:mm」 · "") · 글 · 홈에 고정 */
export type NoteDraft = { time: string; text: string; pinned: boolean };

/** note 일정에서 고치기 칸의 처음 값 */
export function noteDraftOf(item: ScheduleItem): NoteDraft {
  return {
    time: item.start_time?.slice(0, 5) ?? "",
    text: item.name ?? "",
    pinned: item.pinned_by !== null,
  };
}

/** 날짜 메모에서 고칠 수 있는 칸 */
type NotePatch = { name?: string; start_time?: string | null; pinned_by?: string | null };

export type NotePatchResult = { ok: true; patch: NotePatch } | { ok: false; error: string };

/**
 * 고친 칸 중 연 때(initial)와 **달라진 칸만** — 그사이 일행이 바꾼 다른 칸을 덮지 않게. 글은 1~500자.
 * 고정을 바꿨으면 pinnedBy(저장할 고정한 사람, 끄면 null)를 적는다. 바뀐 칸이 없으면 빈 patch
 */
export function toNotePatch(
  draft: NoteDraft,
  initial: NoteDraft,
  pinnedBy: string | null,
): NotePatchResult {
  const text = draft.text.trim();
  if (!text) return { ok: false, error: "메모를 입력해 주세요" };
  if (text.length > MEMO_MAX) return { ok: false, error: `메모는 ${MEMO_MAX}자까지 쓸 수 있어요` };
  // 시간 칸은 확정이 틀리면 친 그대로를 넘긴다 — 옛 시간이 조용히 남지 않게 여기서 막는다
  if (draft.time && !isTimeValue(draft.time)) return { ok: false, error: "시간을 확인해 주세요" };
  const patch: NotePatch = {};
  if (text !== initial.text.trim()) patch.name = text;
  if (draft.time !== initial.time) patch.start_time = draft.time || null;
  if (draft.pinned !== initial.pinned) patch.pinned_by = pinnedBy;
  return { ok: true, patch };
}
