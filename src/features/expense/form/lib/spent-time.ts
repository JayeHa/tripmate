/** 지금 시각 「HH:MM」(이 기기의 시간대) */
export function nowTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

type AutoTimeInput = {
  /** 쓴 날 yyyy-MM-dd. ""(여행준비)면 시각이 없다 */
  spentOn: string;
  /** 연결한 일정의 시작 시각(「10:50:00」 · 「10:50」). 연결이 없거나 시간 없는 일정이면 null */
  itemTime: string | null;
  /** 오늘 yyyy-MM-dd */
  today: string;
  /** 폼을 연 시각 「HH:MM」 */
  now: string;
};

/**
 * 손대지 않은 시간 칸의 값(#288) — 연결한 일정에 시간이 있으면 그 시간, 아니면 쓴 날이 오늘이면 지금 시각, 아니면 빈 칸.
 * 여행 중 그날 넣는 비용은 손대지 않아도 순서가 맞고, 몰아서 넣는 지난 비용은 비워 둔다
 */
export function autoTime({ spentOn, itemTime, today, now }: AutoTimeInput): string {
  if (!spentOn) return "";
  if (itemTime) return itemTime.slice(0, 5);
  return spentOn === today ? now : "";
}
