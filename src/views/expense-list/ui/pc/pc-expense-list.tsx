"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

import { amountLines, ReceiptThumbs, sumExpenses } from "@/entities/expense";
import { ExpenseDialog, type ExpenseDialogTarget } from "@/features/expense/form";
import { formatMoney } from "@/shared/lib/money";
import type { SplitConfig } from "@/shared/lib/split";
import { useSplitWidth } from "@/shared/lib/use-split-width";
import { Button } from "@/shared/ui/button";
import { SplitHandle } from "@/shared/ui/split-handle";

import { baseRateLine } from "../../lib/base-rate";
import { calendarCells } from "../../lib/calendar";
import { detailFields } from "../../lib/detail-fields";
import { filtersActive, matchesFilters, moreGroups } from "../../lib/filters";
import { tableGroups } from "../../lib/table-groups";
import { useCalendarScroll } from "../../model/use-calendar-scroll";
import { useDashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { usePcList } from "../../model/use-pc-list";
import { type PcScreensInitial, usePcScreens } from "../../model/use-pc-screens";
import { useRowSelection } from "../../model/use-row-selection";
import { CategoryModal } from "./category-modal";
import { DateRail } from "./date-rail";
import { ExpenseDetailPanel } from "./expense-detail-panel";
import { ExpenseTable } from "./expense-table";
import { FilterBar } from "./filter-bar";
import { filterOptions } from "./filter-options";
import { PcDashboard } from "./pc-dashboard";
import { SettleModal } from "./settle-modal";

/**
 * [날짜 레일 200 | 표 | 오른쪽 패널] — 오른쪽 패널 너비를 쥔다(328~480, 처음 328). 창을 넓히면 표가 늘어난다.
 * 패널은 시안 너비(328)보다 좁히지 않는다 — 요약 · 상세 카드가 그 너비로 짜여 있고, 좁은 화면에서는 지금처럼 328 그대로다.
 * 고정 268 = 레일 200 + 좌우 여백 48 + 칸 사이 20. 표에는 640 을 남긴다 — 열 합(약 730)까지 지키면 1280 화면에서 패널을 넓힐 수 없다
 */
const EXPENSE_SPLIT: SplitConfig = {
  fixed: 268,
  min: 328,
  max: 480,
  defaultWidth: 328,
  otherMin: 640,
  side: "second",
};

type PcExpenseListProps = {
  tripId: string;
  list: ExpenseList;
  /** 주소로 들어왔을 때 열어 둘 창(카테고리 · 정산) */
  initial?: PcScreensInitial;
};

/**
 * PC 가계부 — [날짜 레일 200 | 머리 · 필터 · 표 | 오른쪽 328]. 레일을 누르면 표가 그 날로 스크롤하고, 표를 스크롤하면 레일이 따라간다.
 * 필터 · 정렬은 표만 바꾼다(레일 · 오른쪽은 여행 전체). 금액순이면 표가 한 목록이라, 레일에서 날을 고르면 최신순으로 돌아가 그 날로 간다. 오른쪽은 대시보드 카드(요약 · 카테고리 · 정산).
 * 표와 오른쪽 사이 경계선을 끌어 오른쪽 너비를 바꾼다. 줄을 누르면 오른쪽이 그 비용 상세로 바뀐다(↑↓ 다른 비용 · Esc · ✕ 로 요약). 「+ 비용 추가」 · 상세의 「수정」 은
 * 페이지를 옮기지 않고 가운데 창(440×760)으로 연다
 */
export function PcExpenseList({ tripId, list, initial }: PcExpenseListProps) {
  const { trip } = list;
  const pc = usePcList();
  const split = useSplitWidth(EXPENSE_SPLIT);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [modal, setModal] = useState<ExpenseDialogTarget | null>(null);
  const active = filtersActive(pc.filters);
  const sections = active
    ? list.sectionsOf((e) => matchesFilters(e, pc.filters))
    : list.allSections;
  const cells = calendarCells(list.allSections, trip.start_date);
  const scroll = useCalendarScroll(
    cells.map((c) => c.key),
    { scroller: scrollerRef, topKey: "all" },
  );
  const filtered = sections.flatMap((s) => s.expenses);
  const groups = tableGroups(sections, pc.sort, trip);
  const dash = useDashboard(tripId, list);
  const screens = usePcScreens(initial);
  // ↑↓ 는 보이는 순서대로 — 금액순이면 정렬한 순서
  const selection = useRowSelection(
    groups.flatMap((g) => g.rows.map((r) => r.row.id)),
    modal !== null || screens.open,
  );
  const selectedRow = sections.flatMap((s) => s.rows).find((r) => r.id === selection.selected);
  const selectedExpense = filtered.find((e) => e.id === selection.selected);
  const filteredTotal = sumExpenses(filtered, trip.home_currency, trip.exchange_rates);
  const options = filterOptions(list);
  /** 레일에서 날을 골랐다 — 금액순이면 날짜 묶음을 먼저 그려(flushSync) 그 묶음으로 스크롤할 수 있게 한다 */
  const goDay = (key: string) => {
    if (pc.sort !== "date" && key !== "all") flushSync(() => pc.setSort("date"));
    scroll.go(key);
  };
  return (
    <div className="flex h-[calc(100dvh-var(--shell-top))]">
      <DateRail
        items={cells.map((c, i) => ({ ...c, total: list.allSections[i].total.home }))}
        home={trip.home_currency}
        selected={scroll.selected}
        onSelect={goDay}
      />
      <div className="flex min-w-0 flex-1 gap-2.5 px-6 py-5.5">
        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <div className="flex shrink-0 items-center gap-3">
            <h1 className="text-[22px] font-extrabold text-ink-900">가계부</h1>
            <span className="text-sm text-ink-400">{list.count}건</span>
            <span className="flex-1" />
            <Button variant="brand" size="pill" onClick={() => setModal({ kind: "new" })}>
              + 비용 추가
            </Button>
          </div>
          <FilterBar
            pc={pc}
            {...options}
            more={moreGroups(list.expenses, list.solo)}
            onSort={pc.setSort}
            result={
              active
                ? `${filtered.length}건 · ${formatMoney(filteredTotal.home, trip.home_currency)}`
                : null
            }
          />
          <ExpenseTable
            groups={groups}
            list={list}
            selected={selection.selected}
            onSelect={selection.select}
            mode={pc.mode}
            onModeChange={pc.setMode}
            rateLine={baseRateLine(
              list.expenses.map((e) => e.currency),
              trip.home_currency,
              trip.exchange_rates,
            )}
            scrollerRef={scrollerRef}
            headRef={scroll.stickyRef}
            sectionRef={scroll.sectionRef}
          />
        </div>
        <SplitHandle
          label="오른쪽 패널 너비 (←/→ 로 조절, Enter 는 기본 너비)"
          line={false}
          dragging={split.dragging}
          dragHandlers={split.dragHandlers}
          width={split.width}
          minWidth={split.minWidth}
          maxWidth={split.maxWidth}
          onKeyDown={split.onKeyDown}
          onReset={split.reset}
        />
        <aside
          className="flex shrink-0 flex-col gap-3 overflow-y-auto"
          style={{ width: split.width }}
        >
          {selectedRow && selectedExpense ? (
            <ExpenseDetailPanel
              row={selectedRow}
              amount={amountLines(selectedRow, pc.mode)}
              fields={detailFields(selectedExpense, selectedRow, {
                trip,
                displayNameOf: list.displayNameOf,
                everyone: list.everyone,
                meId: list.meId,
              })}
              onEdit={() => setModal({ kind: "edit", expenseId: selectedRow.id })}
              onClose={selection.clear}
              receipts={
                list.receiptsOf(selectedRow.id).length > 0 && (
                  <ReceiptThumbs
                    tripId={tripId}
                    receipts={list.receiptsOf(selectedRow.id)}
                    size="sm"
                  />
                )
              }
            />
          ) : (
            <PcDashboard
              list={list}
              dash={dash}
              onCategory={screens.openCategory}
              onSettle={screens.openSettle}
            />
          )}
        </aside>
      </div>
      <ExpenseDialog
        tripId={tripId}
        target={modal}
        onClose={() => setModal(null)}
        onToast={list.showToast}
      />
      <CategoryModal list={list} opened={screens.category} onClose={screens.closeCategory} />
      <SettleModal list={list} dash={dash} opened={screens.settle} onClose={screens.closeSettle} />
    </div>
  );
}
