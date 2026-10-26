"use client";

import { Hammer } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state";
import { Segmented } from "@/shared/ui/segmented";
import { Skeleton, SkeletonScreen } from "@/shared/ui/skeleton";

import { type Phase, PHASE_LABEL, phaseNote, PHASES, tripPhase } from "../../lib/phase";
import { usePreBoard } from "../../model/use-pre-board";
import { preBoardCards } from "./pre-board";

type Layout = "mobile" | "pc";

const PHASE_OPTIONS = PHASES.map((p) => ({ value: p, label: PHASE_LABEL[p] }));

type BoardCardItem = { key: string; node: React.ReactNode };

type BoardGridProps = { cards: BoardCardItem[]; layout: Layout };

/**
 * 카드 배치 — 모바일은 한 줄로 이어 붙이고, PC 는 두 열(1.15 : 1)에 순서대로 왼쪽 · 오른쪽 번갈아 놓는다
 */
function BoardGrid({ cards, layout }: BoardGridProps) {
  if (layout === "mobile")
    return (
      <div className="flex flex-col">
        {cards.map((c) => (
          <div key={c.key}>{c.node}</div>
        ))}
      </div>
    );
  const cols = [cards.filter((_, i) => i % 2 === 0), cards.filter((_, i) => i % 2 === 1)];
  return (
    <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-5 px-10 pt-1">
      {cols.map((col) => (
        <div key={col[0]?.key ?? "empty"} className="flex min-w-0 flex-col gap-4">
          {col.map((c) => (
            <div key={c.key}>{c.node}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

type PhaseBoardProps = { tripId: string; phase: Phase; layout: Layout };

/** 고른 시점의 상태판. 여행 중 · 여행 후는 다음 단계에서 채운다 */
function PhaseBoard({ tripId, phase, layout }: PhaseBoardProps) {
  const board = usePreBoard(tripId);
  if (phase !== "pre") {
    return (
      <EmptyState
        icon={Hammer}
        title="아직 준비 중이에요"
        description={`곧 ${PHASE_LABEL[phase]} 상태판을 볼 수 있어요`}
      />
    );
  }
  if (!board) return <BoardSkeleton layout={layout} />;
  return <BoardGrid cards={preBoardCards({ tripId, board, layout })} layout={layout} />;
}

type BoardSkeletonProps = { layout: Layout };

/** 상태판을 읽는 동안 — 카드 두 장 자리 */
function BoardSkeleton({ layout }: BoardSkeletonProps) {
  return (
    <SkeletonScreen className={cn("flex flex-col gap-4", layout === "pc" ? "px-10 pt-1" : "px-5")}>
      <Skeleton className="h-36 w-full rounded-card" />
      <Skeleton className="h-28 w-full rounded-card" />
    </SkeletonScreen>
  );
}

type SummaryTabProps = { tripId: string; trip: Trip; layout: Layout };

/**
 * 「요약」 탭 — 위 세그먼트(여행 전 · 중 · 후, 날짜로 자동 선택 · 다른 시점은 미리보기) + 그 시점의 상태판.
 * 고른 시점은 이 화면에서만 기억한다(다시 열면 날짜로 정한 시점)
 */
export function SummaryTab({ tripId, trip, layout }: SummaryTabProps) {
  const today = todayISO();
  const [picked, setPicked] = useState<Phase | null>(null);
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
      <PhaseBoard tripId={tripId} phase={phase} layout={layout} />
    </div>
  );
}
