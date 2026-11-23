/** 중요 메모의 앞머리 — 날짜 메모는 note 일정의 제목 한 칸이라 ★ 를 글 앞에 붙여 둔다 */
const STAR = "★ ";

/** 메모 카드에 그릴 글 — 중요인지 · 제목(첫 줄) · 본문(나머지 줄) */
export type MemoParts = { starred: boolean; title: string; body: string };

/** 날짜 메모 글 → 중요 앞머리를 떼고 첫 줄 = 제목, 나머지 = 본문(앞뒤 빈 줄은 뗀다) */
export function memoParts(text: string): MemoParts {
  const starred = text.startsWith(STAR);
  const rest = starred ? text.slice(STAR.length) : text;
  const cut = rest.indexOf("\n");
  if (cut < 0) return { starred, title: rest.trim(), body: "" };
  return { starred, title: rest.slice(0, cut).trim(), body: rest.slice(cut + 1).trim() };
}
