/** 접힌 「누가 내고, 누구와」 카드의 둘째 줄 — lead(결제한 사람 이름, 굵게) + 나머지 글. 각자 냄이면 lead 가 없다 */
export type PeopleSummary = { lead: string | null; rest: string };

type SummaryInput = {
  /** 결제한 사람 키. 각자 냄이면 null */
  payer: string | null;
  /** 함께한 사람 키(사람 순서) */
  participants: string[];
  /** 모두 함께인가 */
  allIn: boolean;
  nameOf: (key: string) => string;
};

/**
 * 「정원 결제 · 2명 모두 함께」 · 「동규 결제 · 정원 · 서연 함께」(결제한 사람은 빼고) · 「각자 냄 · 2명」 · 「정원 혼자」.
 * 조사 없이 이름만 굵게 — 결제한 사람 이름이 무엇이든 문장이 깨지지 않게
 */
export function peopleSummary({ payer, participants, allIn, nameOf }: SummaryInput): PeopleSummary {
  if (payer === null) return { lead: null, rest: `각자 냄 · ${participants.length}명` };
  const lead = nameOf(payer);
  const others = participants.filter((key) => key !== payer);
  if (others.length === 0) return { lead, rest: " 혼자" };
  if (allIn) return { lead, rest: ` 결제 · ${participants.length}명 모두 함께` };
  return { lead, rest: ` 결제 · ${others.map(nameOf).join(" · ")} 함께` };
}
