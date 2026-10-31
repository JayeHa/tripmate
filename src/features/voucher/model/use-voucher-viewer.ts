"use client";

import { useState } from "react";

import { useUser } from "@/entities/session";
import {
  isPdf,
  useDeleteVoucher,
  useSetVoucherPin,
  useSetVoucherUsed,
  useVoucherUrls,
  viewerKeys,
  type Voucher,
} from "@/entities/voucher";
import { saveErrorText } from "@/shared/api/sync";

type VoucherViewerOptions = {
  tripId: string;
  voucher: Voucher;
  /** 지운 뒤 — 뷰어와 상세를 닫는다 */
  onDeleted: () => void;
  onToast: (text: string) => void;
};

/** 고정 · 사용 표시를 바꾸지 못했을 때 */
const CHANGE_FAILED = "바꾸지 못했어요. 잠시 후 다시 시도해 주세요.";

/**
 * 뷰어 상태 — 넘겨 보는 그림(현장용 페이지 · 사진)과 지금 쪽, 그림이 없는 PDF 의 원본 주소, 홈 고정, 「사용했어요」, 지우기.
 * 열 때마다 새로 마운트돼 첫 쪽에서 시작한다. 일행이 페이지를 줄이면 마지막 쪽으로 당긴다
 */
export function useVoucherViewer({ tripId, voucher, onDeleted, onToast }: VoucherViewerOptions) {
  const keys = viewerKeys(voucher);
  // 그림이 없는 PDF 는 원본을 새 창에서 열 주소를 미리 받아 둔다(누른 뒤 받으면 Safari 가 새 창을 막는다)
  const originalKey = keys.length === 0 && isPdf(voucher) && voucher.file_key;
  const { data: urls = {} } = useVoucherUrls(tripId, originalKey ? [originalKey] : keys);
  const [rawPage, setPage] = useState(0);
  const page = Math.min(rawPage, Math.max(keys.length - 1, 0));
  const { data: user } = useUser();
  const pin = useSetVoucherPin(tripId);
  const used = useSetVoucherUsed(tripId);
  const remove = useDeleteVoucher(tripId);

  /** 지운다 — 끝나면 알리고 닫는다 */
  async function deleteVoucher() {
    try {
      await remove.mutateAsync(voucher.id);
      onToast("바우처를 삭제했어요");
      onDeleted();
    } catch (e) {
      onToast(saveErrorText(e, "지우지 못했어요. 잠시 후 다시 시도해 주세요."));
    }
  }

  return {
    page,
    total: keys.length,
    /** 지금 쪽의 그림 주소 — 받는 중이거나 그림이 없으면 null */
    image: keys[page] ? (urls[keys[page]] ?? null) : null,
    /** 그림이 없는 PDF 의 원본 주소 */
    originalUrl: originalKey ? (urls[originalKey] ?? null) : null,
    /** 앞뒤로 넘긴다 — 끝에서는 멈춘다 */
    go: (delta: number) =>
      setPage(Math.min(Math.max(page + delta, 0), Math.max(keys.length - 1, 0))),
    pinned: voucher.pinned_by !== null,
    /** 홈에 고정 · 풀기 — 누구나, 고정한 사람을 남긴다 */
    togglePin: () => {
      if (!user) return;
      void pin
        .mutateAsync({ id: voucher.id, value: voucher.pinned_by ? null : user.id })
        .catch((e: unknown) => onToast(saveErrorText(e, CHANGE_FAILED)));
    },
    /** 쓴 시각 — 아직 안 썼으면 null */
    usedAt: voucher.used_at,
    /** 「사용했어요」 · 되돌리기 — 누구나. 바뀐 뒤 알린다 */
    toggleUsed: () => {
      const next = voucher.used_at ? null : new Date().toISOString();
      void used
        .mutateAsync({ id: voucher.id, value: next })
        .then(() => onToast(next ? "사용한 바우처로 표시했어요" : "사용 표시를 되돌렸어요"))
        .catch((e: unknown) => onToast(saveErrorText(e, CHANGE_FAILED)));
    },
    remove: () => void deleteVoucher(),
    deleting: remove.isPending,
  };
}

export type VoucherViewerState = ReturnType<typeof useVoucherViewer>;
