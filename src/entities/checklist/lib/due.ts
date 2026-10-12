const DOW = "일월화수목금토";

/** 「YYYY-MM-DD」 의 그 날 0시(현지) 밀리초 */
function dayMs(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** 마감 칩에 쓸 것 */
export type DueView = {
  /** 「10/10(토) · D-7」 · 「10/3(토) · 오늘」 · 「10/1(목) · 지남」 */
  text: string;
  /** 7일 안이거나 지났다 — 주황 */
  soon: boolean;
};

/** 마감일까지 남은 날 — 오늘이면 0, 지났으면 음수 */
export function daysUntil(due: string, today: string): number {
  return Math.round((dayMs(due) - dayMs(today)) / 86_400_000);
}

/** 「D-7」 · 「오늘」 · 「지남」 */
export function ddayText(days: number): string {
  if (days === 0) return "오늘";
  return days < 0 ? "지남" : `D-${days}`;
}

/** 「10/10(토)」 */
export function dueDateText(due: string): string {
  const [, m, d] = due.split("-").map(Number);
  return `${m}/${d}(${DOW[new Date(dayMs(due)).getDay()]})`;
}

/** 목록 행의 마감 칩. 7일 안(지난 것 포함)이면 주황 */
export function dueView(due: string, today: string): DueView {
  const days = daysUntil(due, today);
  return { text: `${dueDateText(due)} · ${ddayText(days)}`, soon: days <= 7 };
}
