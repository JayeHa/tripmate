/**
 * 「로/으로」 — 마지막 글자에 받침이 있으면(ㄹ 받침은 빼고) 「으로」, 없으면 「로」.
 * 한글로 끝나지 않으면(「T3」 · 「豚」) 읽는 소리를 몰라 「(으)로」
 */
export function euro(word: string): string {
  const last = word.trim().at(-1);
  if (!last) return "(으)로";
  const code = last.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "(으)로";
  const jong = code % 28;
  // 0 = 받침 없음, 8 = ㄹ
  return jong === 0 || jong === 8 ? "로" : "으로";
}
