import type { Ref, RefObject } from "react";

import type { ExpenseRowView } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Segmented } from "@/shared/ui/segmented";

import { homeModeLabel } from "../../lib/base-rate";
import type { TableGroup } from "../../lib/table-groups";
import type { ExpenseList } from "../../model/use-expense-list";
import type { AmountMode } from "../../model/use-pc-list";
import { TABLE_COLUMNS } from "./columns";
import { ExpenseTableRow } from "./expense-table-row";

type ExpenseTableProps = {
  /** 날짜 묶음, 금액순이면 한 묶음 */
  groups: TableGroup<ExpenseRowView>[];
  list: ExpenseList;
  /** 고른 줄(오른쪽에 상세가 열린 비용) */
  selected: string | null;
  /** 줄을 눌렀다 — 오른쪽에 그 비용 상세를 연다 */
  onSelect: (expenseId: string) => void;
  mode: AmountMode;
  onModeChange: (mode: AmountMode) => void;
  /** 「엔 920 기준」. 외화가 없으면 null */
  rateLine: string | null;
  scrollerRef: RefObject<HTMLDivElement | null>;
  /** 붙는 열 머리 — 그 아래 끝이 날짜 레일이 따라가는 기준선 */
  headRef: Ref<HTMLDivElement>;
  sectionRef: (key: string) => (el: HTMLElement | null) => void;
};

/**
 * PC 가계부 표 카드 — 스크롤 칸 안에 붙는 열 머리(38, 「결제 통화 | 원화 환산」 — 기준 화폐가 원화가 아니면 「JPY 환산」), 「엔 920 기준」 한 줄, 묶음 띠(회색 + 합계)와 줄들.
 * 빈 날은 「아직 지출이 없어요」
 */
export function ExpenseTable(props: ExpenseTableProps) {
  const {
    groups,
    list,
    selected,
    onSelect,
    mode,
    onModeChange,
    rateLine,
    scrollerRef,
    headRef,
    sectionRef,
  } = props;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-divider">
      <div ref={scrollerRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div
          ref={headRef}
          className={cn(
            "sticky top-0 z-10 h-9.5 border-b border-tag-link-bg bg-surface-sunken text-xs font-semibold text-ink-400",
            TABLE_COLUMNS,
          )}
        >
          <span>카테고리</span>
          <span>항목</span>
          <span>결제 · 함께</span>
          <span>결제수단</span>
          <div className="flex justify-end">
            <Segmented
              aria-label="금액 보기"
              options={[
                { value: "local", label: "결제 통화" },
                { value: "home", label: homeModeLabel(list.trip.home_currency) },
              ]}
              value={mode}
              onChange={onModeChange}
            />
          </div>
        </div>
        {rateLine && <p className="px-4 pt-1.5 text-right text-[11px] text-ink-350">{rateLine}</p>}
        {groups.map((g) => (
          <section key={g.key} ref={sectionRef(g.key)}>
            <div className="flex items-baseline border-y border-divider bg-surface-sunken px-4 py-2.5 text-[13px] font-semibold text-ink-450">
              <h2>{g.title}</h2>
              <span className="flex-1" />
              {g.total !== null && <span>{formatMoney(g.total, list.trip.home_currency)}</span>}
            </div>
            {g.rows.length === 0 ? (
              <p className="px-4 py-3.5 text-[13px] text-ink-350">아직 지출이 없어요</p>
            ) : (
              <div className="divide-y divide-surface-muted">
                {g.rows.map(({ row, tag }) => (
                  <ExpenseTableRow
                    key={row.id}
                    row={row}
                    tag={tag}
                    selected={selected === row.id}
                    hasReceipt={list.receiptsOf(row.id).length > 0}
                    onSelect={() => onSelect(row.id)}
                    onMarkPaid={() => list.markPaid(row.id)}
                    paying={list.paying === row.id}
                    mode={mode}
                    displayNameOf={list.displayNameOf}
                    everyone={list.everyone}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
        <div className="h-30" />
      </div>
    </div>
  );
}
