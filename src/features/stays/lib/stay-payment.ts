import type { ExpenseDraft } from "@/entities/expense";

/** 가계부에서 숙소 결제가 기록되는 곳 — 결제 칸 아래 안내 */
export const STAY_LEDGER_LABEL = "여행준비 · 숙소";

/**
 * 숙소 결제 칸을 열어 달라는 요청. 비용 입력 창은 다른 기능이라 화면(view)이 연다.
 * - saved: 저장된 숙소 — 숙소 이름(새 비용의 이름) · 붙어 있는 비용(없으면 null → 새로 추가). 창의 「완료」 가 바로 저장한다
 * - draft: 아직 저장하지 않은 새 숙소 — 들고 있는 초안(없으면 null). 창의 「완료」 · 「삭제」 는 onDraft 로 초안만 바꾼다
 */
export type StayPaymentRequest =
  | { kind: "saved"; stayId: string; name: string; expenseId: string | null }
  | {
      kind: "draft";
      name: string;
      draft: ExpenseDraft | null;
      onDraft: (draft: ExpenseDraft | null) => void;
    };
