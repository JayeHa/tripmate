/**
 * 일정 담기(add_schedule_place) 실패를 사용자 문구로. 다시 해도 안 되는 실패는 해결 방법을,
 * 그 밖(네트워크 · 서버)은 다시 시도를 안내한다. 판정은 DB 함수 · RLS 가 내는 메시지로 한다(0015).
 */
export function addPlaceErrorMessage(error: unknown): string {
  const message = messageOf(error);
  if (message.includes("has no city")) {
    return "여행에 도시가 없어 이름만으로는 담을 수 없어요. 검색 결과에서 장소를 골라 주세요.";
  }
  if (message.includes("name is required")) return "장소 이름을 입력해 주세요.";
  if (message.includes("row-level security")) return "이 여행에 일정을 담을 권한이 없어요.";
  return "일정에 담지 못했어요. 잠시 후 다시 시도해 주세요.";
}

/**
 * 오류의 message. supabase-js 는 throwOnError 없이 쓰면 `{ message, code, details, hint }` 평범한 객체를 돌려준다 —
 * PostgrestError 인스턴스가 아니라 `instanceof Error` 로는 읽히지 않는다. message 문자열이 있는 무엇이든 읽는다.
 */
function messageOf(error: unknown): string {
  if (typeof error !== "object" || error === null || !("message" in error)) return "";
  return typeof error.message === "string" ? error.message : "";
}
