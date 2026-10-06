import { formatMoney } from "@/shared/lib/money";

type SplitPreviewInput = {
  /** 나눌 금액 — 기준 화폐로 바꿀 수 있으면 기준 화폐, 환율이 없으면 결제 통화 그대로 */
  amount: number;
  currency: string;
  splitEach: boolean;
  /** 결제한 사람 키. 「각자 냄」 이면 null */
  payer: string | null;
  /** 함께한 사람 키 */
  participants: string[];
  nameOf: (key: string) => string;
};

/**
 * 「누가 내고, 누구와 나눴나요?」 아래 미리보기 두 줄. 금액이 없거나 혼자 쓴 돈(「각자 냄」 이 아닌 1명)이면 null.
 * 첫 줄은 1인 몫, 둘째 줄은 누가 누구에게 보낼지 — 결제한 사람만 함께했으면 빈 글
 */
export function splitPreview({
  amount,
  currency,
  splitEach,
  payer,
  participants,
  nameOf,
}: SplitPreviewInput): { head: string; sub: string } | null {
  const count = participants.length;
  if (amount <= 0 || count === 0 || (count === 1 && !splitEach)) return null;
  const share = formatMoney(amount / count, currency);
  if (splitEach)
    return {
      head: `각자 냈어요 · 1인 ≈ ${share}`,
      sub: "정산할 금액은 없어요. 개인별 지출에만 더해져요.",
    };
  const debtors = participants.filter((key) => key !== payer);
  const sub =
    payer && debtors.length > 0
      ? `${debtors.map(nameOf).join(" · ")} → ${nameOf(payer)} ${debtors.length > 1 ? "각 " : ""}${share}`
      : "";
  return { head: `${count}명이 나눠요 · 1인 ≈ ${share}`, sub };
}
