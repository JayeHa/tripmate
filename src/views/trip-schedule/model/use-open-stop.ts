import { useState } from "react";

import type { DayMode } from "@/entities/schedule-item";

/**
 * 레이아웃의 펼친(고른) 카드와 「계획 | 기록」 바꾸기. 보기를 바꾸면 펼친 카드를 닫는다.
 * 기록 모드에서는 카드를 펼치지 않는다 — 모바일은 눌러도 아무 일 없고, PC 는 고르기만 한다(selectInRecord)
 */
export function useOpenStop(
  mode: DayMode,
  onModeChange: (mode: DayMode) => void,
  selectInRecord: boolean,
) {
  const [openId, setOpenId] = useState<string | null>(null);
  return {
    openId,
    setOpenId,
    /** 카드를 눌렀다 — 펼치기 · 접기 */
    toggle: (id: string) => {
      if (mode === "record" && !selectInRecord) return;
      setOpenId((open) => (open === id ? null : id));
    },
    /** 「계획 | 기록」 을 바꿨다 */
    changeMode: (next: DayMode) => {
      setOpenId(null);
      onModeChange(next);
    },
  };
}
