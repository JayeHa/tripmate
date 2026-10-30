"use client";

import { useEffect, useState } from "react";

import { promptInstall, useInstallMode } from "@/shared/lib/install-prompt";

import {
  countVisit,
  dismissNudge,
  NUDGE_KEY,
  type NudgeState,
  parseNudge,
  shouldNudge,
} from "../lib/nudge-rules";

/** 화면이 자리 잡은 뒤에 띄운다 — 들어오자마자 덮지 않게 */
const SHOW_DELAY_MS = 1200;

/** 이번에 앱을 연 뒤 방문을 셌는가 · 띄웠는가 — 내 여행과 여행 홈을 오가도 한 번만 */
let visitCounted = false;
let shownThisLoad = false;

/** 기록을 읽는다 — 저장소가 막혀 있으면 처음 상태 */
function read(): NudgeState {
  try {
    return parseNudge(localStorage.getItem(NUDGE_KEY));
  } catch {
    return parseNudge(null);
  }
}

/** 기록을 쓴다 — 막혀 있으면 이번 화면에서만 기억한다(다음에 또 뜰 수 있다) */
function write(state: NudgeState): void {
  try {
    localStorage.setItem(NUDGE_KEY, JSON.stringify(state));
  } catch {
    // 사생활 모드 · 막힌 저장소
  }
}

/** 다른 창(시트 · 모달 · 확인창)이 열려 있는가 — 열린 창은 data-open 을 단다 */
function anotherDialogOpen(): boolean {
  return (
    document.querySelector('[role="dialog"][data-open], [role="alertdialog"][data-open]') !== null
  );
}

/**
 * 「홈 화면에 추가」 안내 시트를 띄울지 정한다 — 내 여행 · 여행 홈의 모바일 화면이 부른다.
 *
 * - 앱을 열 때마다 한 번 방문을 세고, 두 번째 방문부터(앱 안 브라우저는 첫 방문에도) 띄운다
 * - 안내 방식이 없으면(앱으로 열었음 · 설치할 수 없는 브라우저 · 아직 설치 이벤트 전) 띄우지 않는다. Android 는 설치 이벤트가 조금 늦게 와서 오면 다시 본다
 * - 다른 창이 열려 있으면 이번에는 띄우지 않는다
 * - 닫으면 14일 쉬고 세 번 닫으면 그만. 「설치」 는 닫은 것으로 세지 않는다(설치하면 다시 이벤트가 오지 않는다)
 *
 * @param enabled 모바일 화면인가 — PC 에서는 계정 메뉴로만 연다
 */
export function useInstallNudge(enabled: boolean, onInstalled: () => void) {
  const mode = useInstallMode();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || visitCounted) return;
    visitCounted = true;
    write(countVisit(read()));
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !mode || shownThisLoad) return;
    const timer = setTimeout(() => {
      if (shownThisLoad || anotherDialogOpen()) return;
      if (!shouldNudge(read(), { now: Date.now(), inApp: mode === "in-app" })) return;
      shownThisLoad = true;
      setOpen(true);
    }, SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, mode]);

  useEffect(() => {
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, [onInstalled]);

  /** 「나중에」 · ✕ · 바깥 누르기 */
  function dismiss() {
    write(dismissNudge(read(), Date.now()));
    setOpen(false);
  }

  /** 「설치」 — 시트를 닫고 브라우저의 설치 창을 띄운다 */
  function install() {
    setOpen(false);
    void promptInstall().catch(() => false);
  }

  return { open, mode, dismiss, install };
}
