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

/** 숫자 끝자리를 읽을 때 받침이 있는지 — 일 · 삼 · 육 · 칠 · 팔 · 영(십) 은 있고, 이 · 사 · 오 · 구 는 없다 */
const DIGIT_HAS_JONG = [true, true, false, true, false, false, true, true, true, false];

/** 「이에요/예요」 — 「day 1이에요」 · 「day 2예요」. 숫자는 읽는 소리로, 그 밖은 마지막 글자의 받침으로 */
export function ieyo(word: string): string {
  const last = word.trim().at(-1) ?? "";
  if (/\d/.test(last)) return DIGIT_HAS_JONG[Number(last)] ? "이에요" : "예요";
  const jong = jongOf(word);
  if (jong === null) return "이에요";
  return jong === 0 ? "예요" : "이에요";
}

/** 「이/가」 — 받침이 있으면 「이」, 없으면 「가」. 한글로 끝나지 않으면 「이(가)」 */
export function iGa(word: string): string {
  const jong = jongOf(word);
  if (jong === null) return "이(가)";
  return jong === 0 ? "가" : "이";
}
