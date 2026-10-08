import { eulReul } from "@/shared/lib/josa";

/** 「추가 정보 입력」 안에서 위로 고정할 수 있는 칸 — 이 순서로 그린다. 필수 칸(금액 · 항목명 · 카테고리)은 대상이 아니다 */
export const PIN_FIELDS = ["paid", "memo", "receipts", "excluded"] as const;
export type PinField = (typeof PIN_FIELDS)[number];

export const PIN_LABEL: Record<PinField, string> = {
  paid: "결제 상태",
  memo: "메모",
  receipts: "영수증",
  excluded: "합계 제외",
};

/** 저장된 값에서 아는 칸만 순서대로. 모양이 다르면 빈 목록 */
export function parsePins(raw: unknown): PinField[] {
  if (!Array.isArray(raw)) return [];
  return PIN_FIELDS.filter((f) => raw.includes(f));
}

/** 접힌 「추가 정보 입력」 의 회색 안내 — 고정하지 않은 칸만 「결제 상태 · 메모 · …」 */
export function pinHint(pinned: PinField[]): string {
  return PIN_FIELDS.filter((f) => !pinned.includes(f))
    .map((f) => PIN_LABEL[f])
    .join(" · ");
}

/** 고정 · 풀기 토스트 — 「영수증을 위에 고정했어요」 · 「영수증 고정을 풀었어요」 */
export function pinToast(field: PinField, pinned: boolean): string {
  const label = PIN_LABEL[field];
  return pinned ? `${label}${eulReul(label)} 위에 고정했어요` : `${label} 고정을 풀었어요`;
}
