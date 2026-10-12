import type { ExpenseDraft } from "@/entities/expense";
import type { Flight } from "@/entities/flight";

/**
 * 항공편 창에서 비용 입력 창을 열어 달라는 요청. 비용 입력 창은 다른 기능이라 화면(view)이 연다.
 * - payment: 항공편의 결제 — 붙어 있는 비용(없으면 null → 그 항공편의 결제로 새로 추가). name 은 새 결제의 이름
 * - draft: 아직 저장하지 않은 새 항공편의 결제 — 들고 있는 초안(없으면 null). 창의 「완료」 · 「삭제」 는 onDraft 로 초안만 바꾼다
 * - linked: 항공편 카드에 「일정 연결」 로 붙은 비용 — 그 비용 수정
 */
export type FlightExpenseRequest =
  | { kind: "payment"; flightId: string; name: string; expenseId: string | null }
  | {
      kind: "draft";
      name: string;
      draft: ExpenseDraft | null;
      onDraft: (draft: ExpenseDraft | null) => void;
    }
  | { kind: "linked"; expenseId: string };

/** 결제 이름 「제주항공 7C1181」 — DB 의 flight_expense_name 과 같은 값(저장할 때 DB 가 맞춘다) */
export function flightPayName(f: Pick<Flight, "airline_name" | "airline_code" | "flight_no">) {
  return `${f.airline_name} ${f.airline_code}${f.flight_no}`;
}
