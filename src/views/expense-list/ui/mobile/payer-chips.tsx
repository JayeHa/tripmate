"use client";

import { PersonAvatar, personKey } from "@/entities/expense";
import { FilterChip } from "@/shared/ui/filter-chip";

import type { ExpenseList } from "../../model/use-expense-list";

type PayerChipsProps = {
  list: ExpenseList;
  /** 고른 사람 키(`m:…` · `g:…`). null 이면 전체 */
  value: string | null;
  onChange: (key: string | null) => void;
};

/**
 * 모바일 「결제한 사람」 칩 줄 — 「전체 · 정원 · 김동규」 중 하나(P2 보조 30). 사람은 멤버 + 정산 인원, 이름은 「나」 가 아니라 내 이름.
 * 칩이 많으면 가로로 스크롤한다
 */
export function PayerChips({ list, value, onChange }: PayerChipsProps) {
  return (
    <div className="flex items-center gap-2.5 pl-5">
      <span className="shrink-0 text-[13px] font-semibold text-ink-450">결제한 사람</span>
      <div
        role="group"
        aria-label="결제한 사람으로 거르기"
        className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pr-5"
      >
        <FilterChip size="sm" selected={value === null} onClick={() => onChange(null)}>
          전체
        </FilterChip>
        {list.people.map((p) => {
          const key = personKey(p);
          const name = list.displayNameOf(p);
          return (
            <FilterChip
              key={key}
              size="sm"
              selected={value === key}
              onClick={() => onChange(key)}
              className="pl-1.5"
            >
              <PersonAvatar
                guest={p.kind === "guest"}
                name={name}
                url={list.avatarOf(p).url}
                className="size-5"
              />
              {name}
            </FilterChip>
          );
        })}
      </div>
    </div>
  );
}
