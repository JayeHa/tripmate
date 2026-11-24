import { isHttpUrl, linkTitleOf, MEMO_LINK_MAX, type PlaceLink } from "@/entities/schedule-item";

/** 글 속의 주소 + 바로 뒤의 공백 한 칸(띄어쓰기 · 탭 · 줄바꿈). 공백까지 쳐야 주소가 끝난 것으로 본다 */
const TYPED_URL = /https?:\/\/[^\s]+([ \t]|(?=\n))/g;

/** 링크 하나 — 제목은 아는 사이트 이름, 아니면 도메인 */
export function linkOf(url: string): PlaceLink {
  return { title: linkTitleOf(url), url };
}

export type PulledLinks = { text: string; links: PlaceLink[]; added: number };

/**
 * 글에서 **다 친 주소**(뒤에 공백 · 줄바꿈이 온 것)를 빼서 링크로 옮긴다. 치는 중인 주소(뒤가 비었거나 글 끝)는 그대로 둔다.
 * 띄어쓰기 · 탭은 주소와 함께 지우고 줄바꿈은 남긴다. 이미 있는 주소는 글에서만 빼고, 링크가 꽉 차면(5) 나머지 주소는 글에 남긴다
 */
export function pullTypedLinks(text: string, links: PlaceLink[]): PulledLinks {
  const next = [...links];
  let added = 0;
  const rest = text.replace(TYPED_URL, (match: string, space: string | undefined) => {
    const url = space ? match.slice(0, -space.length) : match;
    if (!isFullUrl(url)) return match;
    if (next.some((l) => l.url === url)) return "";
    if (next.length >= MEMO_LINK_MAX) return match;
    next.push(linkOf(url));
    added += 1;
    return "";
  });
  return { text: rest, links: next, added };
}

/** http(s) 이고 도메인(점이 있는 호스트)까지 있는 주소 — 「https://」 만 친 것 · 띄어쓰기가 든 것은 아니다 */
function isFullUrl(url: string): boolean {
  if (!isHttpUrl(url) || /\s/.test(url)) return false;
  try {
    return new URL(url).hostname.includes(".");
  } catch {
    return false;
  }
}

/** 붙여넣은 글이 주소 하나뿐이면 그 주소, 아니면 null(글로 붙여넣는다) */
export function pastedUrl(clip: string): string | null {
  const url = clip.trim();
  return isFullUrl(url) ? url : null;
}

/** 링크 입력 줄의 값 — 「https://」 를 빼먹었으면 붙인다. 주소 모양이 아니면 null */
export function typedUrl(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return isFullUrl(url) ? url : null;
}
