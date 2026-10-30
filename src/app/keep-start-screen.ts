/** 앱을 열면 가장 먼저 보이는 화면(내 여행) — manifest 의 start_url 과 같다 */
export const START_URL = "/trips";

/**
 * 서비스 워커에 다시 담아 달라고 할 화면 — 첫 화면과, 지금 보는 화면이 여행 화면이면 그것도.
 * 로그인 · 인증 콜백 같은 다른 주소는 담지 않는다(콜백은 주소만 불러도 서버 동작이 돈다)
 */
export function startScreenUrls(pathname: string): string[] {
  return pathname.startsWith(START_URL) && pathname !== START_URL
    ? [START_URL, pathname]
    : [START_URL];
}

/** 이미 걸었는가 — 앱마다 한 번 */
let started = false;

/** 기기에 저장해 둔 화면이 없는 주소만 — 캐시를 읽을 수 없으면(보안 연결이 아님) 전부 */
async function missing(urls: string[]): Promise<string[]> {
  if (typeof caches === "undefined") return urls;
  const hits = await Promise.all(urls.map((u) => caches.match(u).catch(() => undefined)));
  return urls.filter((_, i) => !hits[i]);
}

/** 서비스 워커에 화면을 담아 달라고 한다(Serwist 의 CACHE_URLS) — 화면 규칙(NetworkFirst)을 거쳐 그 배포의 화면 칸에 들어간다 */
function cacheUrls(worker: ServiceWorker | null, urls: string[]): void {
  if (!worker || urls.length === 0 || !navigator.onLine) return;
  worker.postMessage({ type: "CACHE_URLS", payload: { urlsToCache: urls } });
}

/**
 * 오프라인에서도 첫 화면(내 여행)이 열리게 서비스 워커의 화면 칸에 담아 둔다.
 *
 * 화면은 열 때 저장되지만, 새 버전이 켜지면 옛 배포의 화면을 지운다(그 화면의 JS · CSS 가 사라져서). 첫 화면은 앱을 열 때 브라우저 이동으로만
 * 지나가서 — 옛 서비스 워커가 옛 칸에 담고, 곧바로 켜진 새 버전이 그 칸을 지워 — 다시 담기지 않았다. 앱 안의 이동(pushState)만 담는 Serwist 의
 * cacheOnNavigation 은 뒤로 가기로 돌아올 때도 담지 않는다.
 *
 * - 새 버전이 켜지면(controllerchange, 처음 설치 포함) 늘 담는다
 * - 앱을 열 때 · 연결이 돌아올 때는 기기에 없을 때만 — 7일 · 64개 제한으로 밀려났을 수 있다
 *
 * 서비스 워커가 없으면(개발 서버 · 지원하지 않는 브라우저) 아무것도 하지 않는다
 */
export function keepStartScreen(): void {
  const sw = typeof navigator === "undefined" ? undefined : navigator.serviceWorker;
  if (!sw || started) return;
  started = true;
  const urls = () => startScreenUrls(location.pathname);
  const fillMissing = () => void missing(urls()).then((m) => cacheUrls(sw.controller, m));
  sw.addEventListener("controllerchange", () => cacheUrls(sw.controller, urls()));
  window.addEventListener("online", fillMissing);
  fillMissing();
}
