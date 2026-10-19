"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import type { PackGroupView } from "@/entities/pack";
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

import { GROUP_NAME_MAX, ITEM_NAME_MAX } from "../lib/copy";
import type { PackBoardState } from "../model/use-pack-board";
import { PackItemRow } from "./pack-item-row";
import { PackTextInput } from "./pack-text-input";

type PackGroupCardProps = { view: PackGroupView; state: PackBoardState };

/**
 * 그룹 카드(r12) — 머리(이름 입력 14/800 · 「챙긴 수/전체」 · 휴지통), 항목 줄, 맨 아래 「+ 항목 추가」(Enter 로 담는다).
 * 접기 · 순서 바꾸기는 없다(시안). 항목이 있는 그룹은 지우기 전에 묻는다
 */
export function PackGroupCard({ view, state }: PackGroupCardProps) {
  const { group, items } = view;
  const [confirming, setConfirming] = useState(false);
  return (
    <section className="overflow-hidden rounded-card border border-surface-muted bg-white">
      <div className="flex items-center gap-2 border-b border-surface-muted py-2 pr-2 pl-4">
        <GroupNameInput
          key={group.name}
          name={group.name}
          onCommit={(name) => state.renameGroup(group.id, name)}
        />
        <span className="shrink-0 text-xs text-ink-400">
          {view.done}/{view.total}
        </span>
        <button
          type="button"
          aria-label={`${group.name} 그룹 삭제`}
          onClick={() => (items.length > 0 ? setConfirming(true) : state.deleteGroup(group.id))}
          className="flex size-8 shrink-0 items-center justify-center rounded-button text-ink-350 hover:bg-surface-sunken"
        >
          <Trash2 className="size-3.75" aria-hidden="true" />
        </button>
      </div>
      <ul>
        {items.map((item) => (
          <PackItemRow
            key={item.id}
            item={item}
            checker={state.checkerOf(item)}
            onToggle={() => state.toggle(item)}
          />
        ))}
      </ul>
      <div className="border-t border-surface-sunken px-3 pt-1.5 pb-2.5">
        <PackTextInput
          onSubmit={(name) => state.addItem(group.id, name)}
          maxLength={ITEM_NAME_MAX}
          placeholder="+ 항목 추가"
          label={`${group.name}에 항목 추가`}
          className="h-9 w-full bg-transparent px-1 text-sm text-ink-900 outline-none placeholder:text-ink-350"
        />
      </div>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>「{group.name}」 그룹을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              안에 있는 항목 {items.length}개도 같이 지워져요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={() => state.deleteGroup(group.id)}>
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

type GroupNameInputProps = { name: string; onCommit: (name: string) => void };

/**
 * 그룹 이름 칸(늘 입력 칸, 시안) — 칸을 벗어나거나 Enter 로 저장한다. 비우면 원래 이름으로 돌린다.
 * 바깥에서 이름이 바뀌면(일행이 고침) key 로 새로 그린다
 */
function GroupNameInput({ name, onCommit }: GroupNameInputProps) {
  const [value, setValue] = useState(name);

  /** 저장 — 비었거나 그대로면 원래 이름으로 */
  function commit() {
    const next = value.trim();
    if (!next || next === name) {
      setValue(name);
      return;
    }
    onCommit(next);
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) e.currentTarget.blur();
      }}
      maxLength={GROUP_NAME_MAX}
      aria-label="그룹 이름"
      className="h-8 min-w-0 flex-1 bg-transparent text-sm font-extrabold text-ink-900 outline-none"
    />
  );
}
