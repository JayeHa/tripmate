/**
 * 모바일 가계부 목록 위에 연 창 — 주소 검색값 `?sheet=` 에 둔다(뒤로 가기로 닫히고, 목록은 그대로 남아 보던 자리를 지킨다).
 * new: 비용 추가(period = 처음 날짜, 주소의 period 와 같은 값) · view: 비용 상세 · edit: 비용 수정
 */
export type ExpenseSheet =
  | { kind: "new"; period: string | null }
  | { kind: "view"; id: string }
  | { kind: "edit"; id: string };

/** 검색값 이름 */
export const SHEET_PARAM = "sheet";

/** 창 → 검색값 — 「new」 · 「new:2」 · 「view:id」 · 「edit:id」 */
export function sheetToParam(sheet: ExpenseSheet): string {
  if (sheet.kind === "new") return sheet.period === null ? "new" : `new:${sheet.period}`;
  return `${sheet.kind}:${sheet.id}`;
}

/** 검색값 → 창. 비었거나 모르는 모양이면 null */
export function sheetOfParam(value: string | null): ExpenseSheet | null {
  if (!value) return null;
  const [kind, ...rest] = value.split(":");
  const arg = rest.join(":");
  if (kind === "new") return { kind: "new", period: arg || null };
  if ((kind === "view" || kind === "edit") && arg) return { kind, id: arg };
  return null;
}
