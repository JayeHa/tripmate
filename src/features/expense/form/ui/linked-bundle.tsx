import { cn } from "cn";
import { CalendarDays } from "lucide-react";
import { useState } from "react";

import { EXPENSE_CATEGORY_LABEL, ExpenseCategoryTile } from "@/entities/expense";
import { itemName, type ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { ieyo } from "@/shared/lib/josa";

import { bundleDateText } from "../lib/bundle-date";
import type { ExpenseFormState } from "../model/use-expense-form";
import { CategoryField, DayField, NameField } from "./expense-fields";

type LinkedBundleProps = { form: ExpenseFormState; trip: Trip; linked: ScheduleItem };

/**
 * 「일정에서 가져옴」 묶음 — 일정을 연결하면 항목명 · 카테고리 · 날짜 칸 대신 회색 묶음(r12)에 글 3줄로 보인다.
 * 머리 오른쪽 「수정」 을 누르면 블루 테두리 + 세 칸이 입력칸이 되고(항목명이 비어 있으면 일정 이름을 채운다), 「닫기」 로 다시 글로.
 * 카테고리가 비어 있으면(휴식처럼 일정 종류로 못 정함) 처음부터 입력칸으로 연다 — 고르지 않으면 저장할 수 없다.
 * 글로 볼 때도 날짜가 연결 일정과 다르면 아래에 알린다(시안은 입력칸에서만 알린다)
 */
export function LinkedBundle({ form, trip, linked }: LinkedBundleProps) {
  const mustPick = form.category === null;
  const [editing, setEditing] = useState(mustPick);
  // 카테고리가 비면(연결을 휴식 같은 일정으로 바꿈) 입력칸으로 연다 — 렌더 중에 맞춘다.
  // 고른 뒤에도 닫지 않는다(고르는 순간 칸이 사라지지 않게). 닫기는 사용자가
  if (mustPick && !editing) setEditing(true);
  /** 「수정」 — 입력칸으로 열 때 빈 항목명을 일정 이름으로 채운다(빈 칸은 일정 이름으로 저장되지만, 칸에서는 보이게) */
  const toggle = () => {
    if (!editing && !form.name.trim()) form.setName(itemName(linked));
    setEditing(!editing);
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          "flex flex-col rounded-card border-[1.5px] bg-surface-sunken px-3.5 pt-1.5",
          editing ? "border-brand pb-3.5" : "border-transparent pb-1",
        )}
      >
        <div className="flex h-9 items-center gap-1.5">
          <CalendarDays className="size-3.5 text-ink-400" aria-hidden="true" />
          <span className="flex-1 text-[13px] font-bold text-ink-400">일정에서 가져옴</span>
          {!mustPick && (
            <button
              type="button"
              aria-expanded={editing}
              onClick={toggle}
              className={cn("text-[13px] font-bold", editing ? "text-ink-400" : "text-brand-text")}
            >
              {editing ? "닫기" : "수정"}
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-4 border-t border-divider pt-3">
            <NameField form={form} />
            <CategoryField form={form} />
            <DayField form={form} trip={trip} />
          </div>
        ) : (
          <BundleRows form={form} trip={trip} linked={linked} />
        )}
      </div>
      {!editing && form.link.dayMismatch && (
        <span className="text-xs font-semibold text-status-wait-text">
          연결된 일정은 {form.link.dayMismatch}
          {ieyo(form.link.dayMismatch)}
        </span>
      )}
    </div>
  );
}

/** 글로 보는 세 줄 — 항목명(비었으면 일정 이름) · 카테고리(22 타일 + 이름) · 날짜 */
function BundleRows({ form, trip, linked }: LinkedBundleProps) {
  return (
    <dl>
      <BundleRow label="항목명">
        <span className="truncate">{form.name.trim() || itemName(linked)}</span>
      </BundleRow>
      <BundleRow label="카테고리">
        {form.category && (
          <>
            <ExpenseCategoryTile
              category={form.category}
              size="sm"
              className="size-5.5 rounded-pill-sm [&_svg]:size-3.25"
            />
            {EXPENSE_CATEGORY_LABEL[form.category]}
          </>
        )}
      </BundleRow>
      <BundleRow label="날짜">
        {bundleDateText(trip.start_date, trip.end_date, form.spentOn)}
      </BundleRow>
    </dl>
  );
}

type BundleRowProps = { label: string; children: React.ReactNode };

/** 한 줄 — 위 구분선 · 왼쪽 이름 60 · 오른쪽 값 15/600 */
function BundleRow({ label, children }: BundleRowProps) {
  return (
    <div className="flex min-h-11 items-center gap-3 border-t border-divider">
      <dt className="w-15 shrink-0 text-sm text-ink-400">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1.5 text-[15px] font-semibold text-ink-900">
        {children}
      </dd>
    </div>
  );
}
