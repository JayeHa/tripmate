/** 마지막 글자의 받침 번호(0 = 없음). 한글로 끝나지 않으면 null */
function jongOf(word: string): number | null {
  const last = word.trim().at(-1);
  if (!last) return null;
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  return code % 28;
}

/**
 * 「로/으로」 — 마지막 글자에 받침이 있으면(ㄹ 받침은 빼고) 「으로」, 없으면 「로」.
 * 한글로 끝나지 않으면(「T3」 · 「豚」) 읽는 소리를 몰라 「(으)로」
 */
export function euro(word: string): string {
  const jong = jongOf(word);
  if (jong === null) return "(으)로";
  // 0 = 받침 없음, 8 = ㄹ
  return jong === 0 || jong === 8 ? "로" : "으로";
}

/** 「을/를」 — 받침이 있으면 「을」, 없으면 「를」. 한글로 끝나지 않으면 「을(를)」 */
export function eulReul(word: string): string {
  const jong = jongOf(word);
  if (jong === null) return "을(를)";
  return jong === 0 ? "를" : "을";
}
