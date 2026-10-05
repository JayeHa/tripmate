"use client";

import { useMemo, useState } from "react";

import { buildTimeline, type ScheduleItem, useApplyScheduleEdit } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";

import {
  draftOf,
  editChanges,
  type EditDraft,
  exceedsTripDays,
  isSelectable,
  keepLive,
  moveSelected,
  removeSelected,
  reorder,
  summariesOf,
  summaryChanges,
} from "../lib/edit-draft";

type ScheduleEditOptions = {
  tripId: string;
  /** 여행의 타임라인 일정(대체 장소 빼고) */
  items: ScheduleItem[];
  /** 일정을 다 읽었는지. 읽는 중에 열면 빈 초안이 되고, 뒤에 도착한 일정은 초안에 들어가지 않는다 */
  itemsReady: boolean;
  /** 하루 요약(day_summaries)을 읽을 여행. 읽기 전이면 요약 없이 연다 */
  trip: Pick<Trip, "day_summaries"> | undefined;
  totalDays: number;
  /** 편집을 마쳤다(저장했거나 바뀐 게 없거나 버렸다). 마지막으로 편집하던 날을 넘긴다 */
  onExit: (day: number) => void;
  /** 편집하는 동안 일행이 여행 기간을 줄여 편집을 닫았다 — 부른 쪽이 알린다(토스트) */
  onInterrupted: (message: string) => void;
};

/** 편집 한 번 — 열 때의 일정 · 하루 요약으로 만든 처음 초안과 지금 초안 */
type EditSession = {
  initial: EditDraft;
  draft: EditDraft;
  initialSummaries: string[];
  summaries: string[];
};

const NONE: ReadonlySet<string> = new Set();

/**
 * 일정 편집 — 한 날짜씩 보며 순서를 끌어 바꾸고, 골라서 지우거나 다른 날로 옮긴다. 「완료」 전까지는 초안만 바뀌고
 * 「완료」 에서 한 번에 저장한다(apply_schedule_edit). 뒤로 가면 버린다.
 * 화면이 늘 들고 있다가 start 로 연다 — 모바일 · PC 레이아웃이 바뀌어도 초안이 남는다
 */
export function useScheduleEdit({
  tripId,
  items,
  itemsReady,
  trip,
  totalDays,
  onExit,
  onInterrupted,
}: ScheduleEditOptions) {
  const [session, setSession] = useState<EditSession | null>(null);
  const [day, setDay] = useState(0);
  const [selected, setSelected] = useState(NONE);
  const apply = useApplyScheduleEdit(tripId);
  const canStart = trip !== undefined && itemsReady;
  // 편집하는 동안 일행이 기간을 줄였다 — 초안에 사라진 날이 남으면 저장이 계속 막혀서 닫고 알린다(늘어난 건 초안이 받는다)
  if (session && exceedsTripDays(session.draft, session.summaries, totalDays)) {
    setSession(null);
    setSelected(NONE);
    onInterrupted("여행 기간이 바뀌어 편집을 닫았어요");
  }
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
  const changes =
    session && draft && initial
      ? {
          ...editChanges(initial, draft),
          summaries: summaryChanges(session.initialSummaries, session.summaries),
        }
      : null;
  const dirty =
    !!changes &&
    (Object.keys(changes.days).length > 0 ||
      changes.deletes.length > 0 ||
      Object.keys(changes.summaries).length > 0);

  /**
   * 초안을 바꾼다. 사라진 일정을 먼저 빼고 바꾼다 — 끌기 인덱스는 화면(rows) 기준이라
   * 사라진 id 가 남은 초안에 그대로 쓰면 엉뚱한 일정이 옮겨진다
   */
  function change(fn: (draft: EditDraft) => EditDraft) {
    // 저장 중에 바꾼 것은 저장되지 않고 닫힐 때 사라진다
    if (apply.isPending) return;
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

  /** 보고 있던 날로 편집을 연다(canStart 일 때만) */
  function start(startDay: number) {
    if (!canStart) return;
    const initial = draftOf(items, totalDays);
    const sums = summariesOf(trip?.day_summaries ?? [], totalDays);
    setSession({ initial, draft: initial, initialSummaries: sums, summaries: sums });
    setDay(startDay);
    setSelected(NONE);
  }

  return {
    editing: session !== null,
    /**
     * 그날로 여는 동작 — 일정 · 여행을 다 읽기 전이면 undefined(들어가는 버튼을 숨기거나 막는다).
     * 편집 화면은 여행이 있어야 그려져서, 그 전에 열면 화면 없이 「편집 중」 이 되어 나갈 길이 없다.
     * 들어가는 곳(day 헤더 · 플로팅)이 모두 이걸 쓴다
     */
    opener: (startDay: number) => (canStart ? () => start(startDay) : undefined),
    day,
    /** 편집할 날을 바꾼다. 선택은 그날 것만 의미가 있어 비운다 */
    setDay: (next: number) => {
      if (apply.isPending) return;
      setDay(next);
      setSelected(NONE);
    },
    dayItems,
    /** 편집하는 날의 하루 요약(초안) */
    summary: session?.summaries[day] ?? "",
    /** 편집하는 날의 요약을 바꾼다. 편집 중 여행이 늘어 목록에 없는 날이면 빈 날을 채워 늘린다(moveSelected 와 같다) */
    setSummary: (text: string) => {
      if (apply.isPending) return;
      setSession(
        (s) =>
          s && {
            ...s,
            summaries: Array.from({ length: Math.max(s.summaries.length, day + 1) }, (_, i) =>
              i === day ? text : (s.summaries[i] ?? ""),
            ),
          },
      );
    },
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
    /** 저장 중 — 화면은 목록 · 버튼을 막는다(오프라인으로 멈춰도 다시 연결되면 이 초안으로 저장된다) */
    saving: apply.isPending,
    error: apply.error ? "저장하지 못했어요. 잠시 후 다시 시도해 주세요." : null,
  };
}

export type ScheduleEditState = ReturnType<typeof useScheduleEdit>;
