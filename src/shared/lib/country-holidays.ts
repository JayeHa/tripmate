/** 여행지 국가의 공휴일 하루 — 날짜(yyyy-MM-dd, 그 나라 날짜)와 이름(영어). 같은 날 공휴일이 둘이면 이름을 「 · 」 로 잇는다 */
export type CountryHoliday = { date: string; name: string };

/** 공휴일 데이터의 한 줄 — date-holidays 가 돌려주는 것 중 쓰는 칸만 */
export type RawHoliday = { date: string; name: string; type: string; start: Date; end: Date };

/** 반나절 이하로 쉬는 날은 뺀다(중국 「여성의 날」 처럼 일부만 쉬는 날) */
const HALF_DAY_MS = 12 * 60 * 60 * 1000;

/**
 * 공휴일 데이터를 우리 모양으로 — 모두 쉬는 공휴일(type public)만, 하루를 다 쉬는 날만 남기고 날짜순으로 같은 날을 하나로 합친다.
 * 은행 휴무(bank) · 기념일(observance)은 가게 · 관광지가 평소대로 열어 여행에 영향이 적어 뺀다
 */
export function toCountryHolidays(raw: readonly RawHoliday[]): CountryHoliday[] {
  const byDate = new Map<string, string[]>();
  for (const h of raw) {
    if (h.type !== "public" || h.end.getTime() - h.start.getTime() <= HALF_DAY_MS) continue;
    const date = h.date.slice(0, 10);
    const names = byDate.get(date) ?? [];
    if (!names.includes(h.name)) names.push(h.name);
    byDate.set(date, names);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, names]) => ({ date, name: names.join(" · ") }));
}
