import { Check, ChevronDown, CircleSlash } from "lucide-react";
import { useState } from "react";

import type { ScheduleItem } from "@/entities/schedule-item";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { SearchField } from "@/shared/ui/search-field";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import { LINK_CATEGORIES, type LinkCategory, type LinkFilter, linkRows } from "../lib/link-items";
import type { ExpenseLink } from "../model/use-expense-link";

type LinkSheetProps = {
  open: boolean;
  onClose: () => void;
  link: ExpenseLink;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  costs: Map<string, number>;
  home: string;
  /** 날짜 필터의 처음 값(0 부터) — 연결된 일정의 날, 없으면 지금 고른 날. 여행준비면 null(전체 날짜) */
  startDay: number | null;
};

/**
 * 일정 선택 — 이름 검색 · 날짜 · 종류 필터 · 일정 목록(번호 · 이름 · 종류 · 시간, 이미 쓴 비용) · 맨 아래 「연결 안 함」.
 * 대체 장소 줄도 붙은 일정 아래에 보인다. 고르면 닫힌다
 */
export function LinkSheet(props: LinkSheetProps) {
  const { open, onClose } = props;
  return (
    <SheetDialog open={open} onClose={onClose} title="일정 선택">
      {/* 열 때마다 필터를 처음 값으로 — 닫혀 있는 동안 그리지 않는다 */}
      {open && <LinkSheetBody {...props} />}
    </SheetDialog>
  );
}

/** 시트 본문 — 필터 상태는 열 때 만든다 */
function LinkSheetBody({
  onClose,
  link,
  items,
  alternatives,
  costs,
  home,
  startDay,
}: LinkSheetProps) {
  const [filter, setFilter] = useState<LinkFilter>({
    day: startDay ?? "all",
    category: "all",
    query: "",
  });
  const rows = linkRows(items, alternatives, filter);
  const byId = new Map([...items, ...alternatives].map((i) => [i.id, i]));
  return (
    <div className="flex flex-col gap-3">
      <SearchField
        value={filter.query}
        onValueChange={(query) => setFilter((f) => ({ ...f, query }))}
        placeholder="일정 이름 검색"
        aria-label="일정 이름 검색"
      />
      <div className="flex gap-2">
        <FilterSelect
          label="날짜"
          className="flex-[1.4]"
          value={String(filter.day)}
          onChange={(v) => setFilter((f) => ({ ...f, day: v === "all" ? "all" : Number(v) }))}
          options={[
            ["all", "전체 날짜"],
            // 여행준비(첫 줄)는 일정이 없어 뺀다
            ...link.days.slice(1).map((o, i) => [String(i), `${o.label} · ${o.sub}`] as const),
          ]}
        />
        <FilterSelect
          label="종류"
          className="flex-1"
          value={filter.category}
          onChange={(v) => setFilter((f) => ({ ...f, category: v as LinkCategory }))}
          options={LINK_CATEGORIES}
        />
      </div>
      <ul className="-mx-2 flex flex-col">
        {rows.map((row) => {
          const on = row.id === link.itemId;
          const cost = costs.get(row.id);
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => {
                  const item = byId.get(row.id);
                  if (item) link.pick(item);
                  onClose();
                }}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-card px-3 py-1.5 text-left",
                  on && "bg-brand-faint",
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line-dashed bg-white text-xs font-extrabold text-ink-500">
                  {row.n ?? "·"}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-[15px] font-bold text-ink-900">{row.name}</span>
                  {row.sub && <span className="text-xs text-ink-400">{row.sub}</span>}
                </span>
                {on && (
                  <Check
                    className="size-5 shrink-0 text-primary"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                )}
                {!on && cost !== undefined && (
                  <span className="shrink-0 text-xs text-ink-350">{formatMoney(cost, home)}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {rows.length === 0 && (
        <p className="py-8 text-center text-sm text-ink-400">맞는 일정이 없어요</p>
      )}
      <button
        type="button"
        onClick={() => {
          link.chooseNone();
          onClose();
        }}
        className="flex items-center gap-2 border-t border-surface-muted pt-3.5 text-sm font-bold text-ink-500"
      >
        <CircleSlash className="size-4" aria-hidden="true" />
        연결 안 함
      </button>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  className?: string;
};

/** 필터 고르기 — 40 높이 흰 상자 + ⌄ */
function FilterSelect({ label, value, onChange, options, className }: FilterSelectProps) {
  return (
    <div className={cn("relative flex min-w-0 items-center", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-memo border border-input bg-white pr-7.5 pl-3 text-sm font-bold text-ink-900 outline-none"
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 size-4 text-ink-400"
        aria-hidden="true"
      />
    </div>
  );
}
