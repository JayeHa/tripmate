"use client";

import {
  ExpenseBadge,
  type ExpenseRowView,
  expenseRowView,
  type PersonRef,
  sumExpenses,
  useExpenses,
  useTripGuests,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { CircleAddButton } from "@/shared/ui/add-controls";

type ExpenseBlockProps = {
  tripId: string;
  item: ScheduleItem;
  /** 비용을 연다 — 줄은 그 비용 수정, 「+」 는 이 일정이 연결된 새 비용(null) */
  onOpen: (expenseId: string | null) => void;
};

/**
 * 「비용 N · 합계」 + 오른쪽 회색 원 「+」, 아래 이 일정에 연결된 비용 줄 — [결제 예정] 항목명 [합계 제외] /
 * 결제한 사람 · 결제수단 | 금액 · ≈ 기준 화폐. 합계는 합계 제외 비용을 빼고 기준 화폐로. 쓴 순서.
 * 비용이 없으면 칸을 그리지 않는다(맨 아래 「추가」 줄의 칩으로 쓴다)
 */
export function ExpenseBlock({ tripId, item, onOpen }: ExpenseBlockProps) {
  const { data: trip } = useTrip(tripId);
  const { data: all = [] } = useExpenses(tripId);
  const { data: guests = [] } = useTripGuests(tripId);
  const memberOf = useMemberLookup(tripId);
  const expenses = all.filter((e) => e.schedule_item_id === item.id);
  if (!trip || expenses.length === 0) return null;
  const home = trip.home_currency;
  /** 표시 이름 — 정산 인원은 이름만 있다 */
  const nameOf = (person: PersonRef) =>
    person.kind === "guest"
      ? (guests.find((g) => g.id === person.id)?.name ?? "알 수 없음")
      : (memberOf(person.id)?.name ?? "알 수 없음");
  const ctx = {
    home,
    rates: trip.exchange_rates,
    today: todayISO(),
    nameOf,
    linkNameOf: () => null,
  };
  const total = sumExpenses(expenses, home, trip.exchange_rates);
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-ink-400">
          비용 {expenses.length} · {formatMoney(total.home, home)}
        </span>
        <CircleAddButton label="비용 추가" onClick={() => onOpen(null)} />
      </div>
      <ul className="flex flex-col">
        {expenses.map((e) => (
          <li key={e.id}>
            <ExpenseLine row={expenseRowView(e, ctx)} onClick={() => onOpen(e.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type ExpenseLineProps = { row: ExpenseRowView; onClick: () => void };

/** 비용 한 줄 — 누르면 그 비용 수정 */
function ExpenseLine({ row, onClick }: ExpenseLineProps) {
  const who = row.splitEach || !row.payer ? "각자 냄" : `${row.payer.name} 결제`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-2.5 text-left"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-1.25">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          <span className="truncate text-sm font-semibold text-ink-800">{row.name}</span>
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </span>
        <span className="truncate text-xs text-ink-400">
          {who} · {row.methodLabel}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-px">
        <span
          className={cn(
            "text-[15px] font-extrabold",
            row.excluded ? "text-ink-350 line-through" : "text-ink-900",
          )}
        >
          {row.amountText}
        </span>
        {row.approxText && <span className="text-[11px] text-ink-400">{row.approxText}</span>}
      </div>
    </button>
  );
}
