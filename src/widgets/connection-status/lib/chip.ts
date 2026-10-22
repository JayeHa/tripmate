/** 칩 하나의 상태 — 보일 것이 없으면 null */
export type SyncChip =
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "waiting"; count: number }
  | { kind: "failed"; count: number };

/**
 * 지금 보일 칩 — 실패가 먼저, 그다음 기다림 · 올리는 중 · 방금 다 올림.
 * 「저장 중…」 은 기다리던 변경을 올릴 때만(backlog) — 온라인에서 체크할 때마다 칩이 깜빡이지 않게
 */
export function chipOf(
  waiting: number,
  saving: number,
  failed: number,
  saved: boolean,
  backlog: boolean,
): SyncChip | null {
  if (failed > 0) return { kind: "failed", count: failed };
  if (waiting > 0) return { kind: "waiting", count: waiting };
  if (saving > 0 && backlog) return { kind: "saving" };
  return saved ? { kind: "saved" } : null;
}
