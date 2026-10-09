import { categoryBarClass, type ExpenseCategory } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import { type CategoryPick, type DayBar, stackSegments } from "../../lib/category-detail";

type DayBarsProps = {
  bars: DayBar[];
  pick: CategoryPick;
  /** 「전체」 일 때 그날 카테고리별 금액(기준 화폐) — 막대 키(여행준비 · 0-base 날)로 찾는다 */
  partsOf: (key: string) => { category: ExpenseCategory; total: number }[];
};

/**
 * 날짜별 막대(P32) — 높이 최대 60 · 폭 최대 28 · 위 모서리 4, 아래 라벨 11. 카테고리 하나면 그 색 단색 막대,
 * 「전체」 면 그날 카테고리 비율로 나눠 쌓는다(틈 없이, 아래 → 위 순서 고정). 범례는 없다 — 아래 목록 아이콘 색이 범례.
 * 긴 여행은 칸마다 28 은 지키고 넘치면 막대 줄만 좌우로 스크롤한다(창 전체가 넓어지지 않게)
 */
export function DayBars({ bars, pick, partsOf }: DayBarsProps) {
  return (
    <div aria-hidden="true" className="-mx-5 flex h-22 items-end gap-2.5 overflow-x-auto px-5 pt-3">
      {bars.map((b) => (
        <div
          key={b.key}
          className="flex h-full min-w-7 flex-1 shrink-0 flex-col items-center justify-end gap-1"
        >
          {pick === "all" ? (
            <span
              className={cn(
                "flex w-full max-w-7 flex-col-reverse overflow-hidden rounded-t-tag",
                b.height === 0 && "invisible",
              )}
            >
              {stackSegments(partsOf(b.key), b.height).map((s) => (
                <span
                  key={s.category}
                  className={categoryBarClass(s.category)}
                  style={{ height: s.height }}
                />
              ))}
            </span>
          ) : (
            <span
              className={cn(
                "w-full max-w-7 rounded-t-tag",
                b.height === 0 && "invisible",
                categoryBarClass(pick),
              )}
              style={{ height: b.height }}
            />
          )}
          <span className="text-[11px] text-ink-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
}
