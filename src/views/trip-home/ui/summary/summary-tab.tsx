"use client";

import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { Segmented } from "@/shared/ui/segmented";
import { Toast, type ToastMessage } from "@/shared/ui/toast";

import { type Phase, PHASE_LABEL, phaseNote, PHASES, tripPhase } from "../../lib/phase";
import { PhaseBoard } from "./phase-board";

const PHASE_OPTIONS = PHASES.map((p) => ({ value: p, label: PHASE_LABEL[p] }));

type SummaryTabProps = { tripId: string; trip: Trip; layout: "mobile" | "pc" };

/**
 * 「요약」 탭 — 위 세그먼트(여행 전 · 중 · 후, 날짜로 자동 선택 · 다른 시점은 미리보기) + 그 시점의 상태판.
 * 고른 시점은 이 화면에서만 기억한다(다시 열면 날짜로 정한 시점). 여행 홈의 토스트는 이 탭이 하나를 그린다
 */
export function SummaryTab({ tripId, trip, layout }: SummaryTabProps) {
  const today = todayISO();
  const [picked, setPicked] = useState<Phase | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const phase = picked ?? tripPhase(trip.start_date, trip.end_date, today);
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
      <div className="h-3" />
      <PhaseBoard
        tripId={tripId}
        trip={trip}
        phase={phase}
        layout={layout}
        onToast={(m) => setToast({ ...m, id: Date.now() })}
      />
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
