import { EXPENSE_CATEGORY_LABEL, type ExpenseCategory } from "@/entities/expense";

/** 연결로 채우는 값 세 개 */
export type LinkedValues = {
  /** 날짜 칸에 보일 글 — 「day 2 · 11.1 (일)」 */
  day: string;
  category: ExpenseCategory | null;
  name: string;
};

export type RelinkRow = { label: string; from: string; to: string };

/**
 * 다른 일정으로 연결을 바꿀 때 「값도 바꾸기」 로 달라지는 칸만 — 날짜 · 카테고리 · 항목명.
 * 새 일정에서 카테고리를 알 수 없으면(null) 지금 값을 둔다
 */
export function relinkRows(current: LinkedValues, next: LinkedValues): RelinkRow[] {
  const label = (category: ExpenseCategory | null) =>
    category ? EXPENSE_CATEGORY_LABEL[category] : "없음";
  const rows: RelinkRow[] = [
    { label: "날짜", from: current.day, to: next.day },
    {
      label: "카테고리",
      from: label(current.category),
      to: label(next.category ?? current.category),
    },
    { label: "항목명", from: current.name || "없음", to: next.name },
  ];
  return rows.filter((row) => row.from !== row.to);
}
