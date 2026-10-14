import type {
  Voucher,
  VoucherGroup,
  VoucherNumber,
  VoucherTargetKind,
  VoucherTargetRef,
} from "../model/types";
import { VOUCHER_MAX_PAGES } from "./voucher-rules";

/** 대상 종류마다 그 id 를 담는 칸 */
const COLUMN = {
  schedule_item: "schedule_item_id",
  flight: "flight_id",
  stay: "stay_id",
} as const satisfies Record<VoucherTargetKind, keyof Voucher>;

/** 바우처의 연결 대상. 없으면(기타) null */
export function voucherTarget(
  v: Pick<Voucher, "schedule_item_id" | "flight_id" | "stay_id">,
): VoucherTargetRef | null {
  for (const kind of Object.keys(COLUMN) as VoucherTargetKind[]) {
    const id = v[COLUMN[kind]];
    if (id) return { kind, id };
  }
  return null;
}

/** 저장할 연결 칸 — 세 칸을 모두 채워 보낸다(바꾼 대상 말고는 null) */
export function targetColumns(
  ref: VoucherTargetRef | null,
): Pick<Voucher, "schedule_item_id" | "flight_id" | "stay_id"> {
  return {
    schedule_item_id: ref?.kind === "schedule_item" ? ref.id : null,
    flight_id: ref?.kind === "flight" ? ref.id : null,
    stay_id: ref?.kind === "stay" ? ref.id : null,
  };
}

/** 목록 묶음 — 연결 대상으로 정한다 */
export function voucherGroup(v: Pick<Voucher, "schedule_item_id" | "flight_id" | "stay_id">) {
  const GROUP: Record<VoucherTargetKind, VoucherGroup> = {
    flight: "flight",
    stay: "stay",
    schedule_item: "schedule",
  };
  const ref = voucherTarget(v);
  return ref ? GROUP[ref.kind] : "etc";
}

/** 저장된 번호(jsonb) → 번호 줄. 모양이 다른 줄 · 값이 빈 줄은 뺀다 */
export function voucherNumbers(v: Pick<Voucher, "numbers">): VoucherNumber[] {
  if (!Array.isArray(v.numbers)) return [];
  return v.numbers.flatMap((n) => {
    if (typeof n !== "object" || n === null || Array.isArray(n)) return [];
    const { label, owner, value } = n as Record<string, unknown>;
    if (typeof value !== "string" || !value.trim()) return [];
    return [
      {
        label: typeof label === "string" && label ? label : "예약번호",
        owner: typeof owner === "string" ? owner : "",
        value,
      },
    ];
  });
}

/** 이 사람의 바우처인가 — 주인이 비면(모두) 누구의 것이기도 하다 */
export function ownedBy(v: Pick<Voucher, "owners">, userId: string): boolean {
  return v.owners.length === 0 || v.owners.includes(userId);
}

/** PDF 인가 */
export function isPdf(v: Pick<Voucher, "file_mime">): boolean {
  return v.file_mime === "application/pdf";
}

/**
 * 현장용 페이지 글자(「1, 3」) → 페이지 번호. 적은 순서대로, 겹치면 한 번, 1 보다 작거나 문서 쪽수를 넘는 것은 뺀다,
 * 최대 VOUCHER_MAX_PAGES 장. 남는 게 없으면 [1]
 */
export function parsePages(text: string, pageCount: number): number[] {
  const out: number[] = [];
  for (const part of text.split(",")) {
    const n = Number(part.trim());
    if (Number.isInteger(n) && n >= 1 && n <= pageCount && !out.includes(n)) out.push(n);
  }
  return out.length > 0 ? out.slice(0, VOUCHER_MAX_PAGES) : [1];
}

/** 바우처가 가진 파일 키 전부(원본 · 그림 · 썸네일) — 지울 때 저장소에서 함께 지운다 */
export function voucherFileKeys(
  v: Pick<Voucher, "file_key" | "page_keys" | "thumb_key">,
): string[] {
  return [v.file_key, v.thumb_key, ...v.page_keys].filter((k): k is string => !!k);
}
