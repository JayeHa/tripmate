"use client";

import {
  ExpenseLine,
  expenseRowView,
  sumExpenses,
  useExpenses,
  usePayerName,
} from "@/entities/expense";
import { useTrip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import { todayISO } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";

type FlightExpensesProps = {
  tripId: string;
  /** 항공편의 일정 카드 id — 비용 입력의 「일정 연결」 로 이 카드에 붙은 비용을 보인다 */
  cardId: string;
  /** 비용 줄 — 그 비용 수정 */
  onOpen: (expenseId: string) => void;
};

/**
 * 「연결된 비용 N · 합계」 + 이 항공편 카드에 연결된 비용 줄(결제는 결제 칸에 따로). 합계는 합계 제외 비용을 빼고 기준 화폐로.
 * 연결된 비용이 없으면 그리지 않는다 — 항공편 비용은 결제 칸으로 넣고, 이 칸은 가계부에서 카드에 연결한 비용을 보이려고 둔다
 */
export function FlightExpenses({ tripId, cardId, onOpen }: FlightExpensesProps) {
  const { data: trip } = useTrip(tripId);
  const { data: all = [] } = useExpenses(tripId);
  const nameOf = usePayerName(tripId, useMemberLookup(tripId));
  const expenses = all.filter((e) => e.schedule_item_id === cardId);
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
