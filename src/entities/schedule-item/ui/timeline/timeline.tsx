import { cn } from "@/shared/lib/utils";

import type { TimelineRow } from "../../lib/timeline";
import type { MemoAuthor } from "../../model/memo";
import { ItemCard } from "./item-card";
import { LegLine } from "./leg-line";
import { NumberMarker } from "./number-marker";

type TimelineProps = {
  rows: TimelineRow[];
  /** 메모를 펼친 카드. 「메모 모두 펼치기」 때문에 화면이 쥔다(useOpenMemos) */
  openIds: ReadonlySet<string>;
  onToggleMemo: (id: string) => void;
  onOpen: (row: TimelineRow) => void;
  /**
   * 직전 장소 → 이 장소의 이동 방법 창을 연다. 넘기지 않으면 「+ 이동 방법」을 그리지 않는다.
   * 이동 기록을 아직 못 불러왔을 때가 그렇다. 빈 창에서 저장하면 같은 쌍의 기존 기록을 덮어쓴다.
   */
  onEditMove?: (row: TimelineRow) => void;
  /** 지도에 강조된 장소. 그 행 전체(거터 포함)에 옅은 파란 배경을 깐다 */
  focusId?: string | null;
  /** 메모 작성자 표시(여행 멤버에서 찾는다). 모르면 null */
  authorOf: (authorId: string | null) => MemoAuthor | null;
};

/**
 * 하루치 일정. 왼쪽 72px 거터에 표식과 시각, x=35 에 세로선.
 * 핀이 있는 장소 행에는 `data-focus-id` 를 단다 — 화면이 스크롤 기준선을 지난 행을 찾을 때 쓴다.
 */
export function Timeline({
  rows,
  openIds,
  onToggleMemo,
  onOpen,
  onEditMove,
  focusId,
  authorOf,
}: TimelineProps) {
  return (
    // isolate: 강조 배경(-z-10)을 이 목록 안에 가둬 세로선 아래 · 페이지 배경 위에 깐다
    // pt-2: 강조 배경이 행 위로 8px 더 나오므로, 첫 행의 배경이 위 day 헤더에 닿지 않게 비운다
    <ol className="relative isolate pt-2 pb-6">
      <span aria-hidden="true" className="absolute inset-y-0 left-8.75 w-0.5 bg-divider" />
      {rows.map((row) => {
        const focused = focusId === row.item.id;
        return (
          <li key={row.item.id} id={`item-${row.item.id}`} className="relative">
            {row.leg && (
              <LegLine leg={row.leg} onEditMove={onEditMove && (() => onEditMove(row))} />
            )}
            <div
              data-focus-id={row.num != null ? row.item.id : undefined}
              className="relative flex pr-5 pb-3"
            >
              {/* 강조 배경. 카드 위에 붙지 않게 행보다 8px 위에서 시작한다(아래는 행의 pb-3 이 비운다) */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 -top-2 bottom-0 -z-10 bg-row-focus transition-opacity duration-250",
                  !focused && "opacity-0",
                )}
              />
              <div className="flex w-18 shrink-0 flex-col items-center gap-1.5 pt-4.5">
                <NumberMarker kind={row.kind} num={row.num} status={row.status} />
                {row.time && (
                  // 세로선을 가리는 바탕. 강조 배경과 같은 시간에 같은 색으로 바뀐다
                  <span
                    className={cn(
                      "relative text-xs font-semibold text-ink-350 transition-colors duration-250",
                      focused ? "bg-row-focus" : "bg-white",
                    )}
                  >
                    {row.time}
                  </span>
                )}
              </div>
              <ItemCard
                row={row}
                open={openIds.has(row.item.id)}
                onToggle={() => onToggleMemo(row.item.id)}
                onOpen={() => onOpen(row)}
                authorOf={authorOf}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
