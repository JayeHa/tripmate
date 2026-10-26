import { ChevronRight, Plus, QrCode, Receipt } from "lucide-react";
import Link from "next/link";

import { ExpenseCategoryTile } from "@/entities/expense";
import type { Voucher } from "@/entities/voucher";
import { directionsUrl } from "@/shared/lib/google-places";
import { NAV } from "@/shared/lib/nav-transition";

import type { NowBoard } from "../../model/use-now-board";
import { BoardCard, BoardRow } from "./board-card";
import { TodayCard } from "./today-card";

type Layout = "mobile" | "pc";

type VoucherCardProps = {
  tripId: string;
  vouchers: Voucher[];
  dayIndex: number;
  /** 바우처 주인 글 — 「정원 · 동규」 · 「모두」 */
  ownersOf: (v: Voucher) => string;
  layout: Layout;
};

/** 오늘 쓸 바우처 — 그림 자리 · 이름 · 「정원 · 동규 · day 2」, 줄을 누르면 노트의 바우처 */
function VoucherCard({ tripId, vouchers, dayIndex, ownersOf, layout }: VoucherCardProps) {
  const href = `/trips/${tripId}/notes?tab=voucher`;
  return (
    <BoardCard
      title="오늘 쓸 바우처"
      count={String(vouchers.length)}
      link={{ label: "노트", href }}
      layout={layout}
    >
      <ul className="flex flex-col">
        {vouchers.map((v) => (
          <BoardRow
            key={v.id}
            href={href}
            lead={
              <span className="flex size-12 shrink-0 items-center justify-center rounded-button bg-voucher-thumb">
                <QrCode className="size-5.5 text-voucher-thumb-icon" aria-hidden="true" />
              </span>
            }
            title={v.title}
            sub={`${ownersOf(v)} · day ${dayIndex + 1}`}
            trail={<ChevronRight className="size-4.5 shrink-0 text-handle" aria-hidden="true" />}
          />
        ))}
      </ul>
    </BoardCard>
  );
}

type SpendCardProps = {
  tripId: string;
  spend: NowBoard["spend"];
  dayIndex: number;
  layout: Layout;
};

/** 오늘 지출 — 합계 20/800 · 「¥6,760 · 4건 · 내가 쓴 돈」, 오른쪽 「+ 비용 추가」(그날로 열린다) */
function SpendCard({ tripId, spend, dayIndex, layout }: SpendCardProps) {
  return (
    <BoardCard
      title="오늘 지출"
      link={{ label: "가계부", href: `/trips/${tripId}/expenses` }}
      layout={layout}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9.5 shrink-0 items-center justify-center rounded-[11px] bg-cat-food-soft">
          <Receipt className="size-4.75 text-cat-food" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-px">
          <span className="text-xl font-extrabold text-ink-900">{spend.total}</span>
          <span className="truncate text-xs text-ink-400">{spend.sub}</span>
        </div>
        <Link
          href={`/trips/${tripId}/expenses/new?period=${dayIndex}`}
          transitionTypes={NAV.forward}
          className="flex h-8.5 shrink-0 items-center gap-1 rounded-full bg-brand px-3.25 text-[13px] font-bold text-on-brand"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          비용 추가
        </Link>
      </div>
    </BoardCard>
  );
}

type StayCardProps = { stay: NonNullable<NowBoard["stay"]>; layout: Layout };

/** 오늘 밤 숙소 — 숙소 이름 · 「숙박 2/4박 · 주소」, 오른쪽 「길찾기」 */
function StayCard({ stay, layout }: StayCardProps) {
  const { place } = stay.stay;
  return (
    <BoardCard title="오늘 밤 숙소" layout={layout}>
      <ul className="flex flex-col">
        <BoardRow
          lead={<ExpenseCategoryTile category="lodging" />}
          title={place.name}
          sub={stay.sub}
          trail={
            place.lat != null &&
            place.lng != null && (
              <a
                href={directionsUrl(place.lat, place.lng)}
                target="_blank"
                rel="noreferrer"
                className="flex h-8 shrink-0 items-center rounded-button border border-line-strong px-3 text-[13px] font-bold text-ink-900"
              >
                길찾기
              </a>
            )
          }
        />
      </ul>
    </BoardCard>
  );
}

type NowBoardCardsProps = {
  tripId: string;
  startDate: string;
  board: NowBoard;
  ownersOf: (v: Voucher) => string;
  layout: Layout;
  onVisit: () => void;
};

/**
 * 여행 중 상태판의 카드들(순서대로) — 오늘 · 오늘 지출은 늘, 바우처 · 숙소는 그날 있을 때만
 */
export function nowBoardCards({
  tripId,
  startDate,
  board,
  ownersOf,
  layout,
  onVisit,
}: NowBoardCardsProps) {
  const { dayIndex } = board;
  return [
    {
      key: "today",
      node: (
        <TodayCard
          tripId={tripId}
          startDate={startDate}
          dayIndex={dayIndex}
          plan={board.plan}
          layout={layout}
          onVisit={onVisit}
          onReopen={() => board.plan.kind === "done" && board.setVisited(board.plan.last)}
        />
      ),
    },
    board.vouchers.length > 0 && {
      key: "voucher",
      node: (
        <VoucherCard
          tripId={tripId}
          vouchers={board.vouchers}
          dayIndex={dayIndex}
          ownersOf={ownersOf}
          layout={layout}
        />
      ),
    },
    {
      key: "spend",
      node: <SpendCard tripId={tripId} spend={board.spend} dayIndex={dayIndex} layout={layout} />,
    },
    board.stay && { key: "stay", node: <StayCard stay={board.stay} layout={layout} /> },
  ].filter((c) => !!c);
}
