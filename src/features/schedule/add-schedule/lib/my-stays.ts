import type { Stay } from "@/entities/stay";

/** 「내 숙소」 한 줄에 그릴 값 */
export type MyStayRow = {
  stay: Stay;
  /** 「10.31–11.1」 */
  rangeText: string;
  /** 「체크인 15:00 · 체크아웃 11:00」. 시각이 없으면 그 쪽을 뺀다 */
  times: string | null;
  /** 담으려는 날에 묵는 숙소(체크인 ~ 체크아웃, 양 끝 포함) */
  now: boolean;
  /** 담으려는 날에 이미 있는 이 숙소의 연결 카드 수 */
  countToday: number;
};

type LinkedItem = { stay_id: string | null; day_index: number; alternative_of: string | null };

/** 「11.1」 */
function md(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  return `${m}.${d}`;
}

/** 체크인 · 체크아웃 시각 줄. 둘 다 없으면 null */
function timesOf(stay: Stay): string | null {
  const parts = [
    stay.check_in_time && `체크인 ${stay.check_in_time.slice(0, 5)}`,
    stay.check_out_time && `체크아웃 ${stay.check_out_time.slice(0, 5)}`,
  ];
  return parts.filter(Boolean).join(" · ") || null;
}

/**
 * 일정 추가의 「내 숙소」 묶음 — 이 여행의 숙소를, 담으려는 날(date · dayIndex)에 묵는 숙소가 먼저 오게(그 안은 체크인 순 그대로).
 * 검색어가 있으면 이름 · 주소에 들어 있는 것만. 그날 이미 담긴 수도 센다(그래도 고를 수 있다 — 짐 맡기기 · 귀가)
 */
export function myStayRows(
  stays: readonly Stay[],
  items: readonly LinkedItem[],
  date: string,
  dayIndex: number,
  query: string,
): MyStayRow[] {
  const q = query.trim().toLowerCase();
  const rows = stays
    .filter((s) => !q || [s.place.name, s.place.address].some((v) => v?.toLowerCase().includes(q)))
    .map((stay) => ({
      stay,
      rangeText: `${md(stay.check_in_date)}–${md(stay.check_out_date)}`,
      times: timesOf(stay),
      now: date >= stay.check_in_date && date <= stay.check_out_date,
      countToday: items.filter(
        (it) => it.stay_id === stay.id && it.day_index === dayIndex && !it.alternative_of,
      ).length,
    }));
  return [...rows.filter((r) => r.now), ...rows.filter((r) => !r.now)];
}

/** 숙소 장소의 구글 id — 추천(구글) 결과에서 같은 곳을 빼서 「내 숙소」 와 두 번 보이지 않게 */
export function stayGoogleIds(stays: readonly Stay[]): ReadonlySet<string> {
  return new Set(stays.flatMap((s) => (s.place.google_place_id ? [s.place.google_place_id] : [])));
}
