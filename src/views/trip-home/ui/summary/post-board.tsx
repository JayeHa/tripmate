"use client";

import { ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { SettleBand } from "@/entities/expense";
import { nightsLabel } from "@/shared/lib/date-field";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

import type { PostBoard } from "../../model/use-post-board";
import { BoardCard, BoardRow } from "./board-card";

type Layout = "mobile" | "pc";

type PostSettleProps = {
  tripId: string;
  home: string;
  band: NonNullable<PostBoard["band"]>;
  personOf: PostBoard["personOf"];
  layout: Layout;
};

/** 정산 띠 — 카드 없이 맨 위(모바일은 좌우 20 · 아래 14). 누르면 가계부의 정산 화면 */
function PostSettle({ tripId, home, band, personOf, layout }: PostSettleProps) {
  const router = useRouter();
  return (
    <div className={cn(layout === "mobile" && "px-5 pb-3.5")}>
      <SettleBand
        state={band}
        home={home}
        personOf={personOf}
        size={layout === "pc" ? "sm" : "md"}
        onClick={() =>
          router.push(`/trips/${tripId}/expenses/settlement`, { transitionTypes: NAV.forward })
        }
      />
    </div>
  );
}

type SummaryCardProps = { summary: PostBoard["summary"]; nights: string; layout: Layout };

/** 여행 요약 — 「4박 5일」, 칸 넷(총 지출 · 1인당 · 다녀온 곳 · 바우처) */
function SummaryCard({ summary, nights, layout }: SummaryCardProps) {
  return (
    <BoardCard title="여행 요약" count={nights} layout={layout}>
      <ul className="grid grid-cols-2 gap-2">
        {summary.map((s) => (
          <li
            key={s.label}
            className="flex flex-col gap-0.5 rounded-memo border border-line-card p-3"
          >
            <span className="text-xs text-ink-400">{s.label}</span>
            <span className="truncate text-[17px] font-extrabold text-ink-900">{s.value}</span>
          </li>
        ))}
      </ul>
    </BoardCard>
  );
}

type NextTripCardProps = { layout: Layout };

/** 다음 여행 — 「새 여행 만들기」 한 줄, 누르면 새 여행 만들기 */
function NextTripCard({ layout }: NextTripCardProps) {
  return (
    <BoardCard title="다음 여행" layout={layout}>
      <ul className="flex flex-col">
        <BoardRow
          href="/trips/new"
          lead={
            <span className="flex size-9.5 shrink-0 items-center justify-center rounded-[11px] bg-brand-soft">
              <Plus className="size-4.75 text-brand-text" aria-hidden="true" />
            </span>
          }
          title="새 여행 만들기"
          sub="도시와 날짜만 고르면 바로 시작돼요"
          trail={<ChevronRight className="size-4.5 shrink-0 text-handle" aria-hidden="true" />}
        />
      </ul>
    </BoardCard>
  );
}

type PostBoardCardsProps = {
  tripId: string;
  trip: { home_currency: string; start_date: string; end_date: string };
  board: PostBoard;
  layout: Layout;
};

/**
 * 여행 후 상태판의 카드들(순서대로) — 정산 띠(남은 정산이 있을 때만) · 여행 요약 · 다음 여행.
 * 정산 띠는 PC 에서도 왼쪽 열 맨 위에 오도록 맨 앞에 둔다
 */
export function postBoardCards({ tripId, trip, board, layout }: PostBoardCardsProps) {
  const cards = [
    {
      key: "summary",
      node: (
        <SummaryCard
          summary={board.summary}
          nights={nightsLabel(trip.start_date, trip.end_date)}
          layout={layout}
        />
      ),
    },
    { key: "next", node: <NextTripCard layout={layout} /> },
  ];
  if (!board.band) return cards;
  return [
    {
      key: "settle",
      pinLeft: true,
      node: (
        <PostSettle
          tripId={tripId}
          home={trip.home_currency}
          band={board.band}
          personOf={board.personOf}
          layout={layout}
        />
      ),
    },
    ...cards,
  ];
}
