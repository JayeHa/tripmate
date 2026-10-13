import { Clock, Link as LinkIcon, Pin } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { CheckMark } from "@/shared/ui/check-mark";

import { dueView } from "../lib/due";
import type { ChecklistItem } from "../model/types";

type ChecklistRowProps = {
  item: ChecklistItem;
  /** 오늘(「YYYY-MM-DD」) — 마감 D-day */
  today: string;
  /** 체크박스 — 완료 ↔ 해야 할 것 */
  onToggle: () => void;
  /** 행을 누르면 그 항목을 연다. 없으면 누를 수 없다 */
  onOpen?: () => void;
};

/**
 * 체크리스트 한 줄 — 체크박스(22 · r6) · 제목(완료면 회색 취소선) · 홈 고정 핀, 아래 메타(마감 칩 · 링크 수).
 * 마감 칩은 7일 안(지난 것 포함)이면 주황, 완료한 항목에는 보이지 않는다. 체크박스는 행 누르기와 따로 동작한다
 */
export function ChecklistRow({ item, today, onToggle, onOpen }: ChecklistRowProps) {
  const linkCount = Array.isArray(item.links) ? item.links.length : 0;
  const done = item.status === "done";
  const due = item.due_date && !done ? dueView(item.due_date, today) : null;
  return (
    <div className="relative flex items-start gap-3 rounded-card border border-line-card bg-white px-4 py-3.5">
      <button
        type="button"
        onClick={onToggle}
        aria-label={done ? `${item.title} 완료 취소` : `${item.title} 완료로 표시`}
        aria-pressed={done}
        className="relative z-10 -m-2.5 flex shrink-0 p-2.5"
      >
        <CheckMark checked={done} shape="square" className="mt-px" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start gap-1.5">
          {onOpen ? (
            <button
              type="button"
              onClick={onOpen}
              className={cn(TITLE, done && TITLE_DONE, "text-left after:absolute after:inset-0")}
            >
              {item.title}
            </button>
          ) : (
            <span className={cn(TITLE, done && TITLE_DONE)}>{item.title}</span>
          )}
          {item.pinned_by && (
            <Pin className="mt-0.75 size-3.5 shrink-0 text-primary" aria-label="홈에 고정됨" />
          )}
        </div>
        {(due !== null || linkCount > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {due && (
              <span
                className={cn(
                  "flex h-5.5 items-center gap-1 rounded-full px-2 text-xs font-bold",
                  due.soon
                    ? "bg-checklist-due-bg text-checklist-due"
                    : "bg-surface-muted text-ink-600",
                )}
              >
                <Clock className="size-3" aria-hidden="true" />
                {due.text}
              </span>
            )}
            {linkCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-ink-400">
                <LinkIcon className="size-3" aria-label="링크" />
                {linkCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const TITLE = "min-w-0 flex-1 text-[15px]/[1.45] font-bold wrap-break-word text-ink-900";
const TITLE_DONE = "text-ink-350 line-through";
