/**
 * 썸네일 색(여행 · 도시). 사진이 없을 때 첫 글자와 틴트 원으로 대신한다.
 * 같은 제목이면 늘 같은 색이 나오도록 글자 코드 합으로 고른다.
 */
const TINTS = [
  { bg: "#E8F1FF", fg: "#1F6FEB" },
  { bg: "#E3F6F3", fg: "#0F766E" },
  { bg: "#FDE8EA", fg: "#C2283A" },
  { bg: "#FEF3DC", fg: "#B45309" },
  { bg: "#F1ECFE", fg: "#6D28D9" },
] as const;

export function tintOf(title: string) {
  const sum = [...title].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TINTS[sum % TINTS.length];
}

/** 제목 첫 글자. 서로게이트 페어(이모지)를 쪼개지 않도록 코드포인트로 자른다. */
export function initialOf(title: string) {
  return [...title][0] ?? "?";
}
