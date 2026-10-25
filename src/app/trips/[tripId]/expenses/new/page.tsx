import { Suspense } from "react";

import { PageTransition } from "@/shared/ui/page-transition";
import { ExpenseCreateView } from "@/views/expense-create";

export const metadata = { title: "비용 추가" };

export default async function Page({ params }: PageProps<"/trips/[tripId]/expenses/new">) {
  const { tripId } = await params;
  // 처음 날짜를 검색 파라미터(period)에서 읽는다
  return (
    <PageTransition>
      <Suspense>
        <ExpenseCreateView tripId={tripId} />
      </Suspense>
    </PageTransition>
  );
}
