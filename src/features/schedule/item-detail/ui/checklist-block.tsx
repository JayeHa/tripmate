"use client";

import { NotebookPen } from "lucide-react";
import Link from "next/link";

import {
  cardTargets,
  dueDateText,
  openChecklistFor,
  useChecklistIndex,
  usePendingChecklistIds,
  useSetChecklistStatus,
} from "@/entities/checklist";
import type { ScheduleItem } from "@/entities/schedule-item";
import { CheckMark } from "@/shared/ui/check-mark";

type ChecklistBlockProps = {
  tripId: string;
  item: ScheduleItem;
  onToast: (message: string) => void;
};

/**
 * 「체크리스트 N」 + 회색 「노트에서 연결」 배지 + 오른쪽 「노트에서 보기」(노트 체크리스트 탭), 아래 이 일정
 * (숙소 카드면 그 숙소 포함)에 연결된 끝나지 않은 항목 — 사각 체크박스 · 제목 14/600 · 주황 마감. 마감순.
 * 체크하면 완료되어 목록에서 빠진다(실패하면 돌아오고 알린다). 추가 · 고치기는 노트에서만 해서 「+」 가 없고,
 * 항목이 없으면 칸을 그리지 않는다
 */
export function ChecklistBlock({ tripId, item, onToast }: ChecklistBlockProps) {
  const index = useChecklistIndex(tripId);
  const setStatus = useSetChecklistStatus(tripId);
  const pending = usePendingChecklistIds(tripId);
  const items = openChecklistFor(index, cardTargets(item));
  if (items.length === 0) return null;

  /** 완료로 표시 — 같은 항목을 연달아 누르면 앞 요청이 끝날 때까지 무시한다 */
  function complete(id: string) {
    if (pending.includes(id)) return;
    void setStatus
      .mutateAsync({ id, status: "done" })
      .then(() => onToast("완료했어요"))
      .catch(() => onToast("바꾸지 못했어요. 다시 시도해 주세요"));
  }

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
              onClick={() => complete(c.id)}
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
