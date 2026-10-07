import type { Ref, RefObject } from "react";

import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Segmented } from "@/shared/ui/segmented";

import { periodLabel } from "../../lib/period";
import type { ExpenseList, ExpenseListSection } from "../../model/use-expense-list";
import type { AmountMode } from "../../model/use-pc-list";
import { TABLE_COLUMNS } from "./columns";
import { ExpenseTableRow } from "./expense-table-row";

type ExpenseTableProps = {
  sections: ExpenseListSection[];
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
  /** 묶음마다 키(레일과 같은 순서) */
  keys: string[];
};

const MODES = [
  { value: "local", label: "현지 금액" },
  { value: "home", label: "원화" },
] as const;

/**
 * PC 가계부 표 카드 — 스크롤 칸 안에 붙는 열 머리(38, 「현지 금액 | 원화」), 「엔 920 기준」 한 줄, 날짜 띠(회색 + 합계)와 줄들.
 * 빈 날은 「아직 지출이 없어요」
 */
export function ExpenseTable(props: ExpenseTableProps) {
  const {
    sections,
    list,
    selected,
    onSelect,
    mode,
    onModeChange,
    rateLine,
    scrollerRef,
    headRef,
    sectionRef,
    keys,
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
              options={MODES}
              value={mode}
              onChange={onModeChange}
            />
          </div>
        </div>
        {rateLine && <p className="px-4 pt-1.5 text-right text-[11px] text-ink-350">{rateLine}</p>}
        {sections.map((s, i) => {
          const { label, date } = periodLabel(s.period, list.trip.start_date);
          return (
            <section key={keys[i]} ref={sectionRef(keys[i])}>
              <div className="flex items-baseline border-y border-divider bg-surface-sunken px-4 py-2.5 text-[13px] font-semibold text-ink-450">
                <h2>
                  {s.period === "prep" ? "여행 준비" : `${label} · ${date.replace("/", " (")})`}
                </h2>
                <span className="flex-1" />
                {s.rows.length > 0 && (
                  <span>{formatMoney(s.total.home, list.trip.home_currency)}</span>
                )}
              </div>
              {s.rows.length === 0 ? (
                <p className="px-4 py-3.5 text-[13px] text-ink-350">아직 지출이 없어요</p>
              ) : (
                <div className="divide-y divide-surface-muted">
                  {s.rows.map((row) => (
                    <ExpenseTableRow
                      key={row.id}
                      row={row}
                      selected={selected === row.id}
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
          );
        })}
        <div className="h-30" />
      </div>
    </div>
  );
}
