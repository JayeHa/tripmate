import { isPdf, type Voucher } from "@/entities/voucher";

import { dayText } from "./voucher-day";

/** 파일 정보 줄 — 「PDF · 현장용 1, 3페이지」 · 「이미지」, 원본이 없으면 null */
export function fileInfo(v: Pick<Voucher, "file_key" | "file_mime" | "pages">): string | null {
  if (!v.file_key) return null;
  if (isPdf(v)) return v.pages ? `PDF · 현장용 ${v.pages}페이지` : "PDF";
  return "이미지";
}

/**
 * 사용일 줄 — 바우처의 날짜(연결 대상의 날 · 연결이 없으면 사용일)가 여행 안이면 「day 2 · 10.21」.
 * 사용일이 여행 기간 밖이면 그 날짜(「2026.10.21」), 날짜가 없으면 null(「없음」)
 */
export function voucherDateText(
  v: Pick<Voucher, "use_date">,
  day: number | null,
  startDate: string,
): string | null {
  if (day !== null) return dayText(startDate, day);
  return v.use_date ? v.use_date.replaceAll("-", ".") : null;
}
