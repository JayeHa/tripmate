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
} from "serwist";

import { isOfflineFileUrl, offlineFileCacheKey } from "@/shared/api/offline-files";

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
 * 화면(HTML) · 화면 이동(RSC) — 연결이 느리면 5초 뒤 저장해 둔 것으로. 해외에서 며칠 오프라인일 수 있어
 * 데이터 캐시(IndexedDB, 7일)와 같은 기간을 둔다. 저장해 둔 RSC 가 없으면 Next 가 브라우저 이동으로 바꿔 HTML 을 찾는다
 */
function pageCache(cacheName: string) {
  return new NetworkFirst({
    cacheName,
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 7 * DAY })],
  });
}

/** 화면 주소인가 — API · 인증 · 서비스 워커 · 빌드 파일 · 확장자 있는 파일은 아니다 */
function isPagePath(pathname: string): boolean {
  if (/^\/(api|auth|serwist|_next)\//.test(pathname)) return false;
  return !/\.[a-z0-9]+$/i.test(pathname);
}

const rules: RuntimeCaching[] = [
  {
    // 바우처 · 쇼핑 사진 — 파일은 키가 바뀌지 않는다(바꾸면 새 키). 한 번 받은 것을 쓴다(본 것만, 2026-10-22 사용자 결정).
    // 서명 주소의 token 은 1시간마다 바뀌어 경로로 찾는다. <img> 요청은 no-cors 라 그대로 저장하면
    // 내용을 알 수 없는 응답(opaque)이 되어, cors 로 다시 받는다
    matcher: ({ url }) => isOfflineFileUrl(url),
    handler: new CacheFirst({
      cacheName: "trip-files",
      plugins: [
        {
          cacheKeyWillBeUsed: ({ request }) => Promise.resolve(offlineFileCacheKey(request.url)),
          requestWillFetch: ({ request }) =>
            Promise.resolve(new Request(request.url, { mode: "cors", credentials: "omit" })),
        },
        new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * DAY }),
      ],
    }),
  },
  // 다른 도메인(Supabase 데이터 · 인증, 구글 지도)은 저장하지 않는다 — 데이터는 앱이 IndexedDB 에 따로 두고,
  // 지도는 약관상 저장할 수 없고 스크립트만 남으면 오프라인에서 지도가 반쯤 떠 깨진다
  { matcher: ({ sameOrigin }) => !sameOrigin, handler: new NetworkOnly() },
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
    handler: pageCache(`${PAGE_CACHE_PREFIX}-html-${BUILD_ID}`),
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

// 새 버전이 켜지면 옛 배포의 화면 캐시를 지운다(위 BUILD_ID). 기본 규칙의 미리 받기 RSC(`pages-rsc-prefetch`)도 옛 파일을 가리켜 함께 지운다
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

serwist.addEventListeners();
