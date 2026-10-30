import type { City } from "@/entities/city";

/** 여행 도시에서 빼는 도시 중 일정이 남는 것 — 이름과 그 도시 장소를 쓰는 일정 수 */
export type KeptItems = { name: string; count: number }[];

/** 지금 도시 중 새로 고른 목록에 없는 것(지금 순서대로) */
export function removedCities(current: readonly City[], picked: readonly City[]): City[] {
  const kept = new Set(picked.map((c) => c.id));
  return current.filter((c) => !kept.has(c.id));
}

/** 같은 도시를 같은 순서로 골랐는가 — 바뀐 게 없으면 저장할 것도 없다 */
export function sameCities(current: readonly City[], picked: readonly City[]): boolean {
  return current.length === picked.length && current.every((c, i) => c.id === picked[i].id);
}

/** 뺀 도시 중 일정이 있는 것만, 뺀 순서대로 */
export function keptItems(removed: readonly City[], counts: Record<string, number>): KeptItems {
  return removed.flatMap((c) => (counts[c.id] ? [{ name: c.name, count: counts[c.id] }] : []));
}

/** 확인창 문구 — 「오사카 · 교토 일정 5개는 그대로 남아요」 */
export function keptItemsLabel(kept: KeptItems): string {
  const names = kept.map((k) => k.name).join(" · ");
  const total = kept.reduce((sum, k) => sum + k.count, 0);
  return `${names} 일정 ${total}개는 그대로 남아요`;
}
