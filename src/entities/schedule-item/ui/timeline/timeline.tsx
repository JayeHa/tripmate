"use client";

import { useState } from "react";

import type { TimelineRow } from "../../lib/timeline";
import { ItemCard } from "./item-card";
import { LegLine } from "./leg-line";
import { NumberMarker } from "./number-marker";

type TimelineProps = {
  rows: TimelineRow[];
  onOpen: (row: TimelineRow) => void;
  /** 직전 장소 → 이 장소의 이동 방법 창을 연다 */
  onEditMove: (row: TimelineRow) => void;
};

/** 하루치 일정. 왼쪽 72px 거터에 표식과 시각, x=35 에 세로선 */
export function Timeline({ rows, onOpen, onEditMove }: TimelineProps) {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());

  /** 그 카드의 메모를 펼치거나 접는다 */
  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <ol className="relative pb-6">
      <span aria-hidden="true" className="absolute inset-y-0 left-8.75 w-0.5 bg-divider" />
      {rows.map((row) => (
        <li key={row.item.id} id={`item-${row.item.id}`} className="relative">
          {row.leg && <LegLine leg={row.leg} onEditMove={() => onEditMove(row)} />}
          <div className="flex pr-5 pb-3">
            <div className="flex w-18 shrink-0 flex-col items-center gap-1.5 pt-4.5">
              <NumberMarker kind={row.kind} num={row.num} status={row.status} />
              {row.time && (
                <span className="relative bg-white text-xs font-semibold text-ink-350">
                  {row.time}
                </span>
              )}
            </div>
            <ItemCard
              row={row}
              open={openIds.has(row.item.id)}
              onToggle={() => toggle(row.item.id)}
              onOpen={() => onOpen(row)}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
