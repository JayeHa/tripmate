import { ArrowUpRight, CalendarDays, Pencil } from "lucide-react";

import {
  planLinksOf,
  ReservationBadge,
  type ScheduleItem,
  statusOf,
} from "@/entities/schedule-item";
import { cn } from "@/shared/lib/utils";

import type { PlanEditState } from "../model/use-plan-edit";
import { PlanEditForm } from "./plan-edit-form";

type PlanSectionProps = {
  item: ScheduleItem;
  /** 「📅 day 3 · 11.2 (월) 일정」 */
  dayTag: string;
  edit: PlanEditState;
};

/**
 * 이번 일정 — 이 여행 · 이 방문에만 해당하는 칸. 보기는 표(예약 상태 · 시간 · 링크), 「수정」 을 누르면 그 자리에서 고친다.
 * note · flight 는 상태 · 링크가 없고 제목 · 시간만 고친다.
 */
export function PlanSection({ item, dayTag, edit }: PlanSectionProps) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="flex h-6 items-center gap-1 rounded-full bg-ink-900 px-2.25 text-xs font-extrabold text-white">
          <CalendarDays className="size-3" />
          {dayTag}
        </span>
        {!edit.draft && (
          <button
            type="button"
            onClick={edit.start}
            className="flex items-center gap-1 text-sm font-bold text-primary"
          >
            <Pencil className="size-3.5" />
            수정
          </button>
        )}
      </div>
      {edit.draft ? <PlanEditForm item={item} edit={edit} /> : <PlanView item={item} />}
    </section>
  );
}

type PlanViewProps = { item: ScheduleItem };

/** 보기: 예약 상태(없으면 점선 「예약 상태 없음」) · 시간(없으면 「미정」) · 일정 링크(없으면 「없음」) */
function PlanView({ item }: PlanViewProps) {
  const status = statusOf(item);
  const links = planLinksOf(item);
  const isPlace = item.kind === "place";
  return (
    <div className="flex flex-col gap-2 text-sm/normal">
      {isPlace && (
        <Line label="예약 상태">
          {status ? (
            <ReservationBadge status={status} />
          ) : (
            <span className="flex h-6 items-center rounded-full border border-dashed border-handle bg-white px-2.25 text-xs font-bold text-ink-400">
              예약 상태 없음
            </span>
          )}
        </Line>
      )}
      <Line label="시간">
        <span className={cn("font-semibold", item.start_time ? "text-ink-900" : "text-ink-350")}>
          {item.start_time?.slice(0, 5) ?? "미정"}
        </span>
      </Line>
      {isPlace && (
        <Line label="링크">
          {links.length > 0 ? (
            <span className="flex min-w-0 flex-1 flex-wrap gap-x-3 gap-y-1">
              {links.map((l) => (
                <a
                  key={`${l.title}-${l.url}`}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.75 font-semibold text-primary"
                >
                  {l.title || "링크"}
                  <ArrowUpRight className="size-3.25" strokeWidth={2.2} />
                </a>
              ))}
            </span>
          ) : (
            <span className="text-ink-350">없음</span>
          )}
        </Line>
      )}
    </div>
  );
}

type LineProps = { label: string; children: React.ReactNode };

/** 표 한 줄: 60px 라벨 + 값 */
function Line({ label, children }: LineProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-15 shrink-0 text-ink-400">{label}</span>
      {children}
    </div>
  );
}
