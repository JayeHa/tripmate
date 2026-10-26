import { CalendarDays, Check, CircleCheck, Plus } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { NumberMarker, ReservationBadge } from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";
import { directionsUrl } from "@/shared/lib/google-places";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";

import type { PlaceLine, TodayPlan } from "../../lib/today-plan";
import { BoardCard, BoardRow } from "./board-card";

type NextBoxProps = { plan: Extract<TodayPlan, { kind: "next" }>; onVisit: () => void };

/** 다음 장소 — 옅은 파랑 칸에 파란 안내 · 번호 원 · 이름 17/800, 아래 「구글맵 경로 | ✓ 들렀어요」 */
function NextBox({ plan, onVisit }: NextBoxProps) {
  const { place } = plan;
  return (
    <div className="flex flex-col gap-2.5 rounded-card bg-row-focus p-3.5">
      <span className="text-xs font-bold text-brand-text">{plan.label}</span>
      <div className="flex items-center gap-2.5">
        <NumberMarker kind="place" num={place.num} status={place.status} />
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="truncate text-[17px] font-extrabold text-ink-900">{place.name}</span>
          {place.sub && <span className="truncate text-xs text-ink-400">{place.sub}</span>}
        </div>
      </div>
      <div className="flex gap-2">
        {place.coords && (
          <a
            href={directionsUrl(place.coords.lat, place.coords.lng)}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ size: "form" }), "min-w-0 flex-1")}
          >
            구글맵 경로
          </a>
        )}
        <button
          type="button"
          onClick={onVisit}
          className="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-button border border-line-strong bg-white text-[15px] font-semibold text-ink-900 hover:bg-surface-sunken"
        >
          <Check className="size-4.25" strokeWidth={2.4} aria-hidden="true" />
          들렀어요
        </button>
      </div>
    </div>
  );
}

type QuietBoxProps = {
  icon: "done" | "free";
  title: string;
  sub: string | null;
  action: React.ReactNode;
};

/** 회색 칸 한 줄 — 다 마쳤을 때(초록 체크 · 되돌리기) · 장소 없는 날(달력 · 일정 추가) */
function QuietBox({ icon, title, sub, action }: QuietBoxProps) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-surface-sunken p-3.5">
      {icon === "done" ? (
        <CircleCheck className="size-6.5 shrink-0 text-day-done" strokeWidth={2} />
      ) : (
        <CalendarDays className="size-6.5 shrink-0 text-ink-400" strokeWidth={2} />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-base font-extrabold text-ink-900">{title}</span>
        {sub && <span className="truncate text-xs text-ink-400">{sub}</span>}
      </div>
      {action}
    </div>
  );
}

type AfterRowProps = { line: PlaceLine };

/** 「이후」 한 줄 — 번호 원 · 이름 · 「16:00 · 관광명소」, 예약 필요면 배지 */
function AfterRow({ line }: AfterRowProps) {
  return (
    <BoardRow
      lead={
        <span className="mx-1.5 flex">
          <NumberMarker kind="place" num={line.num} status={line.status} />
        </span>
      }
      title={line.name}
      sub={line.sub}
      trail={line.status === "wait" && <ReservationBadge status="wait" className="shrink-0" />}
    />
  );
}

type TodayCardProps = {
  tripId: string;
  startDate: string;
  dayIndex: number;
  plan: TodayPlan;
  layout: "mobile" | "pc";
  onVisit: () => void;
  /** 다 마친 뒤 「되돌리기」 — 마지막 장소로 돌아간다 */
  onReopen: () => void;
};

/** 오늘 · day N — 다음 장소와 「들렀어요」, 이후 두 곳. 다 마쳤으면 내일 첫 일정, 장소가 없으면 자유 일정 */
export function TodayCard({
  tripId,
  startDate,
  dayIndex,
  plan,
  layout,
  onVisit,
  onReopen,
}: TodayCardProps) {
  const schedule = `/trips/${tripId}/schedule?day=${dayIndex}`;
  return (
    <BoardCard
      title={`오늘 · day ${dayIndex + 1}`}
      count={dayLabel(startDate, dayIndex)}
      link={{ label: "일정", href: schedule }}
      layout={layout}
    >
      {plan.kind === "next" && <NextBox plan={plan} onVisit={onVisit} />}
      {plan.kind === "done" && (
        <QuietBox
          icon="done"
          title="오늘 일정을 다 마쳤어요"
          sub={plan.tomorrow}
          action={
            <button
              type="button"
              onClick={onReopen}
              className="shrink-0 cursor-pointer text-[13px] font-bold text-ink-400"
            >
              되돌리기
            </button>
          }
        />
      )}
      {plan.kind === "free" && (
        <QuietBox
          icon="free"
          title="오늘은 자유 일정이에요"
          sub={null}
          action={
            <Link
              href={schedule}
              transitionTypes={NAV.tab}
              className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-brand-text"
            >
              <Plus className="size-3.5" aria-hidden="true" />
              일정 추가
            </Link>
          }
        />
      )}
      {plan.kind === "next" && plan.after.length > 0 && (
        <>
          <span className="-mb-1 text-xs font-bold text-ink-400">이후</span>
          <ul className="flex flex-col">
            {plan.after.map((line) => (
              <AfterRow key={line.id} line={line} />
            ))}
          </ul>
        </>
      )}
    </BoardCard>
  );
}
