import {
  MEMO_MAX,
  type PlaceLink,
  planLinksOf,
  type ScheduleItem,
  splitStar,
  withStar,
} from "@/entities/schedule-item";
import { isTimeValue } from "@/shared/lib/time-input";

/** 날짜 메모 창의 칸 — 시간(「HH:mm」 · "") · 글(★ 앞머리 뺀 것) · 중요 · 홈에 고정 · 링크 */
export type NoteDraft = {
  time: string;
  body: string;
  starred: boolean;
  pinned: boolean;
  links: PlaceLink[];
};

/** 새 메모면 빈 칸, 고치는 메모면 그 note 일정의 값 */
export function noteDraftOf(item: ScheduleItem | null): NoteDraft {
  if (!item) return { time: "", body: "", starred: false, pinned: false, links: [] };
  const { starred, rest } = splitStar(item.name ?? "");
  return {
    time: item.start_time?.slice(0, 5) ?? "",
    body: rest,
    starred,
    pinned: item.pinned_by !== null,
    links: planLinksOf(item),
  };
}

type CheckResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * 저장할 글(제목 칸) — 앞뒤 공백을 떼고 1~500자, 중요면 「★ 」 를 앞에. 시간 칸이 틀렸으면 오류.
 * 시간 칸은 확정이 틀리면 친 그대로를 넘긴다 — 옛 시간이 조용히 남지 않게 여기서 막는다
 */
function checkDraft(draft: NoteDraft): CheckResult {
  const body = draft.body.trim();
  if (!body) return { ok: false, error: "메모를 입력해 주세요" };
  if (body.length > MEMO_MAX) return { ok: false, error: `메모는 ${MEMO_MAX}자까지 쓸 수 있어요` };
  if (draft.time && !isTimeValue(draft.time)) return { ok: false, error: "시간을 확인해 주세요" };
  return { ok: true, text: withStar(body, draft.starred) };
}

/** 새 메모로 넣을 값 — 고정한 사람은 화면이 넣는다 */
export type NewNoteValue = { text: string; time: string | null; links: PlaceLink[] };

export type NewNoteResult = { ok: true; value: NewNoteValue } | { ok: false; error: string };

/** 새 날짜 메모 칸 → 넣을 값 */
export function toNewNote(draft: NoteDraft): NewNoteResult {
  const checked = checkDraft(draft);
  if (!checked.ok) return checked;
  return { ok: true, value: { text: checked.text, time: draft.time || null, links: draft.links } };
}

/** 날짜 메모에서 고칠 수 있는 칸 */
type NotePatch = {
  name?: string;
  start_time?: string | null;
  pinned_by?: string | null;
  links?: PlaceLink[];
};

export type NotePatchResult = { ok: true; patch: NotePatch } | { ok: false; error: string };

/**
 * 고친 칸 중 연 때(initial)와 **달라진 칸만** — 그사이 일행이 바꾼 다른 칸을 덮지 않게.
 * 고정을 바꿨으면 pinnedBy(저장할 고정한 사람, 끄면 null)를 적는다. 바뀐 칸이 없으면 빈 patch
 */
export function toNotePatch(
  draft: NoteDraft,
  initial: NoteDraft,
  pinnedBy: string | null,
): NotePatchResult {
  const checked = checkDraft(draft);
  if (!checked.ok) return checked;
  const patch: NotePatch = {};
  if (checked.text !== withStar(initial.body.trim(), initial.starred)) patch.name = checked.text;
  if (draft.time !== initial.time) patch.start_time = draft.time || null;
  if (draft.pinned !== initial.pinned) patch.pinned_by = pinnedBy;
  if (JSON.stringify(draft.links) !== JSON.stringify(initial.links)) patch.links = draft.links;
  return { ok: true, patch };
}
