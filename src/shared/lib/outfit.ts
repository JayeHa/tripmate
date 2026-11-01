/**
 * 기온별 추천 옷차림 — 하루 평균 기온(최고 · 최저의 가운데)으로 옷 2~3개를 고르고,
 * 일교차가 크면 「겉옷 챙기기」, 비 올 확률이 높으면 「우산」 을 더한다
 */

/** 기온 구간 — 평균 기온(반올림)이 from 이상인 첫 구간. 겉옷이 들어간 구간이면 outer */
type OutfitBand = { from: number; items: readonly string[]; outer: boolean };

const BANDS: readonly OutfitBand[] = [
  { from: 28, items: ["민소매", "반팔", "반바지"], outer: false },
  { from: 23, items: ["반팔", "얇은 셔츠", "면바지"], outer: false },
  { from: 20, items: ["얇은 긴팔", "면바지"], outer: false },
  { from: 17, items: ["맨투맨", "가디건", "긴바지"], outer: true },
  { from: 12, items: ["니트", "자켓", "청바지"], outer: true },
  { from: 9, items: ["트렌치코트", "니트", "두꺼운 바지"], outer: true },
  { from: 5, items: ["코트", "히트텍", "목도리"], outer: true },
  { from: -Infinity, items: ["패딩", "장갑", "목도리"], outer: true },
];

/** 이 이상 벌어지면 아침저녁이 쌀쌀해 겉옷을 더한다(°) */
const WIDE_RANGE = 10;
/** 이 이상이면 우산(%) */
const RAINY = 50;

/**
 * 그날 추천 옷차림 — 「맨투맨 · 가디건 · 긴바지」 처럼 이어 쓸 낱말들.
 * 겉옷이 없는 구간에서 일교차가 10° 이상이면 「겉옷 챙기기」, 비 올 확률 50% 이상이면 「우산」 을 끝에 더한다
 */
export function outfitFor(day: { max: number; min: number; rain: number | null }): string[] {
  const avg = Math.round((day.max + day.min) / 2);
  const band = BANDS.find((b) => avg >= b.from) ?? BANDS[BANDS.length - 1];
  const items = [...band.items];
  if (!band.outer && day.max - day.min >= WIDE_RANGE) items.push("겉옷 챙기기");
  if ((day.rain ?? 0) >= RAINY) items.push("우산");
  return items;
}
