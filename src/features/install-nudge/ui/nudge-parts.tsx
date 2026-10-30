"use client";

import { ArrowDown, Maximize2, Smartphone, WifiOff, X } from "lucide-react";
import Image from "next/image";
import { createPortal } from "react-dom";

import { cn } from "@/shared/lib/utils";
import { SheetTitle } from "@/shared/ui/sheet";

/** 설치하면 좋은 점 — Android 「설치」 시트 */
const PERKS = [
  { icon: Smartphone, text: "홈 화면에서 바로 열려요" },
  { icon: WifiOff, text: "인터넷이 없어도 일정·바우처를 봐요" },
  { icon: Maximize2, text: "주소창 없이 넓은 화면으로 봐요" },
] as const;

type NudgeHeaderProps = {
  /** 이름 아래 작은 글 — 「설치」 는 주소(흐리게), iPhone 은 좋은 점 한 줄 */
  sub: string;
  subMuted?: boolean;
  onClose: () => void;
};

/** 앱 아이콘 · 「홈 화면에 tripmate 추가」 · ✕ */
export function NudgeHeader({ sub, subMuted = false, onClose }: NudgeHeaderProps) {
  return (
    <div className="flex items-center gap-3.5">
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={52}
        height={52}
        // 기기에 미리 저장된 아이콘 파일을 그대로 — 이미지 최적화를 거치면 오프라인에서 비고, 작은 그림이라 줄일 것도 없다
        unoptimized
        className="size-13 shrink-0 rounded-card"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <SheetTitle className="text-[19px] font-extrabold tracking-[-0.01em] text-ink-900">
          홈 화면에 tripmate 추가
        </SheetTitle>
        <span className={cn("text-[13px]", subMuted ? "text-ink-400" : "text-ink-500")}>{sub}</span>
      </div>
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="flex self-start text-ink-400"
      >
        <X className="size-5.5" strokeWidth={2} />
      </button>
    </div>
  );
}

/** 좋은 점 세 줄 */
export function NudgePerks() {
  return (
    <ul className="flex flex-col gap-3">
      {PERKS.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-memo bg-surface-muted">
            <Icon className="size-4.5 text-ink-700" aria-hidden />
          </span>
          <span className="text-[15px] text-ink-900">{text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Safari 는 공유 버튼이 화면 아래 막대에 있다 — 시트 맨 아래에서 짚는다 */
export function ShareBelowHint() {
  return (
    <p className="flex items-center justify-center gap-1 text-[13px] font-bold text-brand-text">
      <ArrowDown className="size-3.75" aria-hidden />
      아래 공유 버튼
    </p>
  );
}

/**
 * 오른쪽 위 브라우저 버튼(iOS Chrome 공유 · 앱 안 브라우저 ⋯)을 짚는 말풍선 — 브라우저 막대는 웹 화면 밖이라 화면 맨 위 오른쪽에서 위를 가리킨다.
 * 시트의 어두운 막보다 위에 그려야 해서 body 로 띄운다(누를 수 없는 그림)
 */
export function TapHereBubble() {
  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed top-2.5 right-3.5 z-60 flex flex-col items-end"
    >
      <span className="mr-2.5 size-0 border-x-7 border-b-7 border-x-transparent border-b-ink-900" />
      <span className="rounded-memo bg-ink-900 px-3 py-2 text-[13px] font-bold text-white">
        여기를 눌러요
      </span>
    </div>,
    document.body,
  );
}
