"use client";

import { Clock, Link as LinkIcon, Pencil } from "lucide-react";
import type { ElementType } from "react";

import {
  CHECKLIST_STATUS_LABEL,
  type ChecklistItem,
  checklistLinksOf,
  type ChecklistStatus,
  type ChecklistTargetRef,
  dueReadView,
  toggledStatus,
  useSetChecklistPin,
  useSetChecklistStatus,
} from "@/entities/checklist";
import { useUser } from "@/entities/session";
import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { PanelHeader } from "./panel-header";
import { TargetChips } from "./target-chips";

type ChecklistReadProps = {
  tripId: string;
  item: ChecklistItem;
  /** 이 항목의 연결 */
  targets: ChecklistTargetRef[];
  onEdit: () => void;
  onClose: () => void;
  onToast: (text: string) => void;
  titleAs?: ElementType;
};

/** 상태 칩 색 — 해야 할 것 블루 · 기타 노랑 · 완료 회색 */
const STATUS_CHIP: Record<ChecklistStatus, string> = {
  todo: "bg-primary-tint text-primary-pressed",
  etc: "bg-checklist-etc-bg text-checklist-etc-text",
  done: "bg-checklist-done-bg text-checklist-done-text",
};

/**
 * 체크리스트 읽기 — 상태 칩 · 제목 20/800 · 마감(「까지 · D-N」) · 연결된 일정 칩 · 메모 상자 · 링크 칩, 아래 「편집」 | 「완료로 표시」(완료면 「되돌리기」).
 * 「홈에 고정」 은 여기서 바로 저장한다. 「완료로 표시」 는 바로 닫고 토스트로 알린다(실패하면 되돌리고 다시 알린다)
 */
export function ChecklistRead({
  tripId,
  item,
  targets,
  onEdit,
  onClose,
  onToast,
  titleAs,
}: ChecklistReadProps) {
  const { data: user } = useUser();
  const pin = useSetChecklistPin(tripId);
  const setStatus = useSetChecklistStatus(tripId);
  const status = item.status as ChecklistStatus;
  const done = status === "done";
  const due = item.due_date ? dueReadView(item.due_date, todayISO(), done) : null;
  const links = checklistLinksOf(item.links);
  const body = item.body.trim();

  /** 완료로 표시 · 되돌리기 */
  function toggleDone() {
    onClose();
    onToast(done ? "되돌렸어요" : "완료했어요");
    void setStatus
      .mutateAsync({ id: item.id, status: toggledStatus(status) })
      .catch(() => onToast("바꾸지 못했어요. 다시 시도해 주세요"));
  }

  return (
    <>
      <PanelHeader
        heading="체크리스트"
        pinned={item.pinned_by !== null}
        pinDisabled={pin.isPending || !user}
        onPin={() => {
          if (!user) return;
          void pin
            .mutateAsync({ id: item.id, pinnedBy: item.pinned_by ? null : user.id })
            .catch(() => onToast("바꾸지 못했어요. 다시 시도해 주세요"));
        }}
        onClose={onClose}
        titleAs={titleAs}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4">
        <div className="flex flex-col gap-2">
          <span
            className={cn(
              "flex h-6 items-center self-start rounded-full px-2.5 text-xs font-extrabold",
              STATUS_CHIP[status],
            )}
          >
            {CHECKLIST_STATUS_LABEL[status]}
          </span>
          <p className="text-xl/[1.4] font-extrabold tracking-[-0.01em] wrap-break-word text-ink-900">
            {item.title}
          </p>
          {due && (
            <span
              className={cn(
                "flex items-center gap-1 text-sm font-bold",
                due.soon ? "text-checklist-due" : "text-ink-600",
              )}
            >
              <Clock className="size-3.5 text-checklist-due" aria-hidden="true" />
              {due.text}
            </span>
          )}
        </div>
        <TargetChips tripId={tripId} targets={targets} />
        {body && (
          <ReadSection label="메모">
            <p className="rounded-card bg-surface-sunken px-3.5 py-3 text-[15px]/[1.6] whitespace-pre-line text-ink-800">
              {body}
            </p>
          </ReadSection>
        )}
        {links.length > 0 && (
          <ReadSection label="링크">
            <div className="flex flex-wrap gap-1.5">
              {links.map((l) => (
                <a
                  key={`${l.title}\n${l.url}`}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 max-w-full items-center gap-1.25 rounded-full border border-line px-3 text-[13px] font-semibold text-ink-700"
                >
                  <LinkIcon className="size-3.5 shrink-0 text-ink-450" aria-hidden="true" />
                  <span className="truncate">{l.title || l.url}</span>
                </a>
              ))}
            </div>
          </ReadSection>
        )}
        {!body && links.length === 0 && targets.length === 0 && (
          <p className="text-sm text-ink-350">
            메모나 링크가 없어요. 「편집」에서 추가할 수 있어요.
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2 border-t border-divider px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <Button
          variant="outline"
          size="form"
          className="flex-1 border-line-strong text-ink-700"
          onClick={onEdit}
        >
          <Pencil className="size-4" aria-hidden="true" />
          편집
        </Button>
        <Button
          variant={done ? "chip" : "default"}
          size="form"
          className="flex-1"
          onClick={toggleDone}
        >
          {done ? "되돌리기" : "완료로 표시"}
        </Button>
      </div>
    </>
  );
}

type ReadSectionProps = { label: string; children: React.ReactNode };

/** 읽기 화면 칸 — 13/700 회색 이름 + 내용 */
function ReadSection({ label, children }: ReadSectionProps) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[13px] font-bold text-ink-400">{label}</h3>
      {children}
    </section>
  );
}
