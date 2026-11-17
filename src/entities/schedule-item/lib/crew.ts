import type { PeopleStars } from "@/entities/schedule-item";

/** 별점 줄에 그릴 멤버 — 아바타 · 이름 */
export type CrewMember = { id: string; name: string; avatarUrl: string | null };

/** 일행 한 사람 — 안 매겼으면 stars 가 null(「아직」) */
export type CrewPerson = CrewMember & { stars: number | null };

/** 다녀온 카드의 「일행」 줄 */
export type CrewRating = {
  /** 보일 일행(나 빼고, 멤버 순서) */
  people: CrewPerson[];
  /** 줄여서 숨긴 일행 수 — 「+2」. 없으면 0 */
  more: number;
  /** 매긴 사람(나 포함)이 2명 이상일 때 평균(소수 한 자리). 아니면 null */
  average: number | null;
};

/** 일행이 이보다 많으면 앞의 3명 + 「+N」 으로 줄인다(나머지는 기록 자세히 보기에서) */
const MAX_PEOPLE = 4;
const SHOWN_WHEN_CUT = 3;

/**
 * 한 장소의 「일행」 줄 — 나를 뺀 멤버마다 별점(안 매겼으면 null), 4명을 넘으면 3명 + 「+N」.
 * 평균은 매긴 멤버(나 포함)가 2명 이상일 때만. 혼자 여행이면(일행이 없으면) null — 줄을 그리지 않는다.
 * 멤버가 아닌 사람(나간 사람)의 별점은 세지 않는다
 */
export function crewRating(
  members: readonly CrewMember[],
  me: string | null,
  stars: PeopleStars,
): CrewRating | null {
  const others = members.filter((m) => m.id !== me);
  if (others.length === 0) return null;
  const cut = others.length > MAX_PEOPLE;
  const shown = cut ? others.slice(0, SHOWN_WHEN_CUT) : others;
  const rated = members.map((m) => stars[m.id]).filter((n): n is number => n !== undefined);
  return {
    people: shown.map((m) => ({ ...m, stars: stars[m.id] ?? null })),
    more: others.length - shown.length,
    average: rated.length >= 2 ? averageOf(rated) : null,
  };
}

/** 평균 — 소수 한 자리 */
function averageOf(stars: readonly number[]): number {
  return Math.round((stars.reduce((a, b) => a + b, 0) / stars.length) * 10) / 10;
}

/** 별점 박스의 한 사람 — 나는 이름 뒤에 「(나)」 */
export type BoardPerson = CrewPerson & { me: boolean };

/** 기록 자세히 보기의 별점 박스 — 사람마다 한 줄 */
export type RatingBoard = {
  /** 나 먼저, 그 뒤는 멤버 순서. 줄이지 않는다 */
  people: BoardPerson[];
  /** 매긴 멤버의 평균(소수 한 자리) — 「★ 4.5 · 2명」. 아무도 안 매겼으면 null */
  average: number | null;
  /** 매긴 멤버 수 */
  count: number;
};

/**
 * 한 장소의 별점 박스 — 멤버 모두(나 먼저)의 별점과 평균 · 매긴 사람 수.
 * 혼자 여행이면 null — 박스 대신 내 별점 한 줄을 그린다. 나간 사람의 별점은 세지 않는다
 */
export function ratingBoard(
  members: readonly CrewMember[],
  me: string | null,
  stars: PeopleStars,
): RatingBoard | null {
  if (members.length < 2) return null;
  const people = members.map((m) => ({ ...m, stars: stars[m.id] ?? null, me: m.id === me }));
  const rated = people.map((p) => p.stars).filter((n) => n !== null);
  return {
    people: [...people.filter((p) => p.me), ...people.filter((p) => !p.me)],
    average: rated.length > 0 ? averageOf(rated) : null,
    count: rated.length,
  };
}

/**
 * 기록 사진을 올린 사람 — 썸네일의 아바타 · 「2 / 3 · 김동규」. userId 가 null 이면 나(방금 고른 사진).
 * 혼자 여행이면 null — 올린 사람이 늘 나라 그리지 않는다. 여행에서 나간 사람도 null
 */
export function uploaderOf(
  members: readonly CrewMember[],
  me: string | null,
  userId: string | null,
): CrewMember | null {
  if (members.length < 2) return null;
  const id = userId ?? me;
  return members.find((m) => m.id === id) ?? null;
}
