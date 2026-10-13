"use client";

import type { ElementType } from "react";

import { type ChecklistItem, useChecklist } from "@/entities/checklist";

import type { ChecklistTarget } from "../model/use-checklist-detail";
import { ChecklistEditor } from "./checklist-editor";
import { ChecklistRead } from "./checklist-read";

type ChecklistPanelProps = {
  tripId: string;
  target: ChecklistTarget;
  /** 읽기 · 편집 대상 항목. 새 항목이면 null */
  item: ChecklistItem | null;
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
export function ChecklistPanel({ target, item, onEdit, ...rest }: ChecklistPanelProps) {
  if (target.mode === "new") return <ChecklistEditor {...rest} item={null} title={target.title} />;
  if (!item) return null;
  if (target.mode === "edit") return <ChecklistEditor {...rest} item={item} title="" />;
  return <ChecklistRead {...rest} item={item} onEdit={() => onEdit(item.id)} />;
}

/** 대상마다 다른 key — 읽기 → 편집, 다른 항목, 새 항목을 다시 열면 처음 값에서 시작하게 */
export function checklistTargetKey(target: ChecklistTarget): string {
  return target.mode === "new" ? `new-${target.at}` : `${target.mode}-${target.id}`;
}

/**
 * 대상 항목과 창을 보일지 — 읽기 · 편집 대상이 목록에 없으면(일행이 지웠다) 보이지 않는다
 */
export function useChecklistTargetItem(tripId: string, target: ChecklistTarget | null) {
  const { data: items } = useChecklist(tripId);
  const item =
    target && target.mode !== "new" ? (items?.find((i) => i.id === target.id) ?? null) : null;
  return { item, visible: target !== null && (target.mode === "new" || item !== null) };
}
