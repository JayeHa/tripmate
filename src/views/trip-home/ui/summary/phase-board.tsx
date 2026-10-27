"use client";

import type { Trip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import type { Voucher } from "@/entities/voucher";
import type { ToastMessage } from "@/shared/ui/toast";

import type { Peek } from "../../lib/peek";
import type { Phase } from "../../lib/phase";
import { useNowBoard } from "../../model/use-now-board";
import { usePinnedMemos } from "../../model/use-pinned-memos";
import { usePostBoard } from "../../model/use-post-board";
import { usePreBoard } from "../../model/use-pre-board";
import { type BoardCardItem, BoardGrid, BoardSkeleton } from "./board-grid";
import { nowBoardCards } from "./now-board";
import { pinnedMemoCards } from "./pinned-memo-card";
import { postBoardCards } from "./post-board";
import { preBoardCards } from "./pre-board";

type Layout = "mobile" | "pc";

type PreBoardViewProps = {
  tripId: string;
  startDate: string;
  layout: Layout;
  onPeek: (peek: Peek) => void;
  /** 시점과 상관없이 맨 아래에 붙는 카드(고정한 메모) */
  tail: BoardCardItem[];
};

/** 여행 전 상태판 */
function PreBoardView({ tripId, startDate, layout, onPeek, tail }: PreBoardViewProps) {
  const board = usePreBoard(tripId, startDate);
  if (!board) return <BoardSkeleton layout={layout} />;
  const cards = [...preBoardCards({ tripId, board, layout, onPeek }), ...tail];
  return <BoardGrid cards={cards} layout={layout} />;
}

type NowBoardViewProps = {
  tripId: string;
  trip: Trip;
  layout: Layout;
  onToast: (message: Omit<ToastMessage, "id">) => void;
  tail: BoardCardItem[];
};

/**
 * 여행 중 상태판. 「들렀어요」 를 누르면 다음 장소로 넘기고 「OO 들렀어요 · 되돌리기」 토스트를 띄운다(토스트는 탭이 하나를 그린다)
 */
function NowBoardView({ tripId, trip, layout, onToast, tail }: NowBoardViewProps) {
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
      cards={[
        ...nowBoardCards({
          tripId,
          startDate: trip.start_date,
          board,
          ownersOf,
          layout,
          onVisit: visit,
        }),
        ...tail,
      ]}
      layout={layout}
    />
  );
}

type PostBoardViewProps = { tripId: string; trip: Trip; layout: Layout; tail: BoardCardItem[] };

/** 여행 후 상태판 */
function PostBoardView({ tripId, trip, layout, tail }: PostBoardViewProps) {
  const board = usePostBoard(tripId, trip);
  if (!board) return <BoardSkeleton layout={layout} />;
  const cards = [...postBoardCards({ tripId, trip, board, layout }), ...tail];
  return <BoardGrid cards={cards} layout={layout} />;
}

type PhaseBoardProps = {
  tripId: string;
  trip: Trip;
  phase: Phase;
  layout: Layout;
  onToast: (message: Omit<ToastMessage, "id">) => void;
  /** 줄 · 메모를 눌렀을 때 홈 위에 미리 보기 */
  onPeek: (peek: Peek) => void;
};

/** 고른 시점의 상태판 — 맨 아래에는 시점과 상관없이 고정한 메모 */
export function PhaseBoard({ tripId, trip, phase, layout, onToast, onPeek }: PhaseBoardProps) {
  const tail = pinnedMemoCards(usePinnedMemos(tripId, trip.start_date), layout, onPeek);
  if (phase === "pre")
    return (
      <PreBoardView
        tripId={tripId}
        startDate={trip.start_date}
        layout={layout}
        onPeek={onPeek}
        tail={tail}
      />
    );
  if (phase === "now")
    return (
      <NowBoardView tripId={tripId} trip={trip} layout={layout} onToast={onToast} tail={tail} />
    );
  return <PostBoardView tripId={tripId} trip={trip} layout={layout} tail={tail} />;
}
