import { ChevronRight, Ellipsis } from "lucide-react";

import { categoryBarClass, EXPENSE_CATEGORY_LABEL, ExpenseCategoryTile } from "@/entities/expense";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";

import type { CategoryPick } from "../../lib/category-detail";
import { type CategoryShare, topCategories } from "../../lib/dashboard";

/** 크기 — 모바일 대시보드(제목 15 · 줄 14 · 금액 칸 96) / PC 오른쪽 카드(14 · 13 · 88) */
const SIZE = {
  md: { title: "text-[15px]", label: "text-sm", sum: "w-24 text-sm", rest: "text-[13px]" },
  sm: { title: "text-sm", label: "text-[13px]", sum: "w-22 text-[13px]", rest: "text-xs" },
} as const;

type CategoryCardProps = {
  shares: CategoryShare[];
  home: string;
  size?: keyof typeof SIZE;
  /** 카테고리 상세를 연다 — 줄은 그 카테고리, 「전체 보기」 · 「그 외」 는 전체 */
  onOpen: (pick: CategoryPick) => void;
};

/**
 * 「카테고리」 — 「전체 보기 ›」, 비율 막대(높이 10, 카테고리 색) · 위 3개(타일 · 이름 · 비율 · 금액) · 「그 외 N개 · 쇼핑 · 기타」(점선 위).
 * 줄을 누르면 그 카테고리 상세, 「전체 보기」 · 「그 외」 는 전체. 합계에 넣는 지출만 센다. 지출이 없으면 「아직 지출이 없어요.」
 */
export function CategoryCard({ shares, home, size = "md", onOpen }: CategoryCardProps) {
  const s = SIZE[size];
  const { top, rest } = topCategories(shares);
  return (
    <>
      <div className="flex items-center">
        <h2 className={cn("flex-1 font-extrabold text-ink-900", s.title)}>카테고리</h2>
        <button
          type="button"
          onClick={() => onOpen("all")}
          className="flex items-center gap-px text-[13px] font-bold whitespace-nowrap text-brand-text"
        >
          전체 보기
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
      {shares.length === 0 ? (
        <p className="text-[13px] text-ink-350">아직 지출이 없어요.</p>
      ) : (
        <>
          <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]">
            {shares.map((c) => (
              <span
                key={c.category}
                className={categoryBarClass(c.category)}
                style={{ flexGrow: c.total }}
              />
            ))}
          </div>
          {top.map((c) => (
            <button
              type="button"
              key={c.category}
              onClick={() => onOpen(c.category)}
              className="flex items-center gap-2.5 text-left"
            >
              <ExpenseCategoryTile category={c.category} size="sm" />
              <span className={cn("flex-1 font-semibold text-ink-700", s.label)}>
                {EXPENSE_CATEGORY_LABEL[c.category]}
              </span>
              <span className="text-xs text-ink-400">{c.percent}%</span>
              <span className={cn("text-right font-extrabold text-ink-900", s.sum)}>
                {formatMoney(c.total, home)}
              </span>
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-handle" />
            </button>
          ))}
          {rest && (
            <button
              type="button"
              onClick={() => onOpen("all")}
              className="flex items-center gap-2.5 border-t border-dashed border-line pt-2 text-left"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-button bg-surface-muted">
                <Ellipsis aria-hidden="true" className="size-3.75 text-ink-400" />
              </span>
              <span className={cn("min-w-0 flex-1 truncate font-semibold text-ink-400", s.rest)}>
                그 외 {rest.categories.length}개 ·{" "}
                {rest.categories.map((c) => EXPENSE_CATEGORY_LABEL[c]).join(" · ")}
              </span>
              <span className={cn("text-right font-bold text-ink-400", s.sum, s.rest)}>
                {formatMoney(rest.total, home)}
              </span>
              <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 text-handle" />
            </button>
          )}
        </>
      )}
    </>
  );
}
