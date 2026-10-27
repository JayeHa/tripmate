import { X } from "lucide-react";
import type { ElementType } from "react";

import { PinToggle } from "@/shared/ui/pin-toggle";

type PanelHeaderProps = {
  /** 「체크리스트」 · 「체크리스트 편집」 · 「체크리스트 추가」 */
  heading: string;
  pinned: boolean;
  onPin: () => void;
  /** 고정 요청이 가 있는 동안 */
  pinDisabled?: boolean;
  onClose: () => void;
  /** 저장 · 삭제 중 */
  closeDisabled?: boolean;
  /** 제목 요소 — 모바일 시트는 DialogTitle(창 이름), PC 칸은 h2 */
  titleAs?: ElementType;
};

/** 체크리스트 창 머리(56) — 제목 18/800 · 「홈에 고정」 알약(고정되면 블루 「고정됨」) · ✕ */
export function PanelHeader({
  heading,
  pinned,
  onPin,
  pinDisabled = false,
  onClose,
  closeDisabled = false,
  titleAs: Title = "h2",
}: PanelHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2.5 px-5">
      <Title className="flex-1 text-lg font-extrabold text-ink-900">{heading}</Title>
      <PinToggle pinned={pinned} onToggle={onPin} disabled={pinDisabled} />
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        disabled={closeDisabled}
        className="flex text-ink-400 disabled:opacity-40"
      >
        <X className="size-5.5" strokeWidth={2} />
      </button>
    </div>
  );
}
