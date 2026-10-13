"use client";

import { useState } from "react";

import {
  CHECKLIST_GONE,
  type ChecklistItem,
  type ChecklistSave,
  useDeleteChecklistItem,
  useSaveChecklistItem,
} from "@/entities/checklist";
import { useUser } from "@/entities/session";
import { useMountedDone } from "@/shared/lib/use-mounted-done";

import {
  blankChecklistForm,
  checklistFormFrom,
  type ChecklistFormValues,
  toChecklistFields,
  toChecklistPatch,
} from "../lib/checklist-form";

type ChecklistFormOptions = {
  tripId: string;
  /** 고치는 항목. 새로 넣으면 null */
  item: ChecklistItem | null;
  /** 새 항목의 처음 제목(빠른 추가 바에 치던 것) */
  title: string;
  /** 저장 · 삭제가 끝나면 부른다 — 창은 부른 쪽이 닫는다. 삭제면 토스트 문구를 함께 */
  onDone: (toast?: string) => void;
};

/**
 * 체크리스트 추가 · 편집 — 상태 · 제목 · 마감일 · 메모 · 링크 · 홈에 고정. 열 때마다 새로 마운트돼 처음 값에서 시작한다.
 * 끝났을 때 이 창이 아직 떠 있을 때만 닫는다(늦게 끝난 요청이 그사이 연 다른 항목 창을 닫지 않게)
 */
export function useChecklistForm({ tripId, item, title, onDone }: ChecklistFormOptions) {
  // 연 때의 값 — 편집 저장은 이것과 달라진 칸만 보낸다
  const [initial] = useState<ChecklistFormValues>(() =>
    item ? checklistFormFrom(item) : blankChecklistForm(title),
  );
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useUser();
  const save = useSaveChecklistItem(tripId);
  const remove = useDeleteChecklistItem(tripId);
  const mutations = [save, remove];
  const pending = mutations.some((m) => m.isPending);
  const finish = useMountedDone(onDone);
  const finishDeleted = useMountedDone(() => onDone("항목을 삭제했어요"));

  /** 칸 하나를 고친다 */
  function set<K extends keyof ChecklistFormValues>(key: K, value: ChecklistFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  return {
    values,
    set,
    /** 검증해 저장한다(새 항목이면 넣고, 아니면 고친다) */
    save: () => {
      if (pending || !user) return;
      const result = toSave(item, values, initial, user.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      if (result.save.id !== null && Object.keys(result.save.fields).length === 0) {
        finish();
        return;
      }
      void save.mutateAsync(result.save).then(finish, () => undefined);
    },
    /** 고치는 항목을 지운다(확인창을 거친 뒤) */
    destroy: () => {
      if (!item || pending) return;
      void remove.mutateAsync(item.id).then(finishDeleted, () => undefined);
    },
    editing: item !== null,
    pending,
    canSave: values.title.trim().length > 0,
    /** 요청이 서버에 가 있는 동안(오프라인으로 멈춘 동안은 빼고) — 창을 닫지 못하게 */
    locked: mutations.some((m) => m.isPending && !m.isPaused),
    error: error ?? errorOf(mutations.map((m) => m.error).find(Boolean)),
  };
}

/** 저장할 것 — 새 항목은 모든 칸, 편집은 연 때와 달라진 칸만 */
function toSave(
  item: ChecklistItem | null,
  values: ChecklistFormValues,
  initial: ChecklistFormValues,
  userId: string,
): { ok: true; save: ChecklistSave } | { ok: false; error: string } {
  if (!item) {
    const r = toChecklistFields(values, userId);
    return r.ok ? { ok: true, save: { id: null, fields: r.fields } } : r;
  }
  const r = toChecklistPatch(values, initial, userId);
  return r.ok ? { ok: true, save: { id: item.id, fields: r.patch } } : r;
}

/** 요청 실패 문구 — 그사이 지워진 항목이면 그대로 알리고, 그 밖은 다시 시도 */
function errorOf(e: unknown): string | null {
  if (!e) return null;
  if (e instanceof Error && e.message === CHECKLIST_GONE) return CHECKLIST_GONE;
  return "저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
}

export type ChecklistFormState = ReturnType<typeof useChecklistForm>;
