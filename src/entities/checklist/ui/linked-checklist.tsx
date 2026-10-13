import { NotebookPen } from "lucide-react";
import Link from "next/link";

import { CheckMark } from "@/shared/ui/check-mark";

import { dueDateText } from "../lib/due";
import type { ChecklistItem } from "../model/types";

type LinkedChecklistProps = {
  tripId: string;
  /** 보일 항목(끝나지 않은 것, 마감순) — `useLinkedChecklist` */
  items: ChecklistItem[];
  onComplete: (id: string) => void;
};

/**
 * 상세의 체크리스트 칸 — 「체크리스트 N」 + 회색 「노트에서 연결」 배지 + 오른쪽 「노트에서 보기」(노트 체크리스트 탭),
 * 아래 항목마다 사각 체크박스 · 제목 14/600 · 주황 마감. 추가 · 고치기는 노트에서만 해서 「+」 가 없고,
 * 항목이 없으면 칸을 그리지 않는다
 */
export function LinkedChecklist({ tripId, items, onComplete }: LinkedChecklistProps) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-ink-400">체크리스트 {items.length}</span>
          <span className="flex h-5 items-center gap-0.75 rounded-tag bg-surface-muted px-1.5 text-[11px] font-bold text-ink-500">
            <NotebookPen className="size-2.75" aria-hidden="true" />
            노트에서 연결
          </span>
        </span>
        <Link
          href={`/trips/${tripId}/notes?tab=checklist`}
          className="text-[13px] font-bold text-primary"
        >
          노트에서 보기
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2.5 rounded-memo border border-input bg-white px-3 py-2.5"
          >
            <button
              type="button"
              onClick={() => onComplete(c.id)}
              aria-label={`${c.title} 완료로 표시`}
              className="-m-2.5 flex shrink-0 p-2.5"
            >
              <CheckMark checked={false} shape="square" />
            </button>
            <span className="min-w-0 flex-1 text-sm font-semibold wrap-break-word text-ink-900">
              {c.title}
            </span>
            {c.due_date && (
              <span className="shrink-0 text-xs font-bold text-checklist-due">
                {dueDateText(c.due_date)} 까지
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
