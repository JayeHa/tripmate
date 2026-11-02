"use client";

import { useRouter } from "next/navigation";

import { NAV } from "@/shared/lib/nav-transition";
import { ExpenseDetailScreen } from "@/widgets/expense-detail";

type ExpenseDetailViewProps = { tripId: string; expenseId: string };

/**
 * 비용 상세 페이지 — 주소로 바로 열었을 때(새로고침 · 공유 링크 · 카테고리 상세 · 정산 화면의 비용 줄). 모바일 가계부 목록은 목록 위의 창으로 연다.
 * ✕ 는 가계부로, 「수정」 은 입력 화면(닫거나 저장하면 이 화면으로 돌아온다), 지우면 가계부로.
 * 수정 화면과는 기록을 바꿔치기(replace)로 오간다 — 상세 → 수정 → 상세 뒤 「뒤로」 가 상세를 한 번 더 보이지 않고 가계부로 가게.
 * 큰 화면에서는 비용 입력 페이지처럼 가운데 440 으로 그린다
 */
export function ExpenseDetailView({ tripId, expenseId }: ExpenseDetailViewProps) {
  const router = useRouter();
  const list = `/trips/${tripId}/expenses`;
  return (
    <ExpenseDetailScreen
      tripId={tripId}
      expenseId={expenseId}
      frame="page"
      onClose={() => router.push(list, { transitionTypes: NAV.back })}
      onEdit={() => router.replace(`${list}/${expenseId}/edit`, { transitionTypes: NAV.forward })}
      onDeleted={() => router.replace(list, { transitionTypes: NAV.back })}
    />
  );
}
