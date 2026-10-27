import { itemName, type Memo, memosByItem, type ScheduleItem } from "@/entities/schedule-item";

import { memoPeek, type Peek, type PeekContext } from "./peek";
import { bySchedule } from "./pre-board";

/** 날짜 메모는 note 일정의 제목 한 칸이라 ★ 중요를 글 앞의 「★ 」 로 둔다(일정 화면의 날짜 메모 창과 같은 규칙) */
const DAY_MEMO_STAR = "★ ";

/** 고정한 메모 한 장 — where 는 「day 2 · 도쿄 스카이트리」 · 「day 1 메모」, peek 은 눌렀을 때의 미리 보기 */
export type PinnedMemo = { id: string; body: string; starred: boolean; where: string; peek: Peek };

/** 날짜 메모 한 장 — ★ 앞머리를 떼고 중요 표시로 */
function dayMemoCard(item: ScheduleItem, ctx: PeekContext): PinnedMemo {
  const name = item.name ?? "";
  const starred = name.startsWith(DAY_MEMO_STAR);
  const body = starred ? name.slice(DAY_MEMO_STAR.length) : name;
  return {
    id: item.id,
    body,
    starred,
    where: `day ${item.day_index + 1} 메모`,
    peek: memoPeek(item, { body, starred }, ctx),
  };
}

/**
 * 「홈에 고정」 한 메모 — 장소에 단 메모와 날짜 메모. 일정 순서대로(같은 일정의 메모는 쓴 순).
 * ★ 중요인지는 홈에 뜨는 것과 상관없다 — 고정한 것만 뜨고, 중요면 노란 칸으로 구분한다
 */
export function pinnedMemos(memos: Memo[], items: ScheduleItem[], ctx: PeekContext): PinnedMemo[] {
  const pinned = memosByItem(memos.filter((m) => m.pinned_by !== null));
  return bySchedule(items).flatMap((item): PinnedMemo[] => {
    if (item.kind === "note") return item.pinned_by ? [dayMemoCard(item, ctx)] : [];
    const where = `day ${item.day_index + 1} · ${itemName(item)}`;
    return (pinned.get(item.id) ?? []).map((m) => ({
      id: m.id,
      body: m.body,
      starred: m.starred,
      where,
      peek: memoPeek(item, m, ctx),
    }));
  });
}
