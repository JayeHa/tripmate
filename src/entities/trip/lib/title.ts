/** 새 여행의 기본 제목. 고른 도시를 가운뎃점으로 잇는다: 「도쿄·오사카 여행」 */
export function titleFromCities(names: readonly string[]) {
  return `${names.join("·")} 여행`;
}
