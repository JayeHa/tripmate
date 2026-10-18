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

/** 일정 카드 — 바우처를 찾을 때 쓰는 칸만 */
type VoucherCard = { id: string; stay_id: string | null; flight_id?: string | null };

/**
 * 일정 카드의 바우처 — 그 카드에 붙은 것, 숙소 카드면 그 숙소 · 항공편 카드면 그 항공편에 붙은 것까지.
 * 받은 순서(넣은 순서) 그대로
 */
export function cardVouchers<V extends Pick<Voucher, "schedule_item_id" | "stay_id" | "flight_id">>(
  list: V[],
  card: VoucherCard,
): V[] {
  return list.filter(
    (v) =>
      v.schedule_item_id === card.id ||
      (!!card.stay_id && v.stay_id === card.stay_id) ||
      (!!card.flight_id && v.flight_id === card.flight_id),
  );
}

/** 카드에서 바로 올린 바우처의 연결 — 숙소 카드는 그 숙소(숙소 화면에서도 보이게), 그 밖은 그 일정 */
export function cardVoucherTarget(card: VoucherCard): VoucherTargetRef {
  return card.stay_id ? { kind: "stay", id: card.stay_id } : { kind: "schedule_item", id: card.id };
}

/** 이 일정들(카드 · 그 대체 장소)에 직접 붙은 바우처 수 — 일정을 지우면 연결만 풀린다(set null) */
export function linkedVoucherCount(
  list: Pick<Voucher, "schedule_item_id">[],
  itemIds: string[],
): number {
  return list.filter((v) => v.schedule_item_id !== null && itemIds.includes(v.schedule_item_id))
    .length;
}

/** 지우기 확인에 덧붙일 글 — 연결된 바우처가 있으면 연결만 풀리고 노트에 남는다고 알린다 */
export function voucherUnlinkNote(count: number): string | null {
  return count > 0 ? `연결된 바우처 ${count}개는 연결만 풀리고 노트에 남아요.` : null;
}

/** 이 대상들 중 하나에 연결된 바우처 수 — 대상을 지울 때 「연결만 풀린다」 고 알린다(바우처 하나는 대상 하나라 겹치지 않는다) */
export function voucherCountFor(
  list: Pick<Voucher, "schedule_item_id" | "flight_id" | "stay_id">[],
  refs: VoucherTargetRef[],
): number {
  return list.filter((v) => {
    const ref = voucherTarget(v);
    return !!ref && refs.some((r) => r.kind === ref.kind && r.id === ref.id);
  }).length;
}
