/** 끌기 손잡이에 붙는 읽기 프로그램용 설명 */
export const DRAG_INSTRUCTIONS =
  "스페이스 바로 들고, 위아래 화살표로 옮긴 뒤 스페이스 바로 놓아요. Esc 를 누르면 취소해요.";

/** 손잡이 역할 이름(기본값 「draggable」 대신) */
export const DRAG_ROLE = "끌기 손잡이";

/** 들었을 때. position 은 1부터 */
export function pickedUpText(name: string, position: number): string {
  return `「${name}」 들었어요. 지금 ${position}번째예요.`;
}

/** 옮기는 중 자리가 바뀌었을 때 */
export function movedText(name: string, position: number): string {
  return `「${name}」 ${position}번째 자리예요.`;
}

/** 놓았거나(canceled=false) 취소했을 때 */
export function droppedText(name: string, position: number, canceled: boolean): string {
  if (canceled) return `옮기기를 취소했어요. 「${name}」 제자리로 돌아왔어요.`;
  return `「${name}」 ${position}번째에 놓았어요.`;
}
