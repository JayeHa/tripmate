"use client";

import { SlidersHorizontal } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";
import { FilterChip } from "@/shared/ui/filter-chip";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { type ExpenseFilters, moreCount, type MoreGroups } from "../../lib/filters";
import type { PcList } from "../../model/use-pc-list";

/** 함께한 사람 칩 — 키 · 이름 · 20 아바타 */
export type TogetherOption = { value: string; label: string; avatar: React.ReactNode };

type MoreFiltersProps = {
  pc: PcList;
  groups: MoreGroups;
  people: TogetherOption[];
};

/**
 * 「필터 더보기」(SlidersHorizontal) — 아래 300 패널에 걸 거리가 있는 묶음만: 결제 통화 · 함께한 사람(아바타, 여럿) · 결제 상태 · 합계 제외.
 * 칩(30)을 누르면 바로 걸리고 패널은 열려 있다. 열렸거나 하나라도 걸리면 버튼이 잉크, 걸린 수를 「· N」 으로
 */
export function MoreFilters({ pc, groups, people }: MoreFiltersProps) {
  const { filters: f, patch } = pc;
  const count = moreCount(f);
  const empty = !groups.currencies && !groups.together && !groups.status && !groups.excluded;
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "flex h-8.5 shrink-0 items-center gap-1.25 rounded-full px-3 text-[13px] font-bold whitespace-nowrap",
          count > 0
            ? "bg-ink-900 text-white"
            : "border border-line bg-white text-ink-700 data-popup-open:border-ink-900 data-popup-open:bg-ink-900 data-popup-open:text-white",
        )}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        {count > 0 ? `필터 더보기 · ${count}` : "필터 더보기"}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-75 gap-3.5 rounded-card border border-divider bg-white p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)] ring-0"
      >
        {groups.currencies && (
          <Group label="결제 통화">
            <Chip on={f.currency === "all"} onClick={() => patch({ currency: "all" })}>
              전체
            </Chip>
            {groups.currencies.map((c) => (
              <Chip key={c} on={f.currency === c} onClick={() => patch({ currency: c })}>
                {c}
              </Chip>
            ))}
          </Group>
        )}
        {groups.together && <TogetherGroup value={f.together} people={people} patch={patch} />}
        {groups.status && <StatusGroup value={f.status} patch={patch} />}
        {groups.excluded && (
          <Group label="합계 제외">
            <Chip on={!f.hideExcluded} onClick={() => patch({ hideExcluded: false })}>
              보이기
            </Chip>
            <Chip on={f.hideExcluded} onClick={() => patch({ hideExcluded: true })}>
              숨기기
            </Chip>
          </Group>
        )}
        {empty && <p className="text-[13px] text-ink-350">이 여행에서는 더 걸 필터가 없어요.</p>}
      </PopoverContent>
    </Popover>
  );
}

type TogetherGroupProps = {
  value: string[];
  people: TogetherOption[];
  patch: PcList["patch"];
};

/** 함께한 사람 — 「전체」 + 사람마다 아바타 칩, 여럿 고르기 */
function TogetherGroup({ value, people, patch }: TogetherGroupProps) {
  return (
    <Group label="함께한 사람">
      <Chip on={value.length === 0} onClick={() => patch({ together: [] })}>
        전체
      </Chip>
      {people.map((p) => {
        const on = value.includes(p.value);
        return (
          <Chip
            key={p.value}
            on={on}
            avatar
            onClick={() =>
              patch({ together: on ? value.filter((v) => v !== p.value) : [...value, p.value] })
            }
          >
            {p.avatar}
            {p.label}
          </Chip>
        );
      })}
    </Group>
  );
}

const STATUS_CHIPS: [ExpenseFilters["status"], string][] = [
  ["all", "전체"],
  ["done", "결제 완료"],
  ["planned", "결제 예정"],
];

type StatusGroupProps = { value: ExpenseFilters["status"]; patch: PcList["patch"] };

/** 결제 상태 — 하나 고르기 */
function StatusGroup({ value, patch }: StatusGroupProps) {
  return (
    <Group label="결제 상태">
      {STATUS_CHIPS.map(([status, label]) => (
        <Chip key={status} on={value === status} onClick={() => patch({ status })}>
          {label}
        </Chip>
      ))}
    </Group>
  );
}

type GroupProps = { label: string; children: React.ReactNode };

/** 묶음 — 제목 12/700 회색 + 칩 줄(gap 6, 넘치면 다음 줄) */
function Group({ label, children }: GroupProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <span className="text-xs font-bold text-ink-400">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

type ChipProps = {
  on: boolean;
  onClick: () => void;
  /** 앞에 20 아바타가 있다 — 왼쪽 안쪽을 줄인다 */
  avatar?: boolean;
  children: React.ReactNode;
};

/** 패널 안 칩(P2 보조 30) — 고르면 잉크 */
function Chip({ on, onClick, avatar, children }: ChipProps) {
  return (
    <FilterChip
      selected={on}
      size="sm"
      onClick={onClick}
      className={cn("gap-1.25 pr-2.5", avatar ? "pl-1.25" : "pl-2.5")}
    >
      {children}
    </FilterChip>
  );
}
