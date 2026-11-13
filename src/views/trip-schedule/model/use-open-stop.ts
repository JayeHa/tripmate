import { useState } from "react";

import type { DayMode } from "@/entities/schedule-item";

import { keepPlace, type ScrollPlace } from "./keep-place";

/**
 * 레이아웃의 펼친(고른) 카드와 「계획 | 기록」 바꾸기. 보기를 바꾸면 펼친 카드를 닫고, 보던 날짜 머리 · 장소가 같은 자리에 있게 스크롤을 맞춘다(place).
 * 기록 모드에서도 카드를 누르면 펼친다 — 펼친 카드 맨 아래에 방문 토글(다녀왔어요 · 패스)이 있다
 */
export function useOpenStop(
  mode: DayMode,
  onModeChange: (mode: DayMode) => void,
  place: ScrollPlace,
) {
  const [openId, setOpenId] = useState<string | null>(null);
  return {
    openId,
    setOpenId,
    /** 카드를 눌렀다 — 펼치기 · 접기 */
    toggle: (id: string) => setOpenId((open) => (open === id ? null : id)),
    /** 「계획 | 기록」 을 바꿨다 */
    changeMode: (next: DayMode) => {
      keepPlace(place, () => {
        setOpenId(null);
        onModeChange(next);
      });
    },
  };
}
