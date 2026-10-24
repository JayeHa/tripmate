"use client";

import { useSyncExternalStore } from "react";

/**
 * 「홈 화면에 앱 추가」 를 어떻게 안내할지 — 설치 창을 띄울 수 있으면 「설치하기」(Chrome · Edge),
 * iOS Safari 는 공유 메뉴 3단계, 둘 다 아니면 null(이미 설치해 앱으로 열었거나 설치할 수 없는 브라우저 — 항목을 숨긴다)
 */
export type InstallMode = "prompt" | "ios" | null;

/** Chrome · Edge 가 설치할 수 있을 때 보내는 이벤트 — 표준 타입에 없다 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: BeforeInstallPromptEvent | null = null;
let capturing = false;
const listeners = new Set<() => void>();

/** 바뀐 것을 알린다 */
function notify(): void {
  listeners.forEach((fn) => fn());
}

/**
 * 설치 이벤트를 받아 둔다 — 앱이 뜰 때 한 번 부른다. 이벤트는 페이지마다 한 번, 서비스 워커가 켜진 직후 오므로
 * 메뉴를 열 때 들으면 놓친다. 브라우저가 스스로 띄우는 설치 안내는 막고 메뉴의 「설치하기」 로만 띄운다
 */
export function captureInstallPrompt(): void {
  if (typeof window === "undefined" || capturing) return;
  capturing = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    notify();
  });
}

/** iOS 의 다른 브라우저 · 인앱 브라우저 — UA 에 Safari 가 들어 있어도 Safari 가 아니다 */
const NOT_SAFARI =
  /CriOS|FxiOS|EdgiOS|OPiOS|KAKAOTALK|NAVER|Line\/|Instagram|FBAN|FBAV|DaumApps|Whale/;

/**
 * iPhone · iPad 의 Safari 인가 — 3단계 안내가 「Safari 아래쪽 공유 버튼」 이라 Safari 에서만 맞다.
 * 인앱 브라우저(카카오톡 등)는 홈 화면에 추가할 수 없고, iOS Chrome · Edge 는 공유 버튼이 위에 있다.
 * iPadOS 는 데스크톱 Safari 처럼 「Macintosh」 로 알려 터치로 가른다
 */
export function isIosSafari(userAgent: string, maxTouchPoints: number): boolean {
  const ios =
    /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  return ios && /Version\/.*Safari\//.test(userAgent) && !NOT_SAFARI.test(userAgent);
}

/** 안내 방식 — 이미 앱으로 열었으면 없음, 설치 창을 띄울 수 있으면 그것, 아니면 iOS Safari 만 3단계 */
export function installModeOf(env: {
  standalone: boolean;
  canPrompt: boolean;
  ios: boolean;
}): InstallMode {
  if (env.standalone) return null;
  if (env.canPrompt) return "prompt";
  return env.ios ? "ios" : null;
}

/** 지금 안내 방식 — 기기 · 브라우저에서 읽는다 */
function snapshot(): InstallMode {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return installModeOf({
    standalone,
    canPrompt: deferred !== null,
    ios: isIosSafari(navigator.userAgent, navigator.maxTouchPoints),
  });
}

/** 설치 이벤트 변화를 듣는다 */
function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 「홈 화면에 앱 추가」 안내 방식 — 서버 렌더 · 하이드레이션 동안은 null(항목이 나중에 나타난다) */
export function useInstallMode(): InstallMode {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

/**
 * 브라우저의 설치 창을 띄운다 — 설치했으면 true. 이벤트는 한 번만 쓸 수 있어, 닫아도 다음에 브라우저가 다시 보낼 때까지 「설치하기」 가 사라진다
 */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  deferred = null;
  await event.prompt();
  const { outcome } = await event.userChoice;
  notify();
  return outcome === "accepted";
}
