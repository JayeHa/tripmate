import type { Tables } from "@/shared/api/supabase/database.types";

/** 바우처 한 줄 */
export type Voucher = Tables<"vouchers">;

/** 번호 종류 — 폼의 「종류」 고르기 순서 */
export const VOUCHER_NUMBER_LABELS = [
  "예약번호",
  "바우처 번호",
  "항공권 번호",
  "확인 번호",
] as const;

/** 번호 한 줄 — 종류 · 주인(멤버 id, 빈 글자 = 모두) · 값 */
export type VoucherNumber = { label: string; owner: string; value: string };

/** 연결 대상의 종류 — 일정 카드 · 항공편 · 숙소(체크리스트 연결과 같은 모양) */
export type VoucherTargetKind = "schedule_item" | "flight" | "stay";

/** 연결 대상 하나 */
export type VoucherTargetRef = { kind: VoucherTargetKind; id: string };

/** 목록 묶음 — 항공편 · 숙소 · 일정 · 기타(연결 없음). 이 순서로 보인다 */
export const VOUCHER_GROUPS = ["flight", "stay", "schedule", "etc"] as const;
export type VoucherGroup = (typeof VOUCHER_GROUPS)[number];

/** 묶음 이름 */
export const VOUCHER_GROUP_LABEL: Record<VoucherGroup, string> = {
  flight: "항공편",
  stay: "숙소",
  schedule: "일정",
  etc: "기타",
};

/** 폼이 저장하는 칸 — 여행 · 고정 · 만든 사람 · 시각은 빼고 */
export type VoucherFields = Pick<
  Voucher,
  | "title"
  | "file_key"
  | "file_name"
  | "file_mime"
  | "file_size"
  | "pages"
  | "page_keys"
  | "thumb_key"
  | "owners"
  | "numbers"
  | "schedule_item_id"
  | "flight_id"
  | "stay_id"
  | "use_date"
  | "site_title"
  | "site_url"
  | "memo"
>;

/** 저장 — id 가 null 이면 새로 넣고(모든 칸), 아니면 그 칸들만 고친다 */
export type VoucherSave =
  { id: null; fields: VoucherFields } | { id: string; fields: Partial<VoucherFields> };
