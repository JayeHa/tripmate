"use client";

import { useCallback } from "react";

import { type InApp, type InstallMode, useInApp } from "@/shared/lib/install-prompt";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { useMediaQuery } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { InAppGuide } from "@/shared/ui/in-app-guide";
import { InstallSteps } from "@/shared/ui/install-steps";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import { useInstallNudge } from "../model/use-install-nudge";
import { NudgeHeader, NudgePerks, ShareBelowHint, TapHereBubble } from "./nudge-parts";

type InstallNudgeProps = {
  /** 토스트는 화면이 그린다 — 설치 끝 · 주소 복사 */
  onToast: (text: string) => void;
};

/**
 * 모바일 브라우저로 열었을 때 「홈 화면에 추가」 를 권하는 바텀시트 — 내 여행 · 여행 홈에 하나씩 둔다.
 * 띄우는 때는 useInstallNudge. 내용은 브라우저마다 다르다:
 * Android = 좋은 점 세 줄 + 「설치」(브라우저 설치 창) · iPhone Safari = 아래 공유 버튼 3단계 ·
 * iPhone Chrome · Edge = 주소창 오른쪽 공유 버튼 3단계 + 말풍선 · 앱 안 브라우저 = 바깥 브라우저로 열기 + 말풍선
 */
export function InstallNudge({ onToast }: InstallNudgeProps) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const onInstalled = useCallback(() => onToast("홈 화면에 추가했어요"), [onToast]);
  const { open, mode, dismiss, install } = useInstallNudge(desktop === false, onInstalled);
  const shown = useHeldWhileClosing(open, mode);
  const inApp = useInApp();

  return (
    <Sheet open={open} onOpenChange={(next) => !next && dismiss()}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "gap-4 rounded-t-sheet border-t-0 px-5 pt-6 shadow-sheet",
          // iPhone 3단계는 아래 「공유 버튼」 짚기가 막대 바로 위에 오게 덜 띄운다
          shown === "ios" || shown === "ios-top"
            ? "pb-[calc(1rem+env(safe-area-inset-bottom))]"
            : "pb-[calc(1.875rem+env(safe-area-inset-bottom))]",
        )}
      >
        {shown === "in-app" && inApp ? (
          <InAppGuide
            inApp={inApp}
            Title={SheetTitle}
            onClose={dismiss}
            onCopied={() => onToast("주소를 복사했어요")}
          />
        ) : (
          <NudgeBody mode={shown} onClose={dismiss} onInstall={install} />
        )}
        {open && pointsUp(shown, inApp) && <TapHereBubble />}
      </SheetContent>
    </Sheet>
  );
}

/** 오른쪽 위 브라우저 버튼을 짚을 때인가 — iOS Chrome 공유 · 앱 안 브라우저 메뉴(Android 카카오톡은 버튼으로 바로 넘겨 필요 없다) */
function pointsUp(mode: InstallMode, inApp: InApp | null): boolean {
  if (mode === "ios-top") return true;
  return mode === "in-app" && !(inApp?.android && inApp.kakao);
}

type NudgeBodyProps = { mode: InstallMode; onClose: () => void; onInstall: () => void };

/** 앱 아이콘 머리 + 브라우저별 내용 — Android 「설치」, iPhone 3단계 */
function NudgeBody({ mode, onClose, onInstall }: NudgeBodyProps) {
  if (mode === "prompt") {
    return (
      <div className="flex flex-col gap-5">
        <NudgeHeader sub={location.host} subMuted onClose={onClose} />
        <NudgePerks />
        <div className="flex flex-col gap-1">
          <Button size="cta" className="w-full" onClick={onInstall}>
            설치
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 text-[15px] font-semibold text-ink-400"
          >
            나중에
          </button>
        </div>
      </div>
    );
  }
  const top = mode === "ios-top";
  return (
    <div className="flex flex-col gap-4">
      <NudgeHeader sub="앱처럼 열고, 인터넷 없이도 봐요" onClose={onClose} />
      <InstallSteps share={top ? "top" : "bottom"} />
      {top ? (
        <p className="text-center text-xs text-ink-400">iOS 16.4 이상 · Edge도 같은 자리예요</p>
      ) : (
        <ShareBelowHint />
      )}
    </div>
  );
}
