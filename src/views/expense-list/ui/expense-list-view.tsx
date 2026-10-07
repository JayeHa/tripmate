"use client";

import { CloudOff } from "lucide-react";

import { useMediaQuery } from "@/shared/lib/use-media-query";
import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Skeleton } from "@/shared/ui/skeleton";
import { Toast } from "@/shared/ui/toast";

import { parseCategoryPick } from "../lib/category-detail";
import { type ExpenseList, useExpenseList } from "../model/use-expense-list";
import { MobileCategory } from "./mobile/mobile-category";
import { MobileDashboard } from "./mobile/mobile-dashboard";
import { MobileExpenseList, TOAST_ABOVE_FAB } from "./mobile/mobile-expense-list";
import { MobileSettle } from "./mobile/mobile-settle";
import { PcExpenseList } from "./pc/pc-expense-list";

type ExpenseListViewProps = {
  tripId: string;
  /**
   * 모바일 화면 — 내역(목록) · 지출 · 정산(대시보드) · 카테고리 상세 · 정산. PC 는 한 화면(오른쪽 패널이 대시보드,
   * 카테고리 상세 · 정산은 창)이라 쓰지 않는다
   */
  tab?: MobileScreen;
  /** 카테고리 상세의 처음 카테고리(주소의 c) */
  category?: string;
  /** 정산 화면의 처음 사람(주소의 p, 사람 키) */
  person?: string;
};

type MobileScreen = "list" | "stats" | "category" | "settle";

/**
 * 가계부. 데이터는 useExpenseList 가 쥐고, 배치는 모바일(요약 · 달력 띠 · 날짜 묶음) · PC(표 + 합계 칸)가 그린다.
 * 첫 렌더(하이드레이션)에서는 화면 폭을 몰라 아무 레이아웃도 그리지 않는다. 읽기에 실패하면 안내와 「다시 시도」 를 보인다
 */
export function ExpenseListView({ tripId, tab = "list", category, person }: ExpenseListViewProps) {
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
        <MobileTab tab={tab} tripId={tripId} list={list} category={category} person={person} />
      )}
      <Toast message={list.toast} onDone={list.clearToast} mobileOffset={TOAST_ABOVE_FAB} />
    </>
  );
}

type MobileTabProps = {
  tab: MobileScreen;
  tripId: string;
  list: ExpenseList;
  category: string | undefined;
  person: string | undefined;
};

/** 모바일 화면 하나 — 내역 · 지출 · 정산 · 카테고리 상세 · 정산(사람 상세) */
function MobileTab({ tab, tripId, list, category, person }: MobileTabProps) {
  if (tab === "settle")
    return <MobileSettle tripId={tripId} list={list} initial={person ?? null} />;
  if (tab === "stats") return <MobileDashboard tripId={tripId} list={list} />;
  if (tab === "category") {
    return <MobileCategory tripId={tripId} list={list} initial={parseCategoryPick(category)} />;
  }
  return <MobileExpenseList tripId={tripId} list={list} />;
}
