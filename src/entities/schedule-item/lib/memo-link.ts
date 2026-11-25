/** 날짜 메모 하나에 붙일 수 있는 링크 수 */
export const MEMO_LINK_MAX = 5;

/** 메모 하나에 붙이는 사진 최대 장수 — DB check `memo_photos_ok` 와 같다(0093) */
export const MEMO_PHOTO_MAX = 10;

/** 아는 사이트 — 주소의 호스트 · 경로로 알아보고 카드 제목을 정한다. 위에서부터 먼저 맞는 것 */
const SITES: { match: (host: string, path: string) => boolean; title: string }[] = [
  {
    match: (host, path) =>
      host === "maps.app.goo.gl" ||
      /^maps\.google\./.test(host) ||
      ((/^google\./.test(host) || host === "goo.gl") && path.startsWith("/maps")),
    title: "구글 지도 위치",
  },
  { match: (host) => isSite(host, "kkday.com"), title: "KKday 상품" },
  { match: (host) => isSite(host, "klook.com"), title: "Klook 상품" },
  { match: (host) => isSite(host, "instagram.com"), title: "Instagram 게시물" },
  {
    match: (host) => isSite(host, "youtube.com") || host === "youtu.be",
    title: "YouTube 영상",
  },
  { match: (host) => isSite(host, "tabelog.com"), title: "타베로그 맛집 정보" },
];

/** 그 사이트이거나 그 하위 도메인(m.kkday.com) */
function isSite(host: string, site: string): boolean {
  return host === site || host.endsWith(`.${site}`);
}

/** 주소의 도메인 — 앞의 「www.」 는 뗀다. 주소 모양이 아니면 받은 글 그대로 */
export function linkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * 링크 카드 제목 — 아는 사이트면 그 이름(「구글 지도 위치」), 아니면 도메인.
 * 페이지 제목(OG)은 서버에서 남의 페이지를 받아 와야 해서 가져오지 않는다
 */
export function linkTitleOf(url: string): string {
  const domain = linkDomain(url);
  let path = "";
  try {
    path = new URL(url).pathname;
  } catch {
    return domain;
  }
  return SITES.find((s) => s.match(domain, path))?.title ?? domain;
}

/** 링크 카드 아이콘 칸의 색 차례(0–4) — 같은 도메인은 늘 같은 색 */
export function linkToneOf(domain: string, count: number): number {
  let sum = 0;
  for (const ch of domain) sum += ch.codePointAt(0) ?? 0;
  return sum % count;
}
