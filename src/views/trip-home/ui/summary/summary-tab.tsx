"use client";

import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Segmented } from "@/shared/ui/segmented";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

import { type Phase, PHASE_LABEL, phaseNote, PHASES, tripPhase } from "../../lib/phase";
import { boardDayIndex } from "../../lib/today-plan";
import { useWidgets } from "../../model/use-widgets";
import { PhaseBoard } from "./phase-board";
import { RateCalculator } from "./rate-calculator";
import { WidgetRow } from "./widget-row";

const PHASE_OPTIONS = PHASES.map((p) => ({ value: p, label: PHASE_LABEL[p] }));

type SummaryTabProps = { tripId: string; trip: Trip; layout: "mobile" | "pc" };

/**
 * 「요약」 탭 — 위 세그먼트(여행 전 · 중 · 후, 날짜로 자동 선택 · 다른 시점은 미리보기) + 현지 정보 위젯 줄 + 그 시점의 상태판.
 * 위젯 줄은 여행 후에는 숨긴다(현지 환율 · 시간이 더 필요 없다). 환율 타일을 누르면 계산기.
 * 고른 시점은 이 화면에서만 기억한다(다시 열면 날짜로 정한 시점). 여행 홈의 토스트는 이 탭이 하나를 그린다
 */
export function SummaryTab({ tripId, trip, layout }: SummaryTabProps) {
  const today = todayISO();
  const [picked, setPicked] = useState<Phase | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);
  const auto = tripPhase(trip.start_date, trip.end_date, today);
  const phase = picked ?? auto;
  const widgets = useWidgets(tripId, trip);
  const showWidgets = phase !== "post" && widgets.tiles.length > 0;
  return (
    <div className={cn("flex flex-col pb-6", layout === "pc" && "mx-auto w-full max-w-270")}>
      <div className={cn("flex items-center gap-2", layout === "pc" ? "px-10 pt-5" : "px-5 pt-3")}>
        <Segmented
          options={PHASE_OPTIONS}
          value={phase}
          onChange={setPicked}
          aria-label="상태판 시점"
        />
        <span className="truncate text-xs text-ink-350">
          {phaseNote(phase, trip.start_date, trip.end_date, today)}
        </span>
      </div>
      {showWidgets ? (
        <WidgetRow
          tiles={widgets.tiles}
          layout={layout}
          onOpenRate={() => setCalcOpen(true)}
          liveCredit={widgets.live !== null}
        />
      ) : (
        <div className="h-3" />
      )}
      <PhaseBoard
        tripId={tripId}
        trip={trip}
        phase={phase}
        layout={layout}
        onToast={(m) => setToast({ ...m, id: Date.now() })}
      />
      {widgets.currency && (
        <RateCalculator
          open={calcOpen}
          onClose={() => setCalcOpen(false)}
          tripId={tripId}
          local={widgets.currency}
          home={trip.home_currency}
          rates={trip.exchange_rates}
          period={auto === "now" ? boardDayIndex(trip.start_date, trip.end_date, today) : null}
          live={widgets.live}
        />
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
