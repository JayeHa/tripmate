"use client";

import { useMemo, useState } from "react";

import { buildTimeline, type ScheduleItem, useApplyScheduleEdit } from "@/entities/schedule-item";

import {
  draftOf,
  editChanges,
  type EditDraft,
  isSelectable,
  keepLive,
  moveSelected,
  removeSelected,
  reorder,
} from "../lib/edit-draft";

type ScheduleEditOptions = {
  tripId: string;
  /** 여행의 타임라인 일정(대체 장소 빼고) */
  items: ScheduleItem[];
  totalDays: number;
  /** 편집을 마쳤다(저장했거나 바뀐 게 없거나 버렸다). 마지막으로 편집하던 날을 넘긴다 */
  onExit: (day: number) => void;
};

/** 편집 한 번 — 열 때의 일정으로 만든 처음 초안과 지금 초안 */
type EditSession = { initial: EditDraft; draft: EditDraft };

const NONE: ReadonlySet<string> = new Set();

/**
 * 일정 편집 — 한 날짜씩 보며 순서를 끌어 바꾸고, 골라서 지우거나 다른 날로 옮긴다. 「완료」 전까지는 초안만 바뀌고
 * 「완료」 에서 한 번에 저장한다(apply_schedule_edit). 뒤로 가면 버린다.
 * 화면이 늘 들고 있다가 start 로 연다 — 모바일 · PC 레이아웃이 바뀌어도 초안이 남는다
 */
export function useScheduleEdit({ tripId, items, totalDays, onExit }: ScheduleEditOptions) {
  const [session, setSession] = useState<EditSession | null>(null);
  const [day, setDay] = useState(0);
  const [selected, setSelected] = useState(NONE);
  const apply = useApplyScheduleEdit(tripId);
  const live = useMemo(() => new Set(items.map((it) => it.id)), [items]);
  // 열 때 고정한 초안에서 그 뒤 사라진 일정을 뺀 것. 화면 · 저장은 이걸 기준으로 한다
  const draft = useMemo(() => session && keepLive(session.draft, live), [session, live]);
  const initial = useMemo(() => session && keepLive(session.initial, live), [session, live]);
  const dayIds = draft?.[day];
  // 지도가 핀을 다시 맞추지 않게 초안 · 일정이 그대로면 같은 배열을 준다
  const dayItems = useMemo(() => {
    const byId = new Map(items.map((it) => [it.id, it]));
    return (dayIds ?? []).flatMap((id) => byId.get(id) ?? []);
  }, [items, dayIds]);
  const rows = useMemo(() => buildTimeline(dayItems), [dayItems]);
  const selectableIds = dayItems.filter(isSelectable).map((it) => it.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
  const changes = draft && initial ? editChanges(initial, draft) : null;
  const dirty = !!changes && (Object.keys(changes.days).length > 0 || changes.deletes.length > 0);

  /**
   * 초안을 바꾼다. 사라진 일정을 먼저 빼고 바꾼다 — 끌기 인덱스는 화면(rows) 기준이라
   * 사라진 id 가 남은 초안에 그대로 쓰면 엉뚱한 일정이 옮겨진다
   */
  function change(fn: (draft: EditDraft) => EditDraft) {
    setSession((s) => s && { ...s, draft: fn(keepLive(s.draft, live)) });
  }

  /** 초안을 바꾸고 고른 것은 비운다 */
  function edit(fn: (draft: EditDraft) => EditDraft) {
    change(fn);
    setSelected(NONE);
  }

  /** 편집을 닫는다 */
  function exit() {
    setSession(null);
    setSelected(NONE);
    apply.reset();
    onExit(day);
  }

  return {
    editing: session !== null,
    /** 보고 있던 날로 편집을 연다 */
    start: (startDay: number) => {
      const initial = draftOf(items, totalDays);
      setSession({ initial, draft: initial });
      setDay(startDay);
      setSelected(NONE);
    },
    day,
    /** 편집할 날을 바꾼다. 선택은 그날 것만 의미가 있어 비운다 */
    setDay: (next: number) => {
      setDay(next);
      setSelected(NONE);
    },
    dayItems,
    /** 편집 목록 · 지도가 그릴 줄(번호 · 설명) */
    rows,
    reorder: (from: number, to: number) => change((d) => reorder(d, day, from, to)),
    selected,
    toggle: (item: ScheduleItem) => {
      if (!isSelectable(item)) return;
      setSelected((s) => {
        const next = new Set(s);
        if (!next.delete(item.id)) next.add(item.id);
        return next;
      });
    },
    allSelected,
    /** 「day 전체 선택 · 해제」(항공편 빼고) */
    toggleAll: () => setSelected(allSelected ? NONE : new Set(selectableIds)),
    removeSelected: () => edit((d) => removeSelected(d, selected)),
    /** 고른 일정을 그날 맨 끝으로 */
    moveSelected: (target: number) => edit((d) => moveSelected(d, selected, target)),
    dirty,
    /** 「완료」 — 바뀐 게 있으면 한 번에 저장하고 닫는다. 실패하면 열어 둔 채 error 를 보인다 */
    done: () => {
      if (apply.isPending) return;
      if (!changes || !dirty) {
        exit();
        return;
      }
      void apply.mutateAsync(changes).then(exit, () => undefined);
    },
    /** 저장하지 않고 닫는다(바뀐 게 있으면 부르는 쪽이 먼저 묻는다) */
    discard: () => {
      if (!apply.isPending) exit();
    },
    saving: apply.isPending,
    error: apply.error ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null,
  };
}

export type ScheduleEditState = ReturnType<typeof useScheduleEdit>;
