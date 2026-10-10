"use client";

import { useEffect, useRef, useState } from "react";

import type { DirectAddRequest } from "@/features/schedule/add-schedule";

/**
 * 일정 추가 창과 그 안의 「직접 추가」 로 여는 장소 입력 폼.
 * 담으면 두 창을 모두 닫고 담은 날을 보인다(onDone). 일정 추가에 아직 담지 않은 고른 곳이 있으면 그 창은 닫지 않고 한 줄 알린다(닫으면 고른 곳이 사라진다)
 */
export function useDirectAdd(onDone: (day: number) => void) {
  // 일정 추가 창을 연 날(그 날짜의 「일정 추가」 · 플로팅). null 이면 닫혀 있다
  const [addDay, setAddDay] = useState<number | null>(null);
  const [direct, setDirect] = useState<DirectAddRequest | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const directRef = useRef(direct);
  useEffect(() => {
    directRef.current = direct;
  }, [direct]);

  /**
   * 직접 추가 요청 하나의 담기가 끝났다. 폼은 저장 중에 닫히지 않지만 오프라인으로 멈춘 동안은 닫을 수 있어서,
   * 그 폼이 이미 닫혔으면(다른 요청이 열렸거나 아무것도 없으면) 창 닫기 · 날짜 이동을 하지 않는다
   */
  function finish(req: DirectAddRequest) {
    if (directRef.current !== req) return;
    setDirect(null);
    if (req.pendingCount > 0) {
      setNotice(
        `직접 추가한 곳을 day ${req.dayIndex + 1}에 담았어요. 고른 ${req.pendingCount}곳은 아직 담지 않았어요`,
      );
      return;
    }
    setAddDay(null);
    onDone(req.dayIndex);
  }

  return {
    addDay,
    /** 그 날로 일정 추가 창을 연다 */
    open: (day: number) => {
      setNotice(null);
      setAddDay(day);
    },
    close: () => setAddDay(null),
    notice,
    direct,
    setDirect,
    finish,
  };
}
