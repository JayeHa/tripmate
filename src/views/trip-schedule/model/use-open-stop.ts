import { useState } from "react";

import type { DayMode } from "@/entities/schedule-item";

/**
 * 레이아웃의 펼친(고른) 카드와 「계획 | 기록」 바꾸기. 보기를 바꾸면 펼친 카드를 닫는다.
 * 기록 모드에서는 카드를 펼치지 않는다 — onRecordTap 이 있으면(모바일 — 일정 상세) 그것을 부르고,
 * 없으면(PC — 지도와 맞추려고) 고르기만 한다. 모바일 상세는 잘못 누른 「다녀왔어요」 를 되돌리는 「방문」 줄 · 메모가 있는 곳이다
 */
export function useOpenStop(
  mode: DayMode,
  onModeChange: (mode: DayMode) => void,
  onRecordTap?: (id: string) => void,
) {
  const [openId, setOpenId] = useState<string | null>(null);
  return {
    openId,
    setOpenId,
    /** 카드를 눌렀다 — 펼치기 · 접기 */
    toggle: (id: string) => {
      if (mode === "record" && onRecordTap) {
        onRecordTap(id);
        return;
      }
      setOpenId((open) => (open === id ? null : id));
    },
    /** 「계획 | 기록」 을 바꿨다 */
    changeMode: (next: DayMode) => {
      setOpenId(null);
      onModeChange(next);
    },
  };
}
