import { OFFLINE_CARRY, type OfflineSaveRequest } from "@/shared/api/offline-files";

/** 서비스 워커가 답하지 않으면 실패로 보는 시간 — 큰 사진도 이 안에 받는다 */
const REPLY_MS = 30_000;

/**
 * 서비스 워커에 「이 여행용으로 받아 둬」 하고 맡긴다(화면 · 사진). 받아 넣었으면 true.
 * 서비스 워커가 없으면(개발 서버 · 지원하지 않는 브라우저 · 처음 연 탭이라 아직 제어 전) false
 */
export function saveThroughWorker(req: Omit<OfflineSaveRequest, "type">): Promise<boolean> {
  const worker = typeof navigator === "undefined" ? null : navigator.serviceWorker?.controller;
  if (!worker) return Promise.resolve(false);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), REPLY_MS);
    channel.port1.onmessage = (e: MessageEvent<unknown>) => {
      clearTimeout(timer);
      resolve(e.data === true);
    };
    const message: OfflineSaveRequest = { type: "offline-save", ...req };
    worker.postMessage(message, [channel.port2]);
  });
}

/** 옮기기 요청을 이미 걸었는가 — 앱마다 한 번 */
let carryStarted = false;

/**
 * 받은 여행의 화면을 새 배포로 옮겨 달라고 서비스 워커에 맡긴다 — 지금 한 번(지난번에 끊긴 것), 그리고 새 버전이 켜질 때마다(controllerchange).
 * 옮길 것이 없으면 서비스 워커가 바로 끝낸다. 서비스 워커가 없으면(개발 서버 · 보안 연결이 아님) 아무것도 하지 않는다
 */
export function startTripCarry(): void {
  const sw = typeof navigator === "undefined" ? undefined : navigator.serviceWorker;
  if (!sw || carryStarted) return;
  carryStarted = true;
  const send = () => sw.controller?.postMessage(OFFLINE_CARRY);
  send();
  sw.addEventListener("controllerchange", send);
}
