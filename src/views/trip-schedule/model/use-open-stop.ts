import { useState } from "react";

import type { DayMode } from "@/entities/schedule-item";

/**
 * 레이아웃의 펼친(고른) 카드와 「계획 | 기록」 바꾸기. 보기를 바꾸면 펼친 카드를 닫는다.
 * 기록 모드에서도 카드를 누르면 펼친다 — 펼친 카드 맨 아래에 방문 토글(다녀왔어요 · 패스)이 있다
 */
export function useOpenStop(mode: DayMode, onModeChange: (mode: DayMode) => void) {
  const [openId, setOpenId] = useState<string | null>(null);
  return {
    openId,
    setOpenId,
    /** 카드를 눌렀다 — 펼치기 · 접기 */
    toggle: (id: string) => setOpenId((open) => (open === id ? null : id)),
    /** 「계획 | 기록」 을 바꿨다 */
    changeMode: (next: DayMode) => {
      setOpenId(null);
      onModeChange(next);
    },
  };
}
