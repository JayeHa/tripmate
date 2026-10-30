/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  type PrecacheEntry,
  type RuntimeCaching,
  Serwist,
  type SerwistGlobalConfig,
  type SerwistPlugin,
} from "serwist";

import { isOfflineFileUrl, offlineFileCacheKey } from "@/shared/api/offline-files";

import { START_URL } from "./keep-start-screen";
import { fromSavedTripFiles, fromSavedTripPages, listenForTripMessages } from "./sw-saved-trips";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const DAY = 24 * 60 * 60;

/**
 * 이 배포의 빌드 id — 미리 저장 목록의 `/_next/static/{빌드 id}/_buildManifest.js` 에서 읽는다. 못 찾으면 "dev".
 * 저장해 둔 화면(HTML · RSC)은 그 배포의 JS · CSS 를 가리키는데, 그 파일은 미리 저장에만 있어 새 버전이 오면 지워진다.
 * 화면 캐시 이름에 빌드 id 를 붙여 배포마다 따로 두고, 새 버전이 켜질 때 옛 화면을 지운다 — 스타일 없이 멈춘 화면 대신 「오프라인이에요」
 */
const BUILD_ID =
  (self.__SW_MANIFEST ?? [])
    .map((e) => (typeof e === "string" ? e : e.url))
    .map((url) => /\/_next\/static\/([^/]+)\/_buildManifest\.js$/.exec(url)?.[1])
    .find(Boolean) ?? "dev";

/** 화면 캐시 이름 앞부분 — 옛 배포 것을 지울 때 이것으로 찾는다 */
const PAGE_CACHE_PREFIX = "pages";

/**
 * 화면(HTML) · 화면 이동(RSC) — 연결이 느리면 5초 뒤 저장해 둔 것으로. 해외에서 며칠 오프라인일 수 있어 7일 둔다
 * (더 길게 둘 여행은 「오프라인용으로 받기」 의 칸에 보관 기한까지). 저장해 둔 RSC 가 없으면 Next 가 브라우저 이동으로 바꿔 HTML 을 찾는다
 */
function pageCache(cacheName: string, ...extra: SerwistPlugin[]) {
  return new NetworkFirst({
    cacheName,
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 7 * DAY }),
      savedPageOnly,
      ...extra,
    ],
  });
}

/**
 * 제대로 받은 화면만 남긴다 — 로그인이 풀려 /login 으로 넘어간 응답은 그 주소의 화면이 아니다.
 * 서비스 워커가 직접 받을 때(첫 화면 다시 담기)는 넘어간 뒤의 화면이 오고, 브라우저 이동은 넘김 응답(opaqueredirect, 상태 0)이 온다.
 * 기본 규칙은 상태 0 도 남겨서, 직접 정한다
 */
const savedPageOnly: SerwistPlugin = {
  cacheWillUpdate: ({ response }) =>
    Promise.resolve(response.status === 200 && !response.redirected ? response : null),
};

/** 화면 주소인가 — API · 인증 · 서비스 워커 · 빌드 파일 · 확장자 있는 파일은 아니다 */
function isPagePath(pathname: string): boolean {
  if (/^\/(api|auth|serwist|_next)\//.test(pathname)) return false;
  return !/\.[a-z0-9]+$/i.test(pathname);
}

const rules: RuntimeCaching[] = [
  // 인증(로그인 콜백 · 둘러보기)은 저장하지 않는다 — 주소에 일회용 code 가 들어 있다
  {
    matcher: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith("/auth/"),
    handler: new NetworkOnly(),
  },
  {
    // 바우처 · 쇼핑 사진 — 파일은 키가 바뀌지 않는다(바꾸면 새 키). 한 번 받은 것을 쓴다(본 것만, 2026-10-22 사용자 결정).
    // 서명 주소의 token 은 1시간마다 바뀌어 경로로 찾는다. <img> 요청은 no-cors 라 그대로 저장하면
    // 내용을 알 수 없는 응답(opaque)이 되어, cors 로 다시 받는다. 사진만 남긴다 — 「원본 저장」 이 받는 PDF(20MB 까지)는 빼고,
    // 저장 공간이 모자라면 이 캐시부터 비운다(출처 전체가 지워지면 IndexedDB 의 데이터 캐시도 사라진다)
    matcher: ({ url }) => isOfflineFileUrl(url),
    handler: new CacheFirst({
      cacheName: "trip-files",
      plugins: [
        {
          cacheKeyWillBeUsed: ({ request }) => Promise.resolve(offlineFileCacheKey(request.url)),
          requestWillFetch: ({ request }) =>
            Promise.resolve(new Request(request.url, { mode: "cors", credentials: "omit" })),
          cacheWillUpdate: ({ response }) =>
            Promise.resolve(
              response.ok && response.headers.get("content-type")?.startsWith("image/")
                ? response
                : null,
            ),
        },
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * DAY, purgeOnQuotaError: true }),
        // 「오프라인용으로 받기」 로 받은 사진 — 자동 저장 칸에서 밀려났어도 보이게
        fromSavedTripFiles(),
      ],
    }),
  },
  // 다른 도메인(Supabase 데이터 · 인증, 구글 지도)은 저장하지 않는다 — 데이터는 앱이 IndexedDB 에 따로 두고,
  // 지도는 약관상 저장할 수 없고 스크립트만 남으면 오프라인에서 지도가 반쯤 떠 깨진다
  { matcher: ({ sameOrigin }) => !sameOrigin, handler: new NetworkOnly() },
  {
    // 「/」 는 서버가 늘 첫 화면(내 여행)으로 넘긴다. 넘김 응답은 남길 수 없어 오프라인이면 열리지 않았다 — 여기서 넘긴다
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin && request.mode === "navigate" && url.pathname === "/",
    handler: ({ url }) => Promise.resolve(Response.redirect(new URL(START_URL, url).href, 307)),
  },
  {
    // 도시 사진(내 여행 카드 · 여행 홈) — Next 이미지 최적화를 거쳐 기본 규칙(next-image)은 24시간만 남긴다.
    // 파일 이름에 내용 해시가 붙어 바뀌지 않으니 한 번 받은 것을 데이터 캐시만큼 쓴다 — 오프라인 첫 화면의 사진이 깨지지 않게
    matcher: ({ sameOrigin, url }) =>
      sameOrigin &&
      url.pathname === "/_next/image" &&
      (url.searchParams.get("url") ?? "").startsWith("/city-images/"),
    handler: new CacheFirst({
      cacheName: "city-images",
      plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 61 * DAY })],
    }),
  },
  {
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin &&
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") !== "1" &&
      !url.pathname.startsWith("/api/"),
    handler: pageCache(`${PAGE_CACHE_PREFIX}-rsc-${BUILD_ID}`),
  },
  {
    // 화면 HTML — 브라우저 이동과, 앱 안에서 이동할 때 미리 받아 두는 요청(SerwistProvider 의 cacheOnNavigation)이 함께 쓴다
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin &&
      request.method === "GET" &&
      request.headers.get("RSC") !== "1" &&
      isPagePath(url.pathname),
    // 「오프라인용으로 받기」 로 받은 화면 — 열어 본 적 없어도 오프라인에서 열린다
    handler: pageCache(`${PAGE_CACHE_PREFIX}-html-${BUILD_ID}`, fromSavedTripPages(BUILD_ID)),
  },
  ...defaultCache,
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: rules,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

// 새 버전을 기다리지 않고 바로 쓴다. Serwist 의 skipWaiting 은 스크립트를 처음 읽을 때 한 번만 불러,
// Chrome 에서 새 버전이 설치된 뒤에도 대기(waiting)에 머물렀다 — 설치될 때 다시 부른다
self.addEventListener("install", () => void self.skipWaiting());

// 새 버전이 켜지면 옛 배포의 화면 캐시를 지운다(위 BUILD_ID). 기본 규칙의 미리 받기 RSC(`pages-rsc-prefetch`)도 옛 파일을 가리켜 함께 지운다.
// 받은 여행의 화면(`offline-pages:…`)은 여기서 건드리지 않는다 — activate 가 끝날 때까지 브라우저가 앱의 요청을 모두 붙잡아 두어,
// 새 배포로 옮기기는 페이지가 새 컨트롤러를 얻은 뒤 메시지(`offline-carry`)로 맡긴다
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith(PAGE_CACHE_PREFIX) && !n.endsWith(`-${BUILD_ID}`))
            .map((n) => caches.delete(n)),
        ),
      ),
  );
});

listenForTripMessages(BUILD_ID);

serwist.addEventListeners();
