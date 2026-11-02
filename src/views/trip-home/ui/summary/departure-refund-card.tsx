import { ReceiptText } from "lucide-react";

import { methodText } from "@/features/expense/refund";

import type { DepartureRefunds, DepartureStep } from "../../lib/departure-refunds";
import { BoardCard, BoardRow } from "./board-card";

/** 줄 오른쪽 버튼 글 */
const STEP_LABEL: Record<DepartureStep, string> = {
  customs: "세관 확인",
  received: "받았어요",
};

type DepartureRefundCardProps = {
  tripId: string;
  view: DepartureRefunds;
  /** 환급 받는 사람 이름 — 일행이 없으면 null */
  ownerOf: (ownerId: string | null) => string | null;
  layout: "mobile" | "pc";
  onStep: (row: DepartureRefunds["rows"][number]) => void;
};

/**
 * 출국 날 「면세 환급」 — 노란 안내 칸(짐 부치기 전에 세관 확인 · 면세품은 들고 · 현금은 카운터에서), 아래 할 일이 남은 건마다 한 줄
 * (매장 · 「김동규 · 공항 현금」, 오른쪽 「세관 확인」 · 「받았어요」). 머리의 「가계부 ›」 는 환급 탭
 */
export function DepartureRefundCard({
  tripId,
  view,
  ownerOf,
  layout,
  onStep,
}: DepartureRefundCardProps) {
  return (
    <BoardCard
      title="면세 환급"
      count={view.customsLeft > 0 ? `세관 확인 전 ${view.customsLeft}건` : undefined}
      link={{ label: "가계부", href: `/trips/${tripId}/expenses/refunds` }}
      layout={layout}
    >
      <ul className="flex flex-col gap-1 rounded-card bg-important-bg px-3.5 py-3 text-[13px]/normal text-ink-700">
        {view.customsLeft > 0 && (
          <li className="font-bold text-ink-900">
            짐 부치기 전에 출국장 세관 키오스크에서 여권을 스캔해요
          </li>
        )}
        <li>면세품은 부치는 짐에 넣지 말고 들고 가요</li>
        {view.hasCash && <li>현금 환급은 세관 확인 뒤 출국 전에 환급 카운터에서 받아요</li>}
      </ul>
      <ul className="flex flex-col">
        {view.rows.map((row) => (
          <BoardRow
            key={row.refund.id}
            lead={
              <span className="flex size-9.5 shrink-0 items-center justify-center rounded-[11px] bg-surface-sunken">
                <ReceiptText className="size-4.75 text-ink-500" aria-hidden="true" />
              </span>
            }
            title={row.refund.store}
            sub={[ownerOf(row.refund.owner_id), methodText(row.refund)].filter(Boolean).join(" · ")}
            trail={
              <button
                type="button"
                onClick={() => onStep(row)}
                className="flex h-8 shrink-0 cursor-pointer items-center rounded-full bg-brand px-3.25 text-[13px] font-bold text-on-brand"
              >
                {STEP_LABEL[row.step]}
              </button>
            }
          />
        ))}
      </ul>
    </BoardCard>
  );
}
