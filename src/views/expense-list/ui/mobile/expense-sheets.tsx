"use client";

import { useState } from "react";

import { ExpenseDialog, type ExpenseDialogTarget } from "@/features/expense/form";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { ExpenseDetailScreen } from "@/widgets/expense-detail";

import type { ExpenseSheet } from "../../lib/expense-sheet";
import type { ExpenseSheetState } from "../../model/use-expense-sheet";

/** 입력 창에 열 것 — 비용 추가 · 수정. 상세면 null */
function formTargetOf(sheet: ExpenseSheet | null): ExpenseDialogTarget | null {
  if (sheet?.kind === "new") return { kind: "new", period: sheet.period };
  if (sheet?.kind === "edit") return { kind: "edit", expenseId: sheet.id };
  return null;
}

type ExpenseSheetsProps = {
  tripId: string;
  sheets: ExpenseSheetState;
  onToast: (text: string) => void;
};

/**
 * 모바일 가계부 목록 위의 창들 — 비용 추가 · 수정(ExpenseDialog, 전체 화면)과 비용 상세(전체 화면).
 * 상세의 「수정」 은 수정 창으로 바꾸고, 수정 창을 닫거나 저장하면 상세로 돌아온다(페이지 흐름과 같다).
 * 수정 창에서 지웠거나 일행이 지워 상세에 보일 비용이 없으면 닫는다
 */
export function ExpenseSheets({ tripId, sheets, onToast }: ExpenseSheetsProps) {
  const { sheet } = sheets;
  const viewing = sheet?.kind === "view" ? sheet.id : null;
  // 닫히는 동안에도 상세를 그린다
  const shownId = useHeldWhileClosing(viewing !== null, viewing);
  // 상세에서 지우는 동안은 Esc · 바깥 누르기로 닫지 않는다 — 실패 문구를 볼 곳이 남게
  const [locked, setLocked] = useState(false);
  /** 입력 창을 닫았다 — 수정이었으면 그 상세로, 추가였으면 목록으로 */
  const closeForm = () => {
    if (sheet?.kind === "edit") sheets.swap({ kind: "view", id: sheet.id });
    else sheets.close();
  };
  return (
    <>
      <ExpenseDialog
        tripId={tripId}
        target={formTargetOf(sheet)}
        onClose={closeForm}
        onToast={onToast}
      />
      <Dialog
        open={viewing !== null}
        locked={locked}
        onOpenChange={(open) => !open && sheets.close()}
      >
        <DialogContent
          showCloseButton={false}
          className="flex h-dvh w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">비용 상세</DialogTitle>
          {shownId && (
            <ExpenseDetailScreen
              tripId={tripId}
              expenseId={shownId}
              frame="modal"
              onClose={sheets.close}
              onEdit={() => sheets.swap({ kind: "edit", id: shownId })}
              onDeleted={sheets.close}
              onMissing={viewing ? sheets.close : undefined}
              onLockChange={setLocked}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
