"use client";

import { useState } from "react";

import { AppHeader } from "@/shared/ui/app-header";

import type { CategoryPick } from "../../lib/category-detail";
import type { ExpenseList } from "../../model/use-expense-list";
import { CategoryDetail } from "../category/category-detail";

type MobileCategoryProps = { tripId: string; list: ExpenseList; initial: CategoryPick };

/** 모바일 카테고리 상세 — 머리 ← (지출 · 정산 탭으로) · 「카테고리」, 칩으로 카테고리를 바꾼다(주소는 처음 연 것 그대로) */
export function MobileCategory({ tripId, list, initial }: MobileCategoryProps) {
  const [pick, setPick] = useState(initial);
  return (
    <>
      <AppHeader
        title="카테고리"
        subtitle={list.trip.title}
        back={`/trips/${tripId}/expenses/stats`}
      />
      <main className="flex flex-col pb-10">
        <CategoryDetail list={list} pick={pick} onPick={setPick} />
      </main>
    </>
  );
}
