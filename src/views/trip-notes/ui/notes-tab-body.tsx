"use client";

import { Construction } from "lucide-react";
import type { ReactNode } from "react";

import type { Voucher } from "@/entities/voucher";
import { ChecklistBoard } from "@/features/checklist";
import { EmptyState } from "@/shared/ui/empty-state";

import { NOTE_TAB_INFO } from "../lib/tabs";
import type { NotesState } from "../model/use-notes";
import { useVoucherList } from "../model/use-voucher-list";
import { VoucherList } from "./voucher-list";

type NotesTabBodyProps = {
  tripId: string;
  notes: NotesState;
  /** 체크리스트 빠른 추가 바가 붙는 높이(sticky top) */
  stickyTop: string;
  /** 바우처 필터 줄 오른쪽 끝(PC 「+ 바우처」) */
  voucherAction?: ReactNode;
};

/** 지금 탭의 내용 — 체크리스트 · 바우처, 아직 만들지 않은 탭은 「준비 중」 */
export function NotesTabBody({ tripId, notes, stickyTop, voucherAction }: NotesTabBodyProps) {
  if (notes.tab === "checklist") {
    return (
      <ChecklistBoard
        tripId={tripId}
        stickyTop={stickyTop}
        onToast={notes.showToast}
        onOpen={notes.checklistDetail.open}
        onNew={notes.checklistDetail.openNew}
      />
    );
  }
  if (notes.tab === "voucher") {
    return (
      <VoucherTab tripId={tripId} onOpen={notes.voucherForm.openEdit} action={voucherAction} />
    );
  }
  return (
    <EmptyState
      icon={Construction}
      title="준비 중이에요"
      description={`${NOTE_TAB_INFO[notes.tab].label} 탭은 곧 열려요. 체크리스트 · 바우처부터 먼저 쓸 수 있어요.`}
      className="py-20"
    />
  );
}

type VoucherTabProps = {
  tripId: string;
  onOpen: (voucher: Voucher) => void;
  action?: ReactNode;
};

/** 바우처 탭 — 목록 상태는 이 탭이 열려 있을 때만 쥔다 */
function VoucherTab({ tripId, onOpen, action }: VoucherTabProps) {
  const list = useVoucherList(tripId);
  return <VoucherList list={list} onOpen={onOpen} action={action} />;
}
