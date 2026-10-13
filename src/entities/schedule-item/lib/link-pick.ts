import type { ReactNode } from "react";

/**
 * 일정 연결 고르기(`ScheduleLinkField`)의 목록 계산 — 날짜 묶음 · 검색 · 날짜/카테고리 필터.
 * 묶음 · 줄 모양만 받는다 — 비용 · 바우처 · 체크리스트가 각자 일정을 이 모양으로 바꿔 넘긴다
 */

export type LinkPickCategory = { value: string; label: string };

export type LinkPickItem = {
  id: string;
  title: string;
  /** 둘째 줄(종류 · 시간) — 검색에도 쓴다 */
  meta: string;
  /** 카테고리 필터 값. 없으면 카테고리 필터를 걸었을 때 빠진다 */
  category: LinkPickCategory | null;
  /** 왼쪽 28 아이콘 칸 */
  thumb?: ReactNode;
};

export type LinkPickGroup = {
  key: string;
  /** 「day 2」 — 칸 글자 · 날짜 필터 */
  short: string;
  /** 「11.1 (일)」. 날짜가 없는 묶음(체크리스트의 「숙소」)이면 "" — 머리에 short 만 */
  date: string;
  items: LinkPickItem[];
};

export type LinkPickFilter = {
  /** 날짜 묶음 key. 「전체」 면 null */
  day: string | null;
  category: string | null;
  query: string;
};

/**
 * 필터를 건 묶음 — 줄이 없는 묶음은 뺀다. 검색어가 있으면 날짜 필터는 보지 않는다(모든 날에서 찾는다).
 * 검색은 제목 · 둘째 줄에서 대소문자를 가리지 않는다
 */
export function filterLinkGroups(
  groups: LinkPickGroup[],
  { day, category, query }: LinkPickFilter,
): LinkPickGroup[] {
  const q = query.trim().toLowerCase();
  return groups
    .filter((g) => q !== "" || day === null || g.key === day)
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (item) =>
          (category === null || item.category?.value === category) &&
          (q === "" || `${item.title} ${item.meta}`.toLowerCase().includes(q)),
      ),
    }))
    .filter((g) => g.items.length > 0);
}

/** 날짜 필터의 처음 값 — 그 날에 묶음(일정)이 없으면 전체(null). 없는 날로 열면 목록이 비고 칩은 안 걸린 것처럼 보인다 */
export function startLinkDay(groups: LinkPickGroup[], day: string | null): string | null {
  return day !== null && groups.some((g) => g.key === day) ? day : null;
}

/** 카테고리 필터의 줄 — 목록에 있는 카테고리만, 처음 나온 순서대로 */
export function linkPickCategories(groups: LinkPickGroup[]): LinkPickCategory[] {
  const seen = new Map<string, LinkPickCategory>();
  for (const item of groups.flatMap((g) => g.items)) {
    if (item.category && !seen.has(item.category.value))
      seen.set(item.category.value, item.category);
  }
  return [...seen.values()];
}

/** 고른 줄과 그 묶음 — 칸에 「day 2 · 이름」 을 그리려고. 없으면 null */
export function findLinkPick(
  groups: LinkPickGroup[],
  id: string | null,
): { group: LinkPickGroup; item: LinkPickItem } | null {
  if (!id) return null;
  for (const group of groups) {
    const item = group.items.find((i) => i.id === id);
    if (item) return { group, item };
  }
  return null;
}
