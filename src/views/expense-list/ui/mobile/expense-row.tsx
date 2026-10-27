import { Link2 } from "lucide-react";
import Link from "next/link";

import {
  ExpenseBadge,
  ExpenseCategoryTile,
  type ExpenseRowView,
  type PersonRef,
  whoOf,
} from "@/entities/expense";
import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

type ExpenseRowProps = {
  row: ExpenseRowView;
  href: string;
  onMarkPaid: () => void;
  /** 결제 완료로 바꾸는 중 */
  paying: boolean;
  /** 표시 이름 — 「정원 결제」 */
  displayNameOf: (person: PersonRef) => string;
  /** 여행의 사람 수 — 「N명 모두」 */
  everyone: number;
};

/**
 * 모바일 가계부 한 줄 — 카테고리 타일 38 · 이름 14/500(앞 「결제 예정」 · 뒤 「합계 제외」 배지) ·
 * 아래 아바타 16 + 「정원 결제 · 2명」(예정일이 지났으면 「예정일 지남 · 결제 완료로」), 오른쪽 금액 16/800 · 외화면 ≈ 원화.
 * 합계에서 뺀 비용은 금액을 흐리게 긋는다. 줄 전체가 그 비용으로 가는 링크라 「결제 완료로」 는 그 위에 올린다
 */
export function ExpenseRow({
  row,
  href,
  onMarkPaid,
  paying,
  displayNameOf,
  everyone,
}: ExpenseRowProps) {
  const who = whoOf(row, displayNameOf, everyone);
  const initial = who.person ? displayNameOf(who.person).slice(0, 1) : "";
  return (
    // isolate: 「결제 완료」 의 z-10(행 전체 누르기 위)이 행 안에서만 통하게 — 없으면 위에 붙은 날짜 줄 위로 올라온다
    <div className="relative isolate flex items-center gap-3 px-5 py-3">
      <ExpenseCategoryTile category={row.category} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-1.25">
          {row.planned && <ExpenseBadge>결제 예정</ExpenseBadge>}
          <Link
            href={href}
            transitionTypes={NAV.forward}
            className="min-w-0 truncate text-sm font-medium text-ink-600 after:absolute after:inset-0"
          >
            {row.name}
          </Link>
          {row.ownerLink && (
            <Link2
              className="size-3.5 shrink-0 text-ink-350"
              aria-label={`${row.ownerLink}와 연결됨`}
            />
          )}
          {row.excluded && <ExpenseBadge>합계 제외</ExpenseBadge>}
        </div>
        {row.overdue ? (
          <span className="flex items-center gap-1.5 text-xs text-status-wait-text">
            예정일 지남
            <button
              type="button"
              onClick={onMarkPaid}
              disabled={paying}
              className="relative z-10 flex h-5 items-center rounded-memo border border-status-wait-line bg-white px-2 text-[11px] font-semibold disabled:opacity-50"
            >
              결제 완료로
            </button>
          </span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.25 text-xs text-ink-400">
            {who.person && (
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full text-[8px] font-extrabold text-white",
                  who.person.kind === "guest" ? "bg-guest" : "bg-primary",
                )}
              >
                {initial}
              </span>
            )}
            <span className="truncate">{who.text}</span>
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span
          className={cn(
            "text-base font-extrabold",
            row.excluded ? "text-ink-350 line-through" : "text-ink-900",
          )}
        >
          {row.amountText}
        </span>
        {row.approxText && <span className="text-[11px] text-ink-400">{row.approxText}</span>}
      </div>
    </div>
  );
}
