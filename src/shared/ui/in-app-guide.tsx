"use client";

import { Copy, ExternalLink } from "lucide-react";

import { type InApp, kakaoOpenExternalUrl } from "@/shared/lib/install-prompt";
import { Button } from "@/shared/ui/button";

type InAppGuideProps = {
  inApp: InApp;
  /** 제목을 그리는 컴포넌트 — 창이면 그 창의 제목(읽기 프로그램이 창 이름으로 읽는다) */
  Title: React.ComponentType<{ className?: string; children: React.ReactNode }>;
  onClose: () => void;
  /** 주소를 복사했을 때 — 토스트는 화면이 그린다 */
  onCopied: () => void;
};

/** 바깥 브라우저로 여는 메뉴 안내 — Android 카카오톡은 버튼 하나로 넘긴다 */
function menuText(inApp: InApp, browser: string): string {
  if (inApp.android && inApp.kakao)
    return `「${browser}에서 열기」를 누르면 ${browser}에서 이어서 열려요.`;
  const more = inApp.android ? "⋮" : "⋯";
  return `오른쪽 위 ${more} → 「다른 브라우저로 열기」를 누르면 ${browser}에서 이어서 열려요.`;
}

/**
 * 앱 안 브라우저(카카오톡 · 인스타그램 · 네이버 앱 등)에서 — 홈 화면에 추가할 수 없어 바깥 브라우저(iPhone Safari · Android Chrome)로 열게 한다.
 * 메뉴를 못 찾을 때를 위해 「주소 복사」, Android 카카오톡은 「Chrome에서 열기」 로 바로 넘긴다
 */
export function InAppGuide({ inApp, Title, onClose, onCopied }: InAppGuideProps) {
  const browser = inApp.android ? "Chrome" : "Safari";
  const direct = inApp.android && inApp.kakao;

  /** 지금 주소를 복사한다 — 실패하면(권한 없음) 조용히 넘어간다 */
  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      onCopied();
    } catch {
      // 복사할 수 없는 브라우저 — 메뉴 안내가 남아 있다
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Title className="text-[19px] font-extrabold tracking-[-0.01em] text-ink-900">
          {browser}에서 열어 주세요
        </Title>
        <p className="text-sm leading-[1.6] text-pretty text-ink-500">
          {inApp.name} 안에서는 홈 화면에 추가할 수 없어요. {menuText(inApp, browser)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="chip"
          size="form"
          className="h-11.5 flex-1 rounded-button font-bold"
          onClick={onClose}
        >
          닫기
        </Button>
        {direct ? (
          <Button
            size="form"
            className="h-11.5 flex-1 font-bold"
            onClick={() => location.assign(kakaoOpenExternalUrl(location.href))}
          >
            <ExternalLink className="size-4" />
            {browser}에서 열기
          </Button>
        ) : (
          <Button size="form" className="h-11.5 flex-1 font-bold" onClick={() => void copy()}>
            <Copy className="size-4" />
            주소 복사
          </Button>
        )}
      </div>
    </div>
  );
}
