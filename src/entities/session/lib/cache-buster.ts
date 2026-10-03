/**
 * persist 복원을 가를 열쇠.
 *
 * PersistQueryClientProvider 는 저장본의 buster 가 지금 값과 다르면 **복원하지 않고
 * 저장본을 버린다.** user id 를 넣으면 다른 사람의 캐시는 애초에 올라오지 않는다.
 *
 * 복원 뒤에 지우는 방식은 경쟁 상태가 있었다. 자식 effect 가 부모보다 먼저 돌아서
 * 폐기가 복원을 앞지르면, 복원이 앞사람 데이터를 다시 올리고 persister 가 그걸
 * 또 저장한다. 복원 자체를 막으면 그 창이 사라진다.
 */
export function cacheBuster(userId: string | null | undefined): string {
  return userId ?? "anonymous-visitor";
}
