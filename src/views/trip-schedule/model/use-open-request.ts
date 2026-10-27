"use client";

import { useState } from "react";

import type { TimelineRow } from "@/entities/schedule-item";
import { useOpenParam } from "@/shared/lib/use-open-param";

/**
 * 다른 화면이 주소(`?open=일정id`)로 보낸 「이 일정 열기」 요청 — 홈 미리 보기의 「일정에서 보기」.
 * 줄이 준비되면(ready) 그 줄을 누른 것처럼 한 번 open 을 부르고 요청을 지운다. 없는 일정이면 열지 않고 버린다
 */
export function useOpenRequest(
  ready: boolean,
  rows: readonly TimelineRow[],
  open: (row: TimelineRow) => void,
) {
  const [requested, setRequested] = useState(useOpenParam());
  if (!requested || !ready) return;
  setRequested(null);
  const row = rows.find((r) => r.item.id === requested);
  if (row) open(row);
}
