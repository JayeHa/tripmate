/**
 * 만든 순서(created_at)로 비교한다. 문자열로 비교하면 안 된다 — Postgres 는 소수 초가 0 이면 소수부를 빼고 내보내
 * 「…:05+00:00」 이 「…:05.5+00:00」 보다 뒤로 간다
 */
export function byCreatedAt(a: { created_at: string }, b: { created_at: string }): number {
  return Date.parse(a.created_at) - Date.parse(b.created_at);
}
