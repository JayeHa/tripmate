import { useState } from "react";

import type { ExpenseCategory } from "@/entities/expense";
import { itemName, type ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { dayIndexToDate } from "@/shared/lib/days";

import { dayOptions, dayOptionText } from "../lib/day-options";
import { expenseCategoryOf } from "../lib/link-items";
import { linkState } from "../lib/link-state";
import { type RelinkRow, relinkRows } from "../lib/relink";

/** 연결이 채우는 칸 — 폼이 쥐고, 이 훅은 바꾸기만 한다 */
type LinkedFields = {
  spentOn: string;
  setSpentOn: (date: string) => void;
  category: ExpenseCategory | null;
  setCategory: (category: ExpenseCategory) => void;
  name: string;
  setName: (name: string) => void;
  setCounted: (counted: boolean) => void;
  /** 대체 장소에 연결해 합계에서 빠지면 「추가 정보」 를 펼쳐 스위치를 보이게 */
  openMore: () => void;
};

type ExpenseLinkOptions = {
  trip: Trip;
  items: ScheduleItem[];
  alternatives: ScheduleItem[];
  /** 처음 연결 일정 id. 빈 글이면 없음 */
  startItemId: string;
  /** 수정이면 true — 저장된 날짜 · 카테고리를 연결이 덮지 않고, 연결이 없으면 「연결 안 함」 으로 보인다 */
  editing: boolean;
  /** 날짜를 미리 골라 열었다(가계부의 날짜 묶음에서 「비용 추가」 — 여행준비 포함). 연결이 덮지 않는다 */
  dayPreset: boolean;
  fields: LinkedFields;
};

/**
 * 비용의 일정 연결. 일정을 고르면 날짜 · 카테고리를 그 일정으로 채운다 — 이 폼에서 사용자가 직접 바꾼 칸은 덮지 않는다.
 * 항목명은 비워 두면 일정 이름으로 저장한다. 날짜를 바꿔도 연결은 남고(여행준비 비용도 연결할 수 있다), 다르면 알린다.
 * 이미 연결된 비용을 다른 일정으로 바꾸면 바로 바꾸지 않고 「값도 바꾸기 / 연결만 바꾸기」 를 묻는다.
 * 합계 포함은 대체 장소 여부가 바뀔 때만 따라간다 — 대체 장소에 연결하면 빼고, 대체 장소에서 타임라인 일정으로 옮기거나 연결을 지우면 넣는다
 * (「바꾸기」 와 같은 규칙). 같은 종류끼리 옮기면 사용자가 바꾼 값을 둔다
 */
export function useExpenseLink({
  trip,
  items,
  alternatives,
  startItemId,
  editing,
  dayPreset,
  fields,
}: ExpenseLinkOptions) {
  const [itemId, setItemId] = useState(startItemId);
  const [noneChosen, setNoneChosen] = useState(editing && !startItemId);
  const [dayTouched, setDayTouched] = useState(editing || dayPreset);
  const [categoryTouched, setCategoryTouched] = useState(editing);
  const [pending, setPending] = useState<ScheduleItem | null>(null);
  const findItem = (id: string) =>
    items.find((i) => i.id === id) ?? alternatives.find((i) => i.id === id) ?? null;
  // 마지막으로 연결했던 일정이 대체 장소였나 — 합계 포함을 되돌릴지 정하는 기준.
  // 지금 연결(`linked`)로 보면 ✕ · 「연결 안 함」 뒤에 기준을 잃는다. 처음 값은 저장된 연결에서(폼은 일정 · 대체 장소를 다 읽은 뒤 열린다)
  const [onAlternative, setOnAlternative] = useState(
    () => (startItemId ? findItem(startItemId)?.alternative_of : null) != null,
  );

  const days = dayOptions(trip.start_date, trip.end_date);
  const linked = itemId ? findItem(itemId) : null;
  // 연 사이 일행이 일정을 지웠으면 연결이 없는 것으로 본다(#161)
  const state = linkState(itemId, linked !== null, noneChosen);
  // 사라진 일정이 대체 장소였으면 합계에 다시 넣는다 — ✕ · 「연결 안 함」 과 같은 규칙.
  // 렌더 중에 맞춘다(같은 컴포넌트의 상태). follow 가 onAlternative 를 내려 한 번만 돈다
  if (state.gone && onAlternative) follow(false);
  const dateOf = (item: ScheduleItem) => dayIndexToDate(trip.start_date, item.day_index);
  /** 날짜 칸 아래 「연결된 일정은 day N이에요」 — 연결 일정과 날짜가 다를 때만 */
  const dayMismatch =
    linked && dateOf(linked) !== fields.spentOn ? `day ${linked.day_index + 1}` : null;

  /**
   * 일정으로 연결한다. 채우는 방식은 셋 —
   * fill: 처음 연결, 사용자가 직접 바꾸지 않은 날짜 · 카테고리만 채운다 /
   * force: 「값도 바꾸기」, 날짜 · 카테고리 · 항목명을 모두 새 일정으로 /
   * linkOnly: 「연결만 바꾸기」, 값은 그대로(확인 창이 그렇게 말했으니)
   * 합계 포함은 어느 방식이든 대체 장소 여부를 따라간다
   */
  function apply(item: ScheduleItem, mode: "fill" | "force" | "linkOnly") {
    setItemId(item.id);
    setNoneChosen(false);
    const force = mode === "force";
    if (mode !== "linkOnly") {
      if (force || !dayTouched) fields.setSpentOn(dateOf(item));
      const category = expenseCategoryOf(item);
      if (category && (force || !categoryTouched)) fields.setCategory(category);
    }
    if (force) {
      fields.setName("");
      setDayTouched(false);
      setCategoryTouched(false);
    }
    const alternative = item.alternative_of !== null;
    follow(alternative);
    if (alternative) fields.openMore();
  }

  /** 대체 장소 여부가 바뀔 때만 합계 포함을 따라 바꾼다 — 대체 장소면 빼고, 아니게 되면(다른 일정 · 연결 지움) 넣는다 */
  function follow(alternative: boolean) {
    if (alternative !== onAlternative) fields.setCounted(!alternative);
    setOnAlternative(alternative);
  }

  /** 목록에서 일정을 골랐다 — 이미 다른 일정에 연결돼 있으면 묻는다 */
  function pick(item: ScheduleItem) {
    if (state.itemId && state.itemId !== item.id) setPending(item);
    else if (state.itemId !== item.id) apply(item, "fill");
  }

  /**
   * 다른 일정으로 바꾸기 확인 — 값도 바꿀지. 「연결만 바꾸기」 인데 항목명이 비어 있으면 옛 일정 이름을 칸에 채운다 —
   * 빈 항목명은 연결 일정 이름으로 저장돼, 그대로 두면 「값은 안 바꾼다」 고 했는데 이름이 새 일정으로 바뀐다
   */
  function confirmRelink(withValues: boolean) {
    if (pending) {
      if (!withValues && !fields.name.trim() && linked) fields.setName(itemName(linked));
      apply(pending, withValues ? "force" : "linkOnly");
    }
    setPending(null);
  }

  /** 「바꿀까요?」 에서 달라질 칸 */
  function pendingRows(): RelinkRow[] {
    if (!pending) return [];
    return relinkRows(
      {
        day: dayOptionText(days, fields.spentOn),
        category: fields.category,
        name: effectiveName(),
      },
      {
        day: dayOptionText(days, dateOf(pending)),
        category: expenseCategoryOf(pending),
        name: itemName(pending),
      },
    );
  }

  /** 저장할 항목명 — 비워 두면 연결 일정 이름 */
  function effectiveName() {
    return fields.name.trim() || (linked ? itemName(linked) : "");
  }

  return {
    days,
    /** 저장할 연결 id — 사라진 일정이면 빈 글 */
    itemId: state.itemId,
    linked,
    status: state.status,
    /** 연결했던 일정이 사라졌다 — 칸 아래에 알린다 */
    gone: state.gone,
    /** 날짜를 직접 골랐다(수정 · 날짜를 미리 골라 연 비용 포함) — 고르기 창이 그날로 걸러 연다 */
    dayTouched,
    dayMismatch,
    pending,
    pendingRows,
    effectiveName,
    pick,
    confirmRelink,
    cancelRelink: () => setPending(null),
    /** 연결을 지운다(✕) — 다시 「어느 일정에서…」 로. 대체 장소 연결이었으면 합계에 다시 넣는다 */
    clear: () => {
      setItemId("");
      setNoneChosen(false);
      follow(false);
    },
    /** 「연결 안 함」 을 골랐다. 대체 장소 연결이었으면 합계에 다시 넣는다 */
    chooseNone: () => {
      setItemId("");
      setNoneChosen(true);
      follow(false);
    },
    /** 날짜를 직접 바꿨다 — 이제 연결이 날짜를 덮지 않는다 */
    pickDay: (date: string) => {
      fields.setSpentOn(date);
      setDayTouched(true);
    },
    /** 카테고리를 직접 골랐다 */
    pickCategory: (category: ExpenseCategory) => {
      fields.setCategory(category);
      setCategoryTouched(true);
    },
  };
}

export type ExpenseLink = ReturnType<typeof useExpenseLink>;
