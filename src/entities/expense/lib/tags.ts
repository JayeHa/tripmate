import type { Expense } from "../model/types";

/** 비용 하나에 다는 태그 수 — `expenses_tags_chk`(0081)와 같다 */
export const TAG_LIMIT = 5;

/** 태그 하나의 글자 수 — `expenses_tags_chk`(0081)와 같다 */
export const TAG_MAX_LENGTH = 20;

/** 입력한 태그를 다듬는다 — 앞의 「#」 과 앞뒤 공백을 떼고 20자로 자른다. 남는 게 없으면 "" */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, "").trim().slice(0, TAG_MAX_LENGTH).trim();
}

/** 같은 태그인가 — 대소문자는 보지 않는다(「Asics」 = 「asics」) */
export function sameTag(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** 이 목록에 붙어 있는가 — 대소문자 무시 */
export function hasTag(tags: readonly string[], tag: string): boolean {
  return tags.some((t) => sameTag(t, tag));
}

/**
 * 태그를 붙인 목록 — 빈 값 · 이미 붙은 것 · 5개가 찬 목록이면 그대로 돌려준다(대소문자 무시).
 * 여행에 이미 있는 태그(`known`)와 대소문자만 다르면 그 표기로 붙인다 — 「Asics」 와 「asics」 가 따로 집계되지 않게
 */
export function addTag(
  tags: readonly string[],
  raw: string,
  known: readonly string[] = [],
): string[] {
  const typed = normalizeTag(raw);
  if (!typed || tags.length >= TAG_LIMIT || hasTag(tags, typed)) return [...tags];
  return [...tags, known.find((t) => sameTag(t, typed)) ?? typed];
}

/** 태그를 뗀 목록 — 대소문자 무시 */
export function removeTag(tags: readonly string[], tag: string): string[] {
  return tags.filter((t) => !sameTag(t, tag));
}

/**
 * 이 여행에서 쓴 태그 — 많이 쓴 순, 같으면 가나다순. 입력 칸의 고를 수 있는 칩으로 보인다.
 * 대소문자만 다른 태그는 하나로 세고 먼저 나온 표기를 쓴다(이 기능 전에 갈라진 것이 있어도 칩이 둘 생기지 않게).
 * 예전에 기기에 남은 목록에는 칸이 없을 수 있다(undefined)
 */
export function tripTags(expenses: readonly Pick<Expense, "tags">[]): string[] {
  const seen = new Map<string, { label: string; count: number }>();
  for (const e of expenses) {
    for (const t of e.tags ?? []) {
      const key = t.toLowerCase();
      const hit = seen.get(key);
      if (hit) hit.count += 1;
      else seen.set(key, { label: t, count: 1 });
    }
  }
  return [...seen.values()]
    .toSorted((a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"))
    .map((t) => t.label);
}

/** 상세의 「태그」 줄 — 「런닝 · 치이카와」. 없으면 "" */
export function tagsText(tags: readonly string[] | undefined): string {
  return (tags ?? []).join(" · ");
}

/** 두 태그 목록이 같은가 — 순서까지 본다(붙인 순서대로 보인다) */
export function sameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((t, i) => t === b[i]);
}
