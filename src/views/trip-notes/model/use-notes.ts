"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { openCount, useChecklist } from "@/entities/checklist";
import { useVouchers, type Voucher } from "@/entities/voucher";
import { useChecklistDetail } from "@/features/checklist";
import type { ToastMessage } from "@/shared/ui/toast";

import { type NoteTab, parseNoteTab } from "../lib/tabs";

/**
 * 노트 화면의 상태 — 지금 탭(주소의 tab, 다른 화면에서 「노트에서 보기」 로 바로 열 수 있게) · 탭 숫자 · 토스트 ·
 * 열린 체크리스트 창(모바일 시트 · PC 오른쪽 칸이 같은 상태를 그린다) · 고른 바우처(모바일 상세 페이지 · PC 오른쪽 칸)와 그 뷰어 · 바우처 추가 · 수정 창.
 * 탭을 바꾸면 주소를 바꾸되 방문 기록은 쌓지 않는다
 */
export function useNotes(tripId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const tab = parseNoteTab(useSearchParams().get("tab"));
  const { data: checklist } = useChecklist(tripId);
  const { data: vouchers } = useVouchers(tripId);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const checklistDetail = useChecklistDetail();
  // 열린 바우처 폼 — 고치는 바우처는 연 때의 것을 쥔다(그사이 지워져도 새 바우처로 바뀌지 않게)
  const [voucherId, setVoucherId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [voucherForm, setVoucherForm] = useState<{ voucher: Voucher | null } | null>(null);
  return {
    tab,
    setTab: (next: NoteTab) => router.replace(`${pathname}?tab=${next}`, { scroll: false }),
    /** 탭 · 메뉴의 숫자 — 아직 없는 탭은 null */
    counts: {
      checklist: checklist ? String(openCount(checklist)) : null,
      voucher: vouchers ? String(vouchers.length) : null,
      pack: null,
      shop: null,
    } satisfies Record<NoteTab, string | null>,
    checklistDetail,
    /** 고른 바우처 — 목록 캐시에서 id 로 찾아 그린다 */
    voucherDetail: {
      id: voucherId,
      open: (voucher: Voucher) => setVoucherId(voucher.id),
      close: () => {
        setVoucherId(null);
        setViewerOpen(false);
      },
    },
    /** 고른 바우처의 전체 화면 뷰어 */
    voucherViewer: {
      open: viewerOpen && voucherId !== null,
      show: () => setViewerOpen(true),
      close: () => setViewerOpen(false),
    },
    /** 바우처 추가 · 수정 창 */
    voucherForm: {
      open: voucherForm !== null,
      voucher: voucherForm?.voucher ?? null,
      openNew: () => setVoucherForm({ voucher: null }),
      openEdit: (voucher: Voucher) => setVoucherForm({ voucher }),
      close: () => setVoucherForm(null),
    },
    toast,
    showToast: (text: string) => setToast({ text, id: Date.now() }),
    clearToast: () => setToast(null),
  };
}

export type NotesState = ReturnType<typeof useNotes>;
