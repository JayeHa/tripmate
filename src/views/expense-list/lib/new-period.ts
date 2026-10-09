import { dateToDayIndex } from "@/shared/lib/days";

/**
 * 「+ 비용 추가」 가 열 날(주소의 period) — 날짜 줄이 보이면(목록을 내려 본 뒤) 줄에서 고른 날.
 * 맨 위(날짜 줄이 숨음)에서는 고른 칸이 늘 첫 칸(여행준비)이라 그대로 쓰지 않고 오늘로 정한다 —
 * 여행 전이면 여행준비, 여행 중이면 오늘, 여행이 끝났으면 null(폼의 기본 = 여행 첫날)
 */
export function newPeriod(
  selected: string,
  rowShown: boolean,
  start: string,
  end: string,
  today: string,
): string | null {
  if (rowShown) return selected;
  if (today < start) return "prep";
  if (today > end) return null;
  return String(dateToDayIndex(start, end, today));
}
