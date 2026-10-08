"use client";

import type { PersonKey } from "@/entities/expense";
import { useHeldWhileClosing, useOpenCount } from "@/shared/lib/use-dialog-state";

import type { Dashboard } from "../../model/use-dashboard";
import type { ExpenseList } from "../../model/use-expense-list";
import { SettlePerson } from "../settle/settle-person";
import { ScreenModal } from "./screen-modal";

type SettleModalProps = {
  list: ExpenseList;
  dash: Dashboard;
  /** 연 사람(null 이면 나부터). 창이 닫혀 있으면 undefined */
  opened: PersonKey | null | undefined;
  onClose: () => void;
};

/**
 * PC 정산 — 모바일 정산 화면을 그대로 가운데 480×760 창(ScreenModal)으로.
 * 열릴 때마다 처음부터 그린다(「바꾸기」 · 탭 · 세그먼트는 창을 닫으면 잊고, 다음에 열면 누른 사람부터)
 */
export function SettleModal({ list, dash, opened, onClose }: SettleModalProps) {
  const isOpen = opened !== undefined;
  // 닫히는 동안에도 내용을 그리도록 마지막으로 연 사람을 붙잡고, 열릴 때마다 key 를 바꿔 새로 그린다
  const shown = useHeldWhileClosing(isOpen, opened ?? null);
  const opens = useOpenCount(isOpen);
  return (
    <ScreenModal open={isOpen} onClose={onClose} title="정산" subtitle={list.trip.title}>
      {dash.settle && (
        <SettlePerson
          key={opens}
          list={list}
          settle={dash.settle}
          avatarOf={dash.avatarOf}
          initial={shown}
        />
      )}
    </ScreenModal>
  );
}
