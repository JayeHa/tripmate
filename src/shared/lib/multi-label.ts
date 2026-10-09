/** 여럿 고른 칩의 글 — 고른 것이 없으면 null, 하나면 그 이름, 여럿이면 「정원 외 1」 */
export function multiLabel(picked: string[]): string | null {
  if (picked.length === 0) return null;
  return picked.length === 1 ? picked[0] : `${picked[0]} 외 ${picked.length - 1}`;
}
