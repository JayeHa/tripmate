/** 저장하려는 비용의 연결 일정이 그 사이 지워졌다 — 부른 쪽이 이 문구를 그대로 보인다 */
export const LINK_GONE = "연결한 일정이 지워졌어요. 연결을 풀었으니 다시 저장해 주세요";

type DbError = { code?: string; message?: string; details?: string | null };

/**
 * 비용 저장 오류가 「연결 일정이 없어서 난 FK 오류(23503, expenses_schedule_item_id_fkey)」 면 LINK_GONE 으로 바꾼다.
 * 폼은 지워진 일정을 목록에서 빠진 뒤에야 알아채는데(실시간 · 다시 읽기), 그 전에 저장하면 이 오류가 난다
 */
export function withLinkGone<E extends DbError>(error: E): E | Error {
  const text = `${error.message ?? ""} ${error.details ?? ""}`;
  return error.code === "23503" && text.includes("schedule_item_id") ? new Error(LINK_GONE) : error;
}
