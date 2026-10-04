"use client";

import { useState } from "react";

import type { TimelineRow } from "../lib/timeline";

/** 메모가 있어 펼칠 수 있는 줄인지(노트 또는 운영시간) */
export function hasMemo(row: TimelineRow): boolean {
  return row.notes.length > 0 || (!!row.hours && !row.hoursOff);
}

/**
 * 타임라인 카드의 메모 펼침 상태. 「메모 모두 펼치기/접기」가 있어 타임라인 밖(화면)에서 쥔다.
 * 날짜를 바꿔도 다른 날 카드의 상태는 남는다(id 단위).
 */
export function useOpenMemos(rows: TimelineRow[]) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const memoIds = rows.filter(hasMemo).map((row) => row.item.id);
  const allOpen = memoIds.length > 0 && memoIds.every((id) => openIds.has(id));

  /** 카드 하나를 펼치거나 접는다 */
  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** 그날 메모 있는 카드를 모두 펼치거나, 모두 펼쳐져 있으면 모두 접는다 */
  function toggleAll() {
    setOpenIds((prev) => {
      const next = new Set(prev);
      for (const id of memoIds) {
        if (allOpen) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  return { openIds, toggle, toggleAll, allOpen, hasMemos: memoIds.length > 0 };
}
