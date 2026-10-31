import { useEffect } from "react";

/** 들어갈 때 보여 줄 곳 — 오늘 날짜와 그날 다음 장소(없으면 날짜 머리) */
export type ScheduleEntry = { day: number; id: string | null };

type EntryScrollOptions = {
  /** 날짜 묶음을 다 그렸는지 */
  ready: boolean;
  /** 처리할 곳. 처리하면 onDone 으로 알리고 뷰가 비운다 */
  entry: ScheduleEntry | null;
  scrollToDay: (day: number, smooth?: boolean) => boolean;
  /** 그 장소를 강조하고 그 줄로 스크롤한다(지도도 그 장소로). smooth 가 false 면 애니메이션 없이 */
  focusOn: (id: string, smooth?: boolean) => void;
  /** PC 하루씩 보기면 스크롤하지 않고 이것으로 그 날을 연다 */
  openDay?: (day: number) => void;
  /** PC 하루씩 보기인가 */
  oneDay?: boolean;
  onDone: () => void;
};

/**
 * 일정 화면에 들어갈 때 여행 중이면 오늘의 다음 장소로 — 그 장소를 강조하며 그 줄로 애니메이션 없이 간다(`?day` 첫 이동과 같다).
 * 보고 있는 날(`?day` · 칩)은 스크롤을 따라 맞춰진다. 오늘 일정을 다 마쳤으면 오늘 날짜 머리로.
 * 한 번 처리하면 뷰가 entry 를 비운다(onDone) — 화면 폭이 바뀌어 다른 레이아웃이 새로 마운트돼도 다시 옮기지 않는다
 */
export function useEntryScroll({
  ready,
  entry,
  scrollToDay,
  focusOn,
  openDay,
  oneDay = false,
  onDone,
}: EntryScrollOptions) {
  useEffect(() => {
    if (!ready || !entry) return;
    if (oneDay && openDay) openDay(entry.day);
    // 날짜로 옮기면(scrollToDay) 그 날 머리에 붙잡아 두어 늦게 그려진 내용에 다시 머리로 끌려 올라간다 — 장소가 있으면 그 줄로만 간다
    else if (entry.id) focusOn(entry.id, false);
    else scrollToDay(entry.day, false);
    onDone();
  }, [ready, entry, scrollToDay, focusOn, openDay, oneDay, onDone]);
}
