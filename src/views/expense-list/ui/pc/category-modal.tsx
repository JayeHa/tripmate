"use client";

import { useState } from "react";

import type { CategoryPick } from "../../lib/category-detail";
import type { ExpenseList } from "../../model/use-expense-list";
import { CategoryDetail } from "../category/category-detail";
import { ScreenModal } from "./screen-modal";

type CategoryModalProps = {
  list: ExpenseList;
  /** 열 때 고른 카테고리. null 이면 닫혀 있다 */
  opened: CategoryPick | null;
  onClose: () => void;
};

/**
 * PC 카테고리 상세 — 모바일 화면을 그대로 가운데 480×760 창(ScreenModal)으로.
 * 창 안에서 칩으로 바꾼 카테고리는 창을 닫으면 잊는다(다음에 열면 누른 카테고리부터)
 */
export function CategoryModal({ list, opened, onClose }: CategoryModalProps) {
  // 닫히는 동안(페이드 아웃)에도 내용을 그리도록 마지막으로 고른 것을 그대로 둔다.
  // 열릴 때마다(닫힘 → 열림) 누른 카테고리로 되돌린다 — 값으로 비교하면 같은 카테고리를 다시 열 때 지난 칩이 남는다
  const [pick, setPick] = useState<CategoryPick>(opened ?? "all");
  const [wasOpen, setWasOpen] = useState(opened !== null);
  const isOpen = opened !== null;
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (opened !== null) setPick(opened);
  }
  return (
    <ScreenModal
      open={opened !== null}
      onClose={onClose}
      title="카테고리"
      subtitle={list.trip.title}
    >
      <CategoryDetail list={list} pick={pick} onPick={setPick} />
    </ScreenModal>
  );
}
