/** 이름 규칙. 한글·영어·숫자·밑줄·띄어쓰기, 최대 12자. */
export const DISPLAY_NAME_MAX = 12;
const DISPLAY_NAME_RE = /^[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z0-9_ ]+$/;

export function isValidDisplayName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= DISPLAY_NAME_MAX && DISPLAY_NAME_RE.test(trimmed);
}

/** 아바타에 쓸 첫 글자. 이모지를 쪼개지 않도록 코드포인트로 자른다. */
export function initialOfName(name: string | null | undefined): string {
  return [...(name?.trim() ?? "")][0] ?? "?";
}
