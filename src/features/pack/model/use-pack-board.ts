"use client";

import { useState } from "react";

import {
  PACK_PRESETS,
  packBoard,
  type PackItem,
  type PackKind,
  useAddPackGroup,
  useAddPackItem,
  useAddPackPresets,
  useDeletePackGroup,
  usePackLists,
  useRenamePackGroup,
  useSetPackChecked,
} from "@/entities/pack";
import { useUser } from "@/entities/session";
import { useMemberLookup } from "@/entities/trip-member";

/** 실패했을 때 — 다시 해 보라고만 알린다 */
const FAILED = "저장하지 못했어요. 잠시 후 다시 시도해 주세요";

/**
 * 준비물 · 쇼핑 목록의 상태와 동작 — 그룹 · 항목 추가, 체크(누구나, 나로), 그룹 이름 바꾸기 · 지우기, 기본 목록.
 * 요청은 결과를 호출마다 받아(mutateAsync) 이어서 여러 개를 넣어도 실패를 놓치지 않는다. 실패는 토스트로 알린다
 */
export function usePackBoard(tripId: string, kind: PackKind, onToast: (text: string) => void) {
  const { data: lists, isPending } = usePackLists(tripId);
  const { data: user } = useUser();
  const memberOf = useMemberLookup(tripId);
  // 「빈 목록으로 시작」 — 그룹이 없어도 빈 상태 안내 대신 그룹 추가 칸을 보인다(이 화면에서만)
  const [startedEmpty, setStartedEmpty] = useState(false);
  const addGroup = useAddPackGroup(tripId, kind);
  const rename = useRenamePackGroup(tripId);
  const removeGroup = useDeletePackGroup(tripId);
  const addItem = useAddPackItem(tripId);
  const check = useSetPackChecked(tripId);
  const presets = useAddPackPresets(tripId, kind);
  const board = lists ? packBoard(lists, kind) : null;

  /** 요청을 보내고 실패하면 알린다 */
  function run(p: Promise<unknown>, failed = FAILED) {
    p.catch(() => onToast(failed));
  }

  return {
    isPending,
    board,
    /** 그룹이 없고 「빈 목록으로 시작」 도 누르지 않았다 — 빈 상태 안내 */
    showEmpty: !!board && board.groups.length === 0 && !startedEmpty,
    startEmpty: () => setStartedEmpty(true),
    startPresets: () => run(presets.mutateAsync(PACK_PRESETS)),
    presetsPending: presets.isPending,
    addGroup: (name: string) => run(addGroup.mutateAsync(name.trim())),
    renameGroup: (id: string, name: string) => run(rename.mutateAsync({ id, name })),
    deleteGroup: (id: string) =>
      run(removeGroup.mutateAsync(id), "지우지 못했어요. 잠시 후 다시 시도해 주세요"),
    addItem: (groupId: string, name: string) =>
      run(addItem.mutateAsync({ groupId, name: name.trim() })),
    /** 체크 — 챙기면 나로, 풀면 누가 체크했든 푼다(시안) */
    toggle: (item: PackItem) => {
      if (!user) return;
      run(check.mutateAsync({ id: item.id, checkedBy: item.checked_at ? null : user.id }));
    },
    /** 체크한 사람 — 이름 · 사진. 나간 멤버면 null */
    checkerOf: (item: PackItem) => memberOf(item.checked_by),
    /** 사용자 id → 이름 · 사진(상세의 챙김 줄) */
    memberOf,
    me: user?.id ?? null,
  };
}

export type PackBoardState = ReturnType<typeof usePackBoard>;
