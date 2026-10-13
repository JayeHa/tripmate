"use client";

import {
  type ChecklistGroup,
  checklistGroups,
  ChecklistRow,
  type ChecklistStatus,
  toggledStatus,
  useChecklist,
  usePendingChecklistIds,
  useSetChecklistStatus,
} from "@/entities/checklist";
import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/ui/skeleton";

import { QuickAddBar } from "./quick-add-bar";

type ChecklistBoardProps = {
  tripId: string;
  /** 빠른 추가 바가 붙는 높이(sticky top) — 위에 붙은 머리 높이만큼 */
  stickyTop: string;
  onToast: (text: string) => void;
  /** 행을 눌렀다 — 그 항목의 읽기 화면 */
  onOpen: (id: string) => void;
  /** 「자세히」 — 바에 치던 제목으로 새 항목 폼 */
  onNew: (title: string) => void;
};

/** 묶음 점 색 — 해야 할 것 블루 · 기타 노랑 · 완료 회색 */
const DOT: Record<ChecklistStatus, string> = {
  todo: "bg-primary",
  etc: "bg-checklist-etc",
  done: "bg-checklist-done",
};

/**
 * 체크리스트 목록 — 맨 위 빠른 추가 바(스크롤해도 붙어 있다), 아래 해야 할 것 · 기타 · 완료 묶음(마감순).
 * 체크박스를 누르면 완료 ↔ 해야 할 것으로 바뀌어 묶음을 옮긴다(실패하면 되돌리고 알린다). 행을 누르면 그 항목을 연다
 */
export function ChecklistBoard({ tripId, stickyTop, onToast, onOpen, onNew }: ChecklistBoardProps) {
  const { data: items, isPending } = useChecklist(tripId);
  const setStatus = useSetChecklistStatus(tripId);
  const pending = usePendingChecklistIds(tripId);
  const today = todayISO();
  return (
    <div className="flex flex-col">
      <div className={cn("sticky z-5 bg-surface-sunken px-4 pt-3 pb-1", stickyTop)}>
        <QuickAddBar tripId={tripId} onToast={onToast} onDetail={onNew} />
      </div>
      {isPending ? (
        <div className="flex flex-col gap-2 px-4 pt-3">
          <Skeleton className="h-14 rounded-card" />
          <Skeleton className="h-14 rounded-card" />
        </div>
      ) : (
        <div className="flex flex-col gap-4.5 px-4 pt-3 pb-7">
          {checklistGroups(items ?? []).map((g) => (
            <Group
              key={g.status}
              group={g}
              today={today}
              onOpen={onOpen}
              onToggle={(id, status) => {
                if (pending.includes(id)) return;
                // 결과는 호출마다 받는다 — mutate 의 콜백은 마지막 호출에만 실행돼 연달아 누르면 앞의 실패를 놓친다
                void setStatus
                  .mutateAsync({ id, status: toggledStatus(status) })
                  .catch(() => onToast("바꾸지 못했어요. 다시 시도해 주세요"));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type GroupProps = {
  group: ChecklistGroup;
  today: string;
  onOpen: (id: string) => void;
  onToggle: (id: string, status: string) => void;
};

/** 묶음 하나 — 점 · 이름 · 수, 아래 항목들 */
function Group({ group, today, onOpen, onToggle }: GroupProps) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-1.5 px-1">
        <span className={cn("size-2 rounded-full", DOT[group.status])} aria-hidden="true" />
        <span className="text-sm font-extrabold text-ink-900">{group.label}</span>
        <span className="text-[13px] text-ink-400">{group.items.length}</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {group.items.map((item) => (
          <li key={item.id}>
            <ChecklistRow
              item={item}
              today={today}
              onToggle={() => onToggle(item.id, item.status)}
              onOpen={() => onOpen(item.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
