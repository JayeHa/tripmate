/** 도시 고르기 CTA(새 여행 모바일 · 도시 편집). 두 곳까지 이름을 보이고 나머지는 「외 N곳」 */
export function cityCtaLabel(names: readonly string[]) {
  if (names.length === 0) return "최소 1개 도시 선택";
  const shown =
    names.length > 2 ? `${names.slice(0, 2).join("·")} 외 ${names.length - 2}곳` : names.join("·");
  return `${shown} 선택 완료`;
}
