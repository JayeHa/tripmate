"use client";

import type { PersonKey } from "@/entities/expense";
import { AppHeader } from "@/shared/ui/app-header";

import { useDashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { SettleLoadError } from "../dashboard/settle-load-error";
import { SettlePerson } from "../settle/settle-person";

type MobileSettleProps = { tripId: string; list: ExpenseList; initial: PersonKey | null };

/** 모바일 정산(사람 상세) — 머리 ← (지출 · 정산 탭으로) · 「정산」. 송금 기록을 읽기 전에는 그리지 않는다 */
export function MobileSettle({ tripId, list, initial }: MobileSettleProps) {
  const dash = useDashboard(tripId, list);
  return (
    <>
      <AppHeader title="정산" subtitle={list.trip.title} back={`/trips/${tripId}/expenses/stats`} />
      <main className="flex flex-col pb-10">
        {dash.settleFailed && (
          <div className="px-5 py-4">
            <SettleLoadError onRetry={dash.retrySettle} />
          </div>
        )}
        {dash.settle && (
          <SettlePerson
            list={list}
            settle={dash.settle}
            avatarOf={dash.avatarOf}
            initial={initial}
          />
        )}
      </main>
    </>
  );
}
