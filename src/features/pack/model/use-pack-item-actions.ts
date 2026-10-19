"use client";

import { useState } from "react";

import {
  isChecked,
  type PackBoard,
  type PackItem,
  type PackItemDraft,
  packItemPatch,
  useDeletePackItem,
  usePackLists,
  useUncheckPackItems,
  useUpdatePackItem,
} from "@/entities/pack";
import { useUser } from "@/entities/session";

/** 실패했을 때 — 다시 해 보라고만 알린다 */
const FAILED = "저장하지 못했어요. 잠시 후 다시 시도해 주세요";

/**
 * 항목 하나를 다루는 것 — 상세 시트(열린 항목) · 왼쪽으로 민 줄(한 번에 하나) · 지우기 확인 · 「모두 해제」 확인과 그 요청.
 * 요청은 화면을 먼저 바꾸고 바로 닫는다. 실패하면 되돌리고 토스트로 알린다
 */
export function usePackItemActions(
  tripId: string,
  board: PackBoard | null,
  onToast: (text: string) => void,
) {
  const { data: lists } = usePackLists(tripId);
  const { data: user } = useUser();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<PackItem | null>(null);
  const [resetting, setResetting] = useState(false);
  const update = useUpdatePackItem(tripId);
  const remove = useDeletePackItem(tripId);
  const uncheck = useUncheckPackItems(tripId);
  const items = board?.groups.flatMap((g) => g.items) ?? [];
  const checkedIds = items.filter(isChecked).map((i) => i.id);

  /** 요청을 보내고 실패하면 알린다 */
  function run(p: Promise<unknown>, failed = FAILED) {
    p.catch(() => onToast(failed));
  }

  return {
    /** 상세 시트에 띄운 항목 — 그사이 일행이 지웠으면 null(시트가 닫힌다) */
    detail: items.find((i) => i.id === detailId) ?? null,
    /** 줄을 눌렀다 — 민 줄이 있으면 닫기만, 아니면 상세를 연다 */
    openDetail: (id: string) => {
      if (swipedId) setSwipedId(null);
      else setDetailId(id);
    },
    closeDetail: () => setDetailId(null),
    swipedId,
    /** 줄의 열림이 바뀌었다 — 열면 그 줄만, 닫으면 그 줄이 열려 있었을 때만 */
    setSwiped: (id: string, open: boolean) =>
      setSwipedId((cur) => {
        if (open) return id;
        return cur === id ? null : cur;
      }),
    deleting,
    askDelete: (item: PackItem) => setDeleting(item),
    cancelDelete: () => setDeleting(null),
    /** 지우기 확인 — 상세도 닫는다 */
    confirmDelete: () => {
      if (!deleting) return;
      setDeleting(null);
      setSwipedId(null);
      setDetailId(null);
      run(remove.mutateAsync(deleting.id), "지우지 못했어요. 잠시 후 다시 시도해 주세요");
      onToast("항목을 삭제했어요");
    },
    /** 상세의 저장 — 바뀐 칸만, 없으면 닫기만 */
    save: (item: PackItem, draft: PackItemDraft) => {
      setDetailId(null);
      if (!user) return;
      const patch = packItemPatch(
        item,
        draft,
        lists?.items ?? [],
        user.id,
        new Date().toISOString(),
      );
      if (Object.keys(patch).length === 0) return;
      run(update.mutateAsync({ id: item.id, patch }));
      onToast("저장했어요");
    },
    /** 「모두 해제」 — 챙긴 것이 없으면 누를 수 없다 */
    checkedCount: checkedIds.length,
    resetting,
    askReset: () => setResetting(true),
    cancelReset: () => setResetting(false),
    confirmReset: () => {
      setResetting(false);
      if (checkedIds.length > 0) run(uncheck.mutateAsync(checkedIds));
    },
  };
}

export type PackItemActions = ReturnType<typeof usePackItemActions>;
