/**
 * 목록 원소에 React key 를 붙인다. 같은 값이 두 번 나오면 `값#2` 처럼 몇 번째인지를 덧붙인다.
 * 메모 줄 · 링크처럼 id 가 없고 중복될 수 있는 정적 목록용이다. 배열 index 는 린트가 막는다.
 */
export function withKeys<T>(list: T[], keyOf: (value: T) => string): { key: string; value: T }[] {
  const seen = new Map<string, number>();
  return list.map((value) => {
    const base = keyOf(value);
    const nth = (seen.get(base) ?? 0) + 1;
    seen.set(base, nth);
    return { key: nth === 1 ? base : `${base}#${nth}`, value };
  });
}
