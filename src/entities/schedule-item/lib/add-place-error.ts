/**
 * 일정 담기(add_schedule_place) 실패를 사용자 문구로. 다시 해도 안 되는 실패는 해결 방법을,
 * 그 밖(네트워크 · 서버)은 다시 시도를 안내한다. 판정은 DB 함수 · RLS 가 내는 메시지로 한다(0015).
 */
export function addPlaceErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("has no city")) {
    return "여행에 도시가 없어 이름만으로는 담을 수 없어요. 검색 결과에서 장소를 골라 주세요.";
  }
  if (message.includes("name is required")) return "장소 이름을 입력해 주세요.";
  if (message.includes("row-level security")) return "이 여행에 일정을 담을 권한이 없어요.";
  return "일정에 담지 못했어요. 잠시 후 다시 시도해 주세요.";
}
