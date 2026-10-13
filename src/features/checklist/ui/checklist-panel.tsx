"use client";

import { type ElementType, useMemo } from "react";

import {
  type ChecklistItem,
  type ChecklistTargetRef,
  targetsByItem,
  useChecklist,
  useChecklistTargets,
} from "@/entities/checklist";

import type { ChecklistTarget } from "../model/use-checklist-detail";
import { ChecklistEditor } from "./checklist-editor";
import { ChecklistRead } from "./checklist-read";

type ChecklistPanelProps = {
  tripId: string;
  target: ChecklistTarget;
  /** 읽기 · 편집 대상 항목. 새 항목이면 null */
  item: ChecklistItem | null;
  /** 그 항목의 연결 */
  targets: ChecklistTargetRef[];
  onEdit: (id: string) => void;
  onClose: () => void;
  onToast: (text: string) => void;
  onLockChange?: (locked: boolean) => void;
  titleAs?: ElementType;
};

/**
 * 체크리스트 창의 내용 — 읽기 · 편집 · 새 항목. 머리 · 스크롤 본문 · 아래 버튼을 세로로 채운다.
 * 감싸는 쪽(모바일 시트 · PC 오른쪽 칸)이 높이를 정하고, 대상이 바뀌면 key 로 새로 그린다(checklistTargetKey)
 */
export function ChecklistPanel({ target, item, targets, onEdit, ...rest }: ChecklistPanelProps) {
  if (target.mode === "new")
    return <ChecklistEditor {...rest} item={null} targets={[]} title={target.title} />;
  if (!item) return null;
  if (target.mode === "edit")
    return <ChecklistEditor {...rest} item={item} targets={targets} title="" />;
  return <ChecklistRead {...rest} item={item} targets={targets} onEdit={() => onEdit(item.id)} />;
}

/** 대상마다 다른 key — 읽기 → 편집, 다른 항목, 새 항목을 다시 열면 처음 값에서 시작하게 */
export function checklistTargetKey(target: ChecklistTarget): string {
  return target.mode === "new" ? `new-${target.at}` : `${target.mode}-${target.id}`;
}

/** 연결이 없는 항목 — 매번 새 배열을 만들지 않게(시트가 닫히는 동안 붙잡아 두는 값이다) */
const NO_TARGETS: ChecklistTargetRef[] = [];

/**
 * 대상 항목 · 그 연결과 창을 보일지 — 읽기 · 편집 대상이 목록에 없으면(일행이 지웠다) 보이지 않는다.
 * 연결을 아직 못 읽었으면 보이지 않는다 — 편집 폼은 연 때의 연결에서 시작해, 빈 채로 열면 저장 때 비교가 틀린다
 */
export function useChecklistTargetItem(tripId: string, target: ChecklistTarget | null) {
  const { data: items } = useChecklist(tripId);
  const { data: rows } = useChecklistTargets(tripId);
  const item =
    target && target.mode !== "new" ? (items?.find((i) => i.id === target.id) ?? null) : null;
  // 쿼리 데이터가 바뀔 때만 다시 묶는다 — 같은 항목의 연결 배열이 렌더마다 새로 생기지 않게
  const byItem = useMemo(() => (rows ? targetsByItem(rows) : null), [rows]);
  const targets = (item && byItem?.get(item.id)) ?? NO_TARGETS;
  const ready = item !== null && rows !== undefined;
  return { item, targets, visible: target !== null && (target.mode === "new" || ready) };
}
