import { isHttpUrl, linkListOf, type Memo, MEMO_MAX } from "@/entities/schedule-item";
import type { LinkDraft } from "@/shared/ui/link-rows";

/** 메모 작성 칸의 값 — 입력 칸이 다루는 그대로. pinned 는 「홈에 고정」 */
export type MemoDraft = { body: string; starred: boolean; pinned: boolean; links: LinkDraft[] };

/** 새 메모면 빈 칸, 고치는 메모면 그 메모 값 */
export function memoDraftOf(memo: Memo | null): MemoDraft {
  if (!memo) return { body: "", starred: false, pinned: false, links: [] };
  return {
    body: memo.body,
    starred: memo.starred,
    pinned: memo.pinned_by !== null,
    links: linkListOf(memo.links).map((l) => ({ ...l })),
  };
}

export type MemoPayload = { body: string; starred: boolean; pinned: boolean; links: LinkDraft[] };

/**
 * 저장할 고정한 사람 — 고정을 끄면 null. 이미 고정돼 있었으면 처음 고정한 사람을 그대로 두고, 새로 고정하면 나.
 * 체크리스트 · 바우처의 pinned_by 와 같다
 */
export function pinnedByOf(pinned: boolean, before: string | null, me: string): string | null {
  if (!pinned) return null;
  return before ?? me;
}

export type MemoDraftResult = { ok: true; value: MemoPayload } | { ok: false; error: string };

/** 두 저장 값이 같은지 — 고치기에서 바뀐 게 없으면 보내지 않는다(그사이 일행이 고친 글을 연 때 글로 덮지 않게) */
export function samePayload(a: MemoPayload, b: MemoPayload): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * 저장할 메모 칸으로. 본문은 앞뒤 공백을 떼고 1~500자(DB check 와 같다), 빈 링크 줄은 버리고
 * 주소가 http(s) 가 아니면 오류
 */
export function toMemoPayload(draft: MemoDraft): MemoDraftResult {
  const body = draft.body.trim();
  if (!body) return { ok: false, error: "메모를 입력해 주세요" };
  if (body.length > MEMO_MAX) return { ok: false, error: `메모는 ${MEMO_MAX}자까지 쓸 수 있어요` };
  const links = draft.links
    .map((l) => ({ title: l.title.trim(), url: l.url.trim() }))
    .filter((l) => l.url);
  if (links.some((l) => !isHttpUrl(l.url))) {
    return { ok: false, error: "링크 주소는 http:// 나 https:// 로 시작해야 해요" };
  }
  return { ok: true, value: { body, starred: draft.starred, pinned: draft.pinned, links } };
}
