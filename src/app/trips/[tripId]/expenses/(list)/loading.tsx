import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseListSkeleton } from "@/views/expense-list";

/**
 * 가계부 목록 · 「지출 · 정산」 을 서버에서 받는 동안 — 0.3초 넘게 걸리면 뼈대를 보인다.
 * `(list)` 묶음에 두어 하위 화면(비용 추가 · 상세 · 정산 · 카테고리)에는 목록 뼈대가 뜨지 않게 한다 — loading 은 아래 화면을 모두 감싼다
 */
export default function Loading() {
  return (
    <PageTransition>
      <ExpenseListSkeleton />
    </PageTransition>
  );
}
