"use client";

import { cn } from "cn";
import { Check, CircleSlash } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FILTER_ALL, FilterSelect } from "@/shared/ui/filter-select";
import { SearchField } from "@/shared/ui/search-field";

import {
  filterLinkGroups,
  linkPickCategories,
  type LinkPickFilter,
  type LinkPickGroup,
  startLinkDay,
} from "../../lib/link-pick";

type LinkPickBodyProps = {
  groups: LinkPickGroup[];
  value: string | null;
  defaultDay: string | null;
  /** 줄 · 「연결 안 함」(null) 을 눌렀다 */
  onPick: (id: string | null) => void;
};

/**
 * 일정 연결 창 안 — 위 고정(검색 44 · 날짜 / 카테고리 필터 + 「초기화」), 아래 목록이 스크롤된다.
 * 목록: 「연결 안 함」(필터 · 검색 중에는 「N개」) → day 묶음 머리 13/600 → 줄 52(아이콘 28 · 이름 15/700 · 둘째 줄 12).
 * 고른 줄은 연한 블루 + ✓ 이고, 열면 그 줄로 스크롤한다
 */
export function LinkPickBody({ groups, value, defaultDay, onPick }: LinkPickBodyProps) {
  const [filter, setFilter] = useState<LinkPickFilter>({
    day: startLinkDay(groups, defaultDay),
    category: null,
    query: "",
  });
  const shown = filterLinkGroups(groups, filter);
  const count = shown.reduce((n, g) => n + g.items.length, 0);
  const filtered = filter.day !== null || filter.category !== null;
  const reset = () => setFilter((f) => ({ ...f, day: null, category: null }));
  const pickedRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    pickedRef.current?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <>
      <div className="flex shrink-0 flex-col gap-2.5 px-5 pb-3">
        <SearchField
          value={filter.query}
          onValueChange={(query) => setFilter((f) => ({ ...f, query }))}
          placeholder="일정 이름 검색"
          aria-label="일정 이름 검색"
        />
        <div className="flex items-center gap-1.5">
          <FilterSelect
            layout="dropdown"
            label="날짜"
            width="fit"
            value={filter.day ?? FILTER_ALL}
            onChange={(v) => setFilter((f) => ({ ...f, day: v === FILTER_ALL ? null : v }))}
            options={groups.map((g) => ({ value: g.key, label: g.short, sub: g.date }))}
          />
          <FilterSelect
            layout="dropdown"
            label="카테고리"
            width="fit"
            value={filter.category ?? FILTER_ALL}
            onChange={(v) => setFilter((f) => ({ ...f, category: v === FILTER_ALL ? null : v }))}
            options={linkPickCategories(groups)}
          />
          {filtered && (
            <button
              type="button"
              onClick={reset}
              className="ml-1 text-[13px] font-bold text-ink-400"
            >
              초기화
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {filtered || filter.query.trim() ? (
          <p className="px-2 pt-1 pb-2 text-[13px] text-ink-400">{count}개</p>
        ) : (
          <button
            type="button"
            onClick={() => onPick(null)}
            className="flex h-13 w-full items-center gap-3 rounded-card px-2 text-left text-[15px] font-bold text-ink-500"
          >
            <span className="flex size-7 items-center justify-center rounded-button bg-surface-muted">
              <CircleSlash className="size-4 text-ink-400" aria-hidden="true" />
            </span>
            연결 안 함
          </button>
        )}
        {shown.map((g) => (
          <section key={g.key}>
            <h3 className="px-2 pt-3 pb-1 text-[13px] font-semibold text-ink-450">
              {g.date ? `${g.short} · ${g.date}` : g.short}
            </h3>
            {g.items.map((item) => {
              const on = item.id === value;
              return (
                <button
                  key={item.id}
                  ref={on ? pickedRef : undefined}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onPick(item.id)}
                  className={cn(
                    "flex h-13 w-full items-center gap-3 rounded-card px-2 text-left",
                    on && "bg-brand-faint",
                  )}
                >
                  {item.thumb}
                  <span className="flex min-w-0 flex-1 flex-col gap-px">
                    <span className="truncate text-[15px] font-bold text-ink-900">
                      {item.title}
                    </span>
                    {item.meta && (
                      <span className="truncate text-xs text-ink-400">{item.meta}</span>
                    )}
                  </span>
                  {on && (
                    <Check
                      className="size-5 shrink-0 text-brand"
                      strokeWidth={2.4}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </section>
        ))}
        {count === 0 && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-ink-400">검색 결과가 없어요</p>
            {filtered && (
              <button
                type="button"
                onClick={reset}
                className="text-[13px] font-bold text-brand-text"
              >
                필터 초기화
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
