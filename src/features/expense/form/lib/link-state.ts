/** 일정 연결 칸의 모양 — 연결됨 · 「연결 안 함」 을 골랐음 · 아직 안 고름 */
export type LinkStatus = "linked" | "none" | "prompt";

export type LinkState = {
  /** 저장할 연결 id. 연결이 없거나 그 일정이 사라졌으면 빈 글 */
  itemId: string;
  status: LinkStatus;
  /** 연결했던 일정이 지금 목록에 없다(폼을 연 사이 일행이 지움) */
  gone: boolean;
};

/**
 * 폼이 들고 있는 연결 id 와 그 일정을 찾았는지로 칸의 상태를 정한다.
 * 사라진 일정의 id 는 저장하지 않는다 — 보내면 FK 오류로 저장이 실패한다. 칸은 「아직 안 고름」 으로 돌아간다
 */
export function linkState(itemId: string, found: boolean, noneChosen: boolean): LinkState {
  const gone = itemId !== "" && !found;
  const id = gone ? "" : itemId;
  if (id) return { itemId: id, status: "linked", gone };
  return { itemId: "", status: noneChosen ? "none" : "prompt", gone };
}
