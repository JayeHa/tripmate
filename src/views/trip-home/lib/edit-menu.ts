/** 여행 홈 「편집」 메뉴에서 여는 것 */
export type EditAction = "title" | "dates" | "invite" | "leave" | "delete";

/** 메뉴 줄 글자 */
export const EDIT_LABEL: Record<EditAction, string> = {
  title: "여행 제목 수정",
  dates: "여행 날짜 수정",
  invite: "일행 초대",
  leave: "여행 나가기",
  delete: "여행 삭제",
};

/**
 * 메뉴 줄 순서 — 맨 아래 빨간 줄은 방장이면 「여행 삭제」(방장은 나갈 수 없다), 멤버면 「여행 나가기」.
 * 내가 누구인지 아직 모르면(null) 빨간 줄을 숨긴다. 보였다가 바뀌는 쪽보다 낫다
 */
export function editMenu(isOwner: boolean | null): EditAction[] {
  const base: EditAction[] = ["title", "dates", "invite"];
  if (isOwner === null) return base;
  return [...base, isOwner ? "delete" : "leave"];
}
