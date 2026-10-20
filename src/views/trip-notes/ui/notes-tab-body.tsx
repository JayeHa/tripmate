"use client";

import type { ReactNode } from "react";

import type { Voucher } from "@/entities/voucher";
import { ChecklistBoard } from "@/features/checklist";
import { PackBoard } from "@/features/pack";

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
  /** 고른 바우처 줄을 칠한다(PC — 오른쪽 칸에 보이는 것) */
  selectVoucher?: boolean;
};

/** 지금 탭의 내용 — 체크리스트 · 바우처 · 준비물 · 쇼핑 */
export function NotesTabBody({
  tripId,
  notes,
  stickyTop,
  voucherAction,
  selectVoucher = false,
}: NotesTabBodyProps) {
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
      <VoucherTab
        tripId={tripId}
        selectedId={selectVoucher ? notes.voucherDetail.id : null}
        onOpen={notes.voucherDetail.open}
        action={voucherAction}
      />
    );
  }
  // 준비물 · 쇼핑은 같은 부품이라 key 로 나눈다 — 탭을 바꾸면 열린 시트 · 「빈 목록으로 시작」 이 다른 종류로 넘어가지 않게
  return <PackBoard key={notes.tab} tripId={tripId} kind={notes.tab} onToast={notes.showToast} />;
}

type VoucherTabProps = {
  tripId: string;
  selectedId: string | null;
  onOpen: (voucher: Voucher) => void;
  action?: ReactNode;
};

/** 바우처 탭 — 목록 상태는 이 탭이 열려 있을 때만 쥔다 */
function VoucherTab({ tripId, selectedId, onOpen, action }: VoucherTabProps) {
  const list = useVoucherList(tripId);
  return <VoucherList list={list} selectedId={selectedId} onOpen={onOpen} action={action} />;
}
