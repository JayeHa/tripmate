import type { Expense } from "../model/types";

/** 비용 하나에 다는 태그 수 — `expenses_tags_chk`(0081)와 같다 */
export const TAG_LIMIT = 5;

/** 태그 하나의 글자 수 — `expenses_tags_chk`(0081)와 같다 */
export const TAG_MAX_LENGTH = 20;

/** 입력한 태그를 다듬는다 — 앞의 「#」 과 앞뒤 공백을 떼고 20자로 자른다. 남는 게 없으면 "" */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim().slice(0, TAG_MAX_LENGTH).trim();
}

/**
 * 태그를 붙인 목록 — 빈 값 · 이미 붙은 것(대소문자 무시) · 5개가 찬 목록이면 그대로 돌려준다.
 * 이미 붙은 것과 대소문자만 다르면 붙은 쪽을 남긴다(「Asics」 와 「asics」 가 둘 다 생기지 않게)
 */
export function addTag(tags: readonly string[], raw: string): string[] {
  const tag = normalizeTag(raw);
  if (!tag || tags.length >= TAG_LIMIT) return [...tags];
  if (tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return [...tags];
  return [...tags, tag];
}

/**
 * 이 여행에서 쓴 태그 — 많이 쓴 순, 같으면 가나다순. 입력 칸의 고를 수 있는 칩으로 보인다.
 * 예전에 기기에 남은 목록에는 칸이 없을 수 있다(undefined)
 */
export function tripTags(expenses: readonly Pick<Expense, "tags">[]): string[] {
  const count = new Map<string, number>();
  for (const e of expenses) {
    for (const t of e.tags ?? []) count.set(t, (count.get(t) ?? 0) + 1);
  }
  return [...count].toSorted(([a, x], [b, y]) => y - x || a.localeCompare(b, "ko")).map(([t]) => t);
}

/** 상세의 「태그」 줄 — 「런닝 · 치이카와」. 없으면 "" */
export function tagsText(tags: readonly string[] | undefined): string {
  return (tags ?? []).join(" · ");
}

/** 두 태그 목록이 같은가 — 순서까지 본다(붙인 순서대로 보인다) */
export function sameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((t, i) => t === b[i]);
}
