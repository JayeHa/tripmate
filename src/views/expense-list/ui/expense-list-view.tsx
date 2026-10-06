"use client";

import { CloudOff } from "lucide-react";

import { useMediaQuery } from "@/shared/lib/use-media-query";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Toast } from "@/shared/ui/toast";

import { useExpenseList } from "../model/use-expense-list";
import { MobileExpenseList } from "./mobile/mobile-expense-list";
import { PcExpenseList } from "./pc/pc-expense-list";

type ExpenseListViewProps = { tripId: string };

/**
 * 가계부 목록. 데이터는 useExpenseList 가 쥐고, 배치는 모바일(묶음 목록 + 합계 바) · PC(표 + 합계 칸)가 그린다.
 * 첫 렌더(하이드레이션)에서는 화면 폭을 몰라 아무 레이아웃도 그리지 않는다. 읽기에 실패하면 안내와 「다시 시도」 를 보인다
 */
export function ExpenseListView({ tripId }: ExpenseListViewProps) {
  const list = useExpenseList(tripId);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  if (isDesktop === null) return null;
  if (!list.ready) {
    return (
      <>
        {!isDesktop && <AppHeader title="가계부" back="/trips" />}
        {list.failed ? (
          <EmptyState
            icon={CloudOff}
            title="가계부를 불러오지 못했어요"
            description="인터넷 연결을 확인하고 다시 시도해 주세요."
            action={
              <Button variant="outline" size="form" onClick={list.retry}>
                다시 시도
              </Button>
            }
            className="flex-1 justify-center py-20"
          />
        ) : (
          <div className="flex flex-col gap-3 p-5">
            <Skeleton className="h-16 rounded-card" />
            <Skeleton className="h-16 rounded-card" />
          </div>
        )}
      </>
    );
  }
  return (
    <>
      {isDesktop ? (
        <PcExpenseList tripId={tripId} list={list} />
      ) : (
        <MobileExpenseList tripId={tripId} list={list} />
      )}
      <Toast message={list.toast} onDone={list.clearToast} />
    </>
  );
}
