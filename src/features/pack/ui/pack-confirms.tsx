"use client";

import { iGa } from "@/shared/lib/josa";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import type { PackItemActions } from "../model/use-pack-item-actions";

type PackConfirmsProps = {
  actions: PackItemActions;
  /** 「챙긴 항목」 · 「산 항목」 */
  checkedItems: string;
};

/**
 * 확인 창 둘 — 항목 지우기(스와이프 · 상세의 휴지통) · 「모두 해제」.
 * 시안은 묻지 않고 바로 하지만, 일행이 함께 쓰는 목록이라 되돌릴 수 없는 동작은 묻는다(2026-10-19 사용자 결정)
 */
export function PackConfirms({ actions, checkedItems }: PackConfirmsProps) {
  // 닫히는 동안에도 지운 항목 이름이 남게
  const name = useHeldWhileClosing(!!actions.deleting, actions.deleting?.name ?? "");
  // 확인하면 화면이 먼저 바뀌어 0 이 된다 — 닫히는 동안 「0개」 가 보이지 않게
  const count = useHeldWhileClosing(actions.resetting, actions.checkedCount);
  return (
    <>
      <AlertDialog open={!!actions.deleting} onOpenChange={(o) => !o && actions.cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>항목을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              「{name}」{iGa(name)} 일행의 목록에서도 사라져요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={actions.confirmDelete}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={actions.resetting} onOpenChange={(o) => !o && actions.cancelReset()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>모두 해제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {checkedItems} {count}개의 체크를 모두 풀어요. 일행의 목록에도 반영돼요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={actions.confirmReset}>
              해제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
