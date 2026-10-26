"use client";

import { Hammer } from "lucide-react";

import type { Trip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import type { Voucher } from "@/entities/voucher";
import { EmptyState } from "@/shared/ui/empty-state";
import type { ToastMessage } from "@/shared/ui/toast";

import { type Phase, PHASE_LABEL } from "../../lib/phase";
import { useNowBoard } from "../../model/use-now-board";
import { usePreBoard } from "../../model/use-pre-board";
import { BoardGrid, BoardSkeleton } from "./board-grid";
import { nowBoardCards } from "./now-board";
import { preBoardCards } from "./pre-board";

type Layout = "mobile" | "pc";

type PreBoardViewProps = { tripId: string; layout: Layout };

/** 여행 전 상태판 */
function PreBoardView({ tripId, layout }: PreBoardViewProps) {
  const board = usePreBoard(tripId);
  if (!board) return <BoardSkeleton layout={layout} />;
  return <BoardGrid cards={preBoardCards({ tripId, board, layout })} layout={layout} />;
}

type NowBoardViewProps = {
  tripId: string;
  trip: Trip;
  layout: Layout;
  onToast: (message: Omit<ToastMessage, "id">) => void;
};

/**
 * 여행 중 상태판. 「들렀어요」 를 누르면 다음 장소로 넘기고 「OO 들렀어요 · 되돌리기」 토스트를 띄운다(토스트는 탭이 하나를 그린다)
 */
function NowBoardView({ tripId, trip, layout, onToast }: NowBoardViewProps) {
  const board = useNowBoard(tripId, trip);
  const memberOf = useMemberLookup(tripId);
  if (!board) return <BoardSkeleton layout={layout} />;
  const { plan, visited, setVisited } = board;
  /** 바우처 주인 — 비면 「모두」, 아니면 멤버 이름(나간 사람은 뺀다) */
  const ownersOf = (v: Voucher) =>
    v.owners.length === 0
      ? "모두"
      : v.owners
          .map((id) => memberOf(id)?.name)
          .filter(Boolean)
          .join(" · ");
  const visit = () => {
    if (plan.kind !== "next") return;
    setVisited(plan.index + 1);
    onToast({
      text: `${plan.place.name} 들렀어요`,
      action: { label: "되돌리기", onClick: () => setVisited(visited) },
    });
  };
  return (
    <BoardGrid
      cards={nowBoardCards({
        tripId,
        startDate: trip.start_date,
        board,
        ownersOf,
        layout,
        onVisit: visit,
      })}
      layout={layout}
    />
  );
}

type PhaseBoardProps = {
  tripId: string;
  trip: Trip;
  phase: Phase;
  layout: Layout;
  onToast: (message: Omit<ToastMessage, "id">) => void;
};

/** 고른 시점의 상태판. 여행 후는 다음 단계에서 채운다 */
export function PhaseBoard({ tripId, trip, phase, layout, onToast }: PhaseBoardProps) {
  if (phase === "pre") return <PreBoardView tripId={tripId} layout={layout} />;
  if (phase === "now")
    return <NowBoardView tripId={tripId} trip={trip} layout={layout} onToast={onToast} />;
  return (
    <EmptyState
      icon={Hammer}
      title="아직 준비 중이에요"
      description={`곧 ${PHASE_LABEL[phase]} 상태판을 볼 수 있어요`}
    />
  );
}
