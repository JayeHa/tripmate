import { eulReul } from "@/shared/lib/josa";

type Required = { amount: number; name: string; category: string | null };

/** 완료 버튼 위 안내 — 비어 있는 필수 칸(금액 · 항목명 · 카테고리)을 「금액 · 카테고리를 입력해 주세요」 로. 다 찼으면 빈 글 */
export function missingText({ amount, name, category }: Required): string {
  const missing = [
    amount > 0 ? null : "금액",
    name.trim() ? null : "항목명",
    category ? null : "카테고리",
  ].filter((label) => label !== null);
  if (missing.length === 0) return "";
  return `${missing.join(" · ")}${eulReul(missing[missing.length - 1])} 입력해 주세요`;
}
