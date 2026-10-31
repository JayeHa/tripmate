"use client";

import {
  ExpenseLine,
  expenseRowView,
  sumExpenses,
  useExpenses,
  usePayerName,
} from "@/entities/expense";
import { useScheduleItems } from "@/entities/schedule-item";
import { useTrip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";

type StayExpensesProps = {
  tripId: string;
  stayId: string;
  /** 비용 줄 — 그 비용 수정 */
  onOpen: (expenseId: string) => void;
};

/**
 * 「연결된 비용 N · 합계」 + 이 숙소의 일정 카드(묵는 날마다 하나)에 연결된 비용 줄. 결제는 결제 칸에 따로.
 * 가계부에서 숙소 카드를 고른 숙소 비용은 결제가 없으면 결제가 되므로(0073), 여기 남는 것은 결제가 이미 있을 때의 비용 ·
 * 조식처럼 카테고리를 바꾼 비용이다. 합계는 합계 제외 비용을 빼고 기준 화폐로. 없으면 그리지 않는다
 */
export function StayExpenses({ tripId, stayId, onOpen }: StayExpensesProps) {
  const { data: trip } = useTrip(tripId);
  const { data: items = [] } = useScheduleItems(tripId);
  const { data: all = [] } = useExpenses(tripId);
  const nameOf = usePayerName(tripId, useMemberLookup(tripId));
  const cards = new Set(items.filter((i) => i.stay_id === stayId).map((i) => i.id));
  const expenses = all.filter((e) => e.schedule_item_id !== null && cards.has(e.schedule_item_id));
  if (!trip || expenses.length === 0) return null;
  const home = trip.home_currency;
  const ctx = {
    home,
    rates: trip.exchange_rates,
    today: todayISO(),
    nameOf,
    linkNameOf: () => null,
  };
  const total = sumExpenses(expenses, home, trip.exchange_rates);
  return (
    <section className="flex flex-col gap-1">
      <span className="text-sm font-extrabold text-ink-900">
        연결된 비용 {expenses.length} · {formatMoney(total.home, home)}
      </span>
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
