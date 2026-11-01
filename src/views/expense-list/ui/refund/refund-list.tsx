"use client";

import { CloudOff, Plus, ReceiptText } from "lucide-react";

import { REFUND_STATUS_LABEL, refundGroups } from "@/entities/tax-refund";
import type { Trip } from "@/entities/trip";
import { memberName, RefundDetailSheet, RefundFormDialog } from "@/features/expense/refund";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Skeleton } from "@/shared/ui/skeleton";

import { refundSummary } from "../../lib/refund-summary";
import { type RefundScreen, useRefundScreen } from "../../model/use-refund-screen";
import { RefundRow } from "./refund-row";

type RefundListProps = { tripId: string; trip: Trip; onToast: (text: string) => void };

/**
 * 「환급」 의 내용(모바일 탭 · PC 창 공통) — 머리(건수 · 받을 돈 · 받은 돈, 「+ 환급 추가」) · 일행이 있으면 사람 칩(전체 · 나 · 일행) · 단계별 묶음(세관 확인 전 → 받을 것 → 받았어요).
 * 비면 안내, 읽지 못했으면 「다시 시도」. 상세 창 · 추가 · 수정 폼도 여기서 연다
 */
export function RefundList({ tripId, trip, onToast }: RefundListProps) {
  const screen = useRefundScreen(tripId, trip);
  return (
    <>
      <RefundBody screen={screen} />
      <RefundDetailSheet
        tripId={tripId}
        refund={screen.detail}
        onClose={screen.closeDetail}
        onEdit={screen.openEdit}
        onToast={onToast}
      />
      <RefundFormDialog
        tripId={tripId}
        target={screen.form}
        currencies={screen.currencies}
        startCurrency={screen.startCurrency}
        onClose={screen.closeForm}
        onToast={onToast}
      />
    </>
  );
}

type RefundBodyProps = { screen: RefundScreen };

/** 목록 부분 — 불러오는 중 · 실패 · 비어 있음 · 묶음 */
function RefundBody({ screen }: RefundBodyProps) {
  if (screen.isPending) {
    return (
      <div className="flex flex-col gap-2 px-5 pt-4">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
    );
  }
  if (screen.failed) {
    return (
      <EmptyState
        icon={CloudOff}
        title="환급 기록을 불러오지 못했어요"
        description="인터넷 연결을 확인하고 다시 시도해 주세요."
        action={
          <Button variant="outline" size="form" onClick={screen.retry}>
            다시 시도
          </Button>
        }
        className="py-16"
      />
    );
  }
  if (screen.all.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="환급 기록이 없어요"
        description={
          <>
            면세로 산 영수증마다 하나씩 적어 두세요.
            <br />
            출국할 때 세관 확인 · 받았는지 여기서 따라가요.
          </>
        }
        action={
          <Button variant="brand" size="pill" onClick={screen.openNew}>
            <Plus className="size-4.5" strokeWidth={2.4} aria-hidden="true" />
            환급 추가
          </Button>
        }
        className="py-16"
      />
    );
  }
  const summary = refundSummary(screen.refunds);
  return (
    <section aria-label="환급" className="flex flex-col pb-6">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[13px] font-bold text-ink-400">{screen.refunds.length}건</span>
          <span className="text-[15px] font-extrabold text-ink-900">
            {summary.expected ? `받을 돈 ${summary.expected}` : "받을 돈 없음"}
          </span>
          {summary.received && (
            <span className="text-[13px] text-ink-450">받은 돈 {summary.received}</span>
          )}
        </div>
        <Button variant="brand" size="pill" onClick={screen.openNew}>
          <Plus className="size-4.5" strokeWidth={2.4} aria-hidden="true" />
          환급 추가
        </Button>
      </div>
      {screen.members && (
        <div className="flex gap-1.5 overflow-x-auto px-5 pb-3" role="group" aria-label="누구 것">
          <FilterChip
            size="sm"
            selected={screen.owner === null}
            onClick={() => screen.setOwner(null)}
          >
            전체
          </FilterChip>
          {screen.members.map((m) => (
            <FilterChip
              key={m.id}
              size="sm"
              selected={screen.owner === m.id}
              onClick={() => screen.setOwner(m.id)}
            >
              {m.name}
            </FilterChip>
          ))}
        </div>
      )}
      {screen.refunds.length === 0 && (
        <p className="border-t-8 border-surface-sunken px-5 py-8 text-center text-[13px] text-ink-400">
          이 사람의 환급 기록이 없어요
        </p>
      )}
      {refundGroups(screen.refunds).map((g) => (
        <div key={g.status} className="border-t-8 border-surface-sunken">
          <h3 className="px-5 pt-3 pb-1 text-[13px] font-semibold text-ink-450">
            {REFUND_STATUS_LABEL[g.status]} · {g.items.length}건
          </h3>
          <ul className="divide-y divide-surface-muted">
            {g.items.map((r) => (
              <RefundRow
                key={r.id}
                refund={r}
                owner={screen.members ? memberName(screen.members, r.owner_id) : undefined}
                onOpen={() => screen.openDetail(r)}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
