/// <reference lib="esnext" />
/// <reference lib="webworker" />
import type { SerwistPlugin } from "serwist";

import {
  isOfflineFileUrl,
  isOfflineSaveRequest,
  isTripFilesCacheName,
  offlineFileCacheKey,
  type OfflineSaveRequest,
  parseTripPagesCacheName,
  tripFilesCacheName,
  tripPagesCacheName,
} from "@/shared/api/offline-files";

declare const self: ServiceWorkerGlobalScope;

/** 새 버전으로 옮길 때 한 번에 다시 받는 화면 수 — 서버를 몰아치지 않게 */
const CARRY_BATCH = 4;

/** 주소의 여행 id — `/trips/{id}/…` 가 아니면 null */
function tripIdOf(pathname: string): string | null {
  return /^\/trips\/([^/]+)\//.exec(pathname)?.[1] ?? null;
}

/**
 * 화면 하나를 받아 그 여행의 화면 칸에 넣는다 — 같은 출처의 그 여행 화면만. 로그인이 풀려 다른 화면으로 넘어갔으면 넣지 않는다.
 * 검색 파라미터(`?day=`)는 화면 안에서만 쓰여 빼고 넣는다
 */
async function savePage(tripId: string, href: string, buildId: string): Promise<boolean> {
  const url = new URL(href, self.location.origin);
  if (url.origin !== self.location.origin || tripIdOf(url.pathname) !== tripId) return false;
  const res = await fetch(url.origin + url.pathname, { credentials: "same-origin" });
  if (!res.ok || res.redirected || !res.headers.get("content-type")?.includes("text/html")) {
    return false;
  }
  await (
    await caches.open(tripPagesCacheName(tripId, buildId))
  ).put(url.origin + url.pathname, res);
  return true;
}

/** 사진 하나를 받아 그 여행의 사진 칸에 넣는다 — 자동 저장(`trip-files`)과 같이 token 을 뺀 경로로, 사진만 */
async function saveFile(tripId: string, href: string): Promise<boolean> {
  if (!isOfflineFileUrl(new URL(href))) return false;
  const res = await fetch(href, { mode: "cors", credentials: "omit" });
  if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) return false;
  await (await caches.open(tripFilesCacheName(tripId))).put(offlineFileCacheKey(href), res);
  return true;
}

/** 받기 요청 하나를 처리한다 — 서버에 닿지 못했으면 false */
function save(req: OfflineSaveRequest, buildId: string): Promise<boolean> {
  const run =
    req.kind === "page" ? savePage(req.tripId, req.url, buildId) : saveFile(req.tripId, req.url);
  return run.catch(() => false);
}

/** 페이지의 받기 요청을 듣는다 — 결과(true/false)를 함께 온 포트로 돌려준다 */
export function listenForTripSaves(buildId: string): void {
  self.addEventListener("message", (event) => {
    if (!isOfflineSaveRequest(event.data)) return;
    const port = event.ports[0];
    event.waitUntil(save(event.data, buildId).then((ok) => port?.postMessage(ok)));
  });
}

/**
 * 자동 저장 칸에 없는 화면을 받은 여행의 칸에서 찾는다(이 배포 것만). 오프라인으로 열었는데 열어 본 적 없는 화면이어도 보이게.
 * 자동 저장 칸의 만료 검사(ExpirationPlugin) 뒤에 둔다 — 오래돼 빠진 화면도 받은 칸에서 채운다
 */
export function fromSavedTripPages(buildId: string): SerwistPlugin {
  return {
    cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
      if (cachedResponse) return cachedResponse;
      const url = new URL(request.url);
      const tripId = tripIdOf(url.pathname);
      const name = tripId && tripPagesCacheName(tripId, buildId);
      if (!name || !(await caches.has(name))) return null;
      return (await (await caches.open(name)).match(url.origin + url.pathname)) ?? null;
    },
  };
}

/** 자동 저장 칸에 없는 사진을 받은 여행들의 사진 칸에서 찾는다 — 사진 주소에는 여행이 드러나지 않아 칸을 모두 본다 */
export function fromSavedTripFiles(): SerwistPlugin {
  return {
    cachedResponseWillBeUsed: async ({ cachedResponse, request }) => {
      if (cachedResponse) return cachedResponse;
      const names = (await caches.keys()).filter(isTripFilesCacheName);
      for (const name of names) {
        const hit = await (await caches.open(name)).match(request.url);
        if (hit) return hit;
      }
      return null;
    },
  };
}

/**
 * 새 버전이 켜질 때 — 받은 여행의 옛 배포 화면을 새 배포로 다시 받고 옛 칸을 지운다. 옛 화면은 이제 없는 JS · CSS 를 가리켜 쓸 수 없다.
 * 새 버전은 온라인에서만 설치되니 보통 받을 수 있다. 못 받은 화면은 빠진다(다시 「오프라인용으로 받기」 를 누르면 채워진다)
 */
export async function carryTripPages(buildId: string): Promise<void> {
  const old = (await caches.keys()).flatMap((name) => {
    const parsed = parseTripPagesCacheName(name);
    return parsed && parsed.buildId !== buildId ? [{ name, tripId: parsed.tripId }] : [];
  });
  for (const { name, tripId } of old) {
    const urls = (await (await caches.open(name)).keys()).map((r) => r.url);
    for (let i = 0; i < urls.length; i += CARRY_BATCH) {
      const batch = urls.slice(i, i + CARRY_BATCH);
      await Promise.all(batch.map((url) => savePage(tripId, url, buildId).catch(() => false)));
    }
    await caches.delete(name);
  }
}
