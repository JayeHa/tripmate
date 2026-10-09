/**
 * 글자 수에 맞는 글자 크기 클래스 — 큰 금액이 칸을 넘지 않게 길수록 작게.
 * `steps` 는 [이 글자 수까지, 클래스] 를 짧은 것부터. 마지막 단계보다 길면 `longest`
 * @example sizeByLength("₩1,000", [[12, "text-[26px]"], [15, "text-[22px]"]], "text-lg") // "text-[26px]"
 */
export function sizeByLength(
  text: string,
  steps: readonly (readonly [number, string])[],
  longest: string,
): string {
  return steps.find(([max]) => text.length <= max)?.[1] ?? longest;
}
