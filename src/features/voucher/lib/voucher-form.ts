import {
  targetColumns,
  type Voucher,
  type VoucherFields,
  type VoucherNumber,
  voucherNumbers,
  voucherTarget,
  type VoucherTargetRef,
} from "@/entities/voucher";

/** 글자 칸의 최대 길이(DB 검사와 같다, 0059) */
export const TITLE_MAX = 100;
export const MEMO_MAX = 500;
export const SITE_TITLE_MAX = 100;
export const SITE_URL_MAX = 2000;
export const PAGES_MAX = 40;
/** 번호 줄 최대(DB 검사와 같다) */
export const NUMBERS_MAX = 10;

/** 폼의 번호 한 줄 — 지우고 넣어도 줄을 구분하는 uid 를 붙인다(저장하지 않는다) */
export type NumberDraft = VoucherNumber & { uid: string };

/** 추가 · 수정 창의 값 — 입력 칸이 다루는 그대로. 파일 칸은 따로(useVoucherFile) */
export type VoucherFormValues = {
  title: string;
  /** PDF 현장용 페이지 글자(「1, 3」) */
  pages: string;
  /** 주인 멤버 id, 비면 「모두」 */
  owners: string[];
  target: VoucherTargetRef | null;
  /** 연결이 없을 때만 쓰는 사용일 「YYYY-MM-DD」, 없으면 "" */
  useDate: string;
  numbers: NumberDraft[];
  siteTitle: string;
  siteUrl: string;
  memo: string;
};

/** 파일 칸을 뺀 저장 칸 — 폼 값으로 정해지는 것 */
export type VoucherTextFields = Omit<
  VoucherFields,
  "file_key" | "file_name" | "file_mime" | "file_size" | "page_keys" | "thumb_key"
>;

/** 새 바우처 — 빈 칸, 현장용 페이지 「1」 */
export function blankVoucherForm(): VoucherFormValues {
  return {
    title: "",
    pages: "1",
    owners: [],
    target: null,
    useDate: "",
    numbers: [],
    siteTitle: "",
    siteUrl: "",
    memo: "",
  };
}

/** 저장된 바우처를 폼 값으로 */
export function voucherFormFrom(v: Voucher): VoucherFormValues {
  return {
    title: v.title,
    pages: v.pages,
    owners: v.owners,
    target: voucherTarget(v),
    useDate: v.use_date ?? "",
    numbers: voucherNumbers(v).map((n) => ({ ...n, uid: crypto.randomUUID() })),
    siteTitle: v.site_title,
    siteUrl: v.site_url,
    memo: v.memo,
  };
}

/** 현장용 페이지 글자를 한 모양으로 — 「1,3 」 → 「1, 3」, 비면 「1」. 같은 뜻이면 같은 글자라 바뀜을 비교할 수 있다 */
export function normalizePages(text: string): string {
  const parts = text
    .split(",")
    .map((p) => p.replace(/\s/g, ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "1";
}

/** 현장용 페이지 칸에 칠 수 있는 글자만 남긴다(숫자 · 쉼표 · 띄어쓰기) */
export function pagesInput(text: string): string {
  return text.replace(/[^\d, ]/g, "").slice(0, PAGES_MAX);
}

/** 새 번호 줄 — 첫 줄은 「예약번호」, 그다음은 「바우처 번호」 */
export function newNumber(count: number): NumberDraft {
  return {
    uid: crypto.randomUUID(),
    label: count === 0 ? "예약번호" : "바우처 번호",
    owner: "",
    value: "",
  };
}

export type VoucherFieldsResult =
  { ok: true; fields: VoucherTextFields } | { ok: false; error: string };

/**
 * 폼 값 → 저장 칸. 앞뒤 공백을 버리고, 값이 빈 번호 줄은 뺀다. 사용일은 연결이 없을 때만 남긴다(DB 검사).
 * 제목이 비었거나 예약 사이트 주소가 http(s) 가 아니면 문구를 돌려준다
 */
export function toVoucherFields(v: VoucherFormValues): VoucherFieldsResult {
  const title = v.title.trim().slice(0, TITLE_MAX);
  if (!title) return { ok: false, error: "제목을 입력해 주세요" };
  const siteUrl = v.siteUrl.trim().slice(0, SITE_URL_MAX);
  if (siteUrl && !/^https?:\/\//i.test(siteUrl)) {
    return { ok: false, error: "예약 사이트 주소는 http:// 나 https:// 로 시작해야 해요" };
  }
  return {
    ok: true,
    fields: {
      title,
      pages: normalizePages(v.pages),
      owners: v.owners,
      numbers: v.numbers
        .map((n) => ({ label: n.label, owner: n.owner, value: n.value.trim() }))
        .filter((n) => n.value)
        .slice(0, NUMBERS_MAX),
      ...targetColumns(v.target),
      use_date: v.target ? null : v.useDate || null,
      site_title: v.siteTitle.trim().slice(0, SITE_TITLE_MAX),
      site_url: siteUrl,
      memo: v.memo.trim().slice(0, MEMO_MAX),
    },
  };
}

/**
 * 연 때(before)와 **달라진 칸만** — 창을 연 사이 일행이 고친 다른 칸을 연 때 값으로 덮지 않게.
 * 바뀐 칸이 없으면 빈 객체
 */
export function changedFields<T extends Record<string, unknown>>(now: T, before: T): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(now) as (keyof T)[]) {
    if (JSON.stringify(now[key]) !== JSON.stringify(before[key])) patch[key] = now[key];
  }
  return patch;
}

/** 「추가 정보」 칸에 값이 있는가 — 수정 창을 열 때 펼쳐 둘지 */
export function hasMoreValues(v: VoucherFormValues): boolean {
  return (
    !!v.useDate ||
    v.numbers.length > 0 ||
    !!v.siteTitle.trim() ||
    !!v.siteUrl.trim() ||
    !!v.memo.trim()
  );
}
