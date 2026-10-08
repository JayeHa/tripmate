"use client";

import { useState } from "react";

import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";

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
  // 닫히는 동안에도 내용을 그리고, 열 때마다 누른 카테고리부터 새로 그린다(같은 카테고리를 다시 열어도 지난 칩이 남지 않게)
  const isOpen = opened !== null;
  const shown = useHeldWhileClosing(isOpen, opened);
  const opens = useOpenCount(isOpen);
  return (
    <ScreenModal
      open={opened !== null}
      onClose={onClose}
      title="카테고리"
      subtitle={list.trip.title}
    >
      <CategoryBody key={opens} list={list} initial={shown ?? "all"} />
    </ScreenModal>
  );
}

type CategoryBodyProps = { list: ExpenseList; initial: CategoryPick };

/** 창 안 — 칩으로 바꾼 카테고리를 들고 있다(창을 열 때마다 새로 그려 initial 부터) */
function CategoryBody({ list, initial }: CategoryBodyProps) {
  const [pick, setPick] = useState(initial);
  return <CategoryDetail list={list} pick={pick} onPick={setPick} />;
}
