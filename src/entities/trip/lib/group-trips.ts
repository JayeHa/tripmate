/**
 * 여행을 다가오는 / 지난 것으로 가른다.
 * 기준은 종료일이다. 오늘 끝나는 여행은 아직 다가오는 쪽에 둔다.
 * 다가오는 건 가까운 순, 지난 건 최근 순으로 본다.
 * 빈 묶음은 섹션 제목째 사라진다.
 * `kind` 는 PC 에서 다가오는 건 카드, 지난 건 줄로 그리기 위해 둔다.
 */
type DateRange = { start_date: string; end_date: string };

export function groupTrips<T extends DateRange>(trips: T[], today: string) {
  const byStart = [...trips].sort((a, b) => a.start_date.localeCompare(b.start_date));
  return [
    {
      kind: "upcoming" as const,
      title: "다가오는 여행",
      trips: byStart.filter((t) => t.end_date >= today),
    },
    {
      kind: "past" as const,
      title: "지난 여행",
      trips: byStart.filter((t) => t.end_date < today).reverse(),
    },
  ].filter((group) => group.trips.length > 0);
}
