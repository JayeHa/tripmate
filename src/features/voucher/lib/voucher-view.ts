import { isPdf, type Voucher, type VoucherNumber, voucherNumbers } from "@/entities/voucher";

/** 파일 이름에 쓸 수 없는 글자(Windows · macOS 공통) */
const UNSAFE_NAME = /[\\/:*?"<>|\u0000-\u001f]/g;

/** 종류마다 확장자 — 원본 이름에 확장자가 없을 때 */
const MIME_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
};

/**
 * 받을 파일 이름 — 바우처 제목 + 원본 확장자(원본 이름에서, 없으면 종류에서). 쓸 수 없는 글자는 「_」 로 바꾼다.
 * 원본이 없으면 null
 */
export function downloadName(v: Pick<Voucher, "title" | "file_name" | "file_mime">): string | null {
  if (!v.file_name) return null;
  const fromName = /\.([a-z0-9]{1,5})$/i.exec(v.file_name)?.[1];
  const ext = fromName ?? MIME_EXT[v.file_mime ?? ""];
  const base = v.title.replace(UNSAFE_NAME, "_").trim() || "바우처";
  return ext ? `${base}.${ext.toLowerCase()}` : base;
}

/** 번호 줄의 주인 순서 — 내 것 → 모두 → 일행 것 */
function ownerRank(n: VoucherNumber, me: string | null): number {
  if (me && n.owner === me) return 0;
  return n.owner ? 2 : 1;
}

/** 번호 줄을 보이는 순서로 — 내 것 → 모두(주인 없음) → 일행 것, 같은 순위 안에서는 적은 순서 */
export function sortNumbers(numbers: VoucherNumber[], me: string | null): VoucherNumber[] {
  return numbers
    .map((n, i) => ({ n, i }))
    .sort((a, b) => ownerRank(a.n, me) - ownerRank(b.n, me) || a.i - b.i)
    .map(({ n }) => n);
}

/** 번호 줄의 라벨 — 「예약번호 · 정원 (나)」 · 「예약번호 · 동규」 · 「예약번호 · 모두」. 이름을 못 찾으면(나간 멤버) 「알 수 없음」 */
export function numberLabel(
  n: VoucherNumber,
  me: string | null,
  nameOf: (id: string) => string | null,
): string {
  if (!n.owner) return `${n.label} · 모두`;
  const name = nameOf(n.owner) ?? "알 수 없음";
  return `${n.label} · ${name}${n.owner === me ? " (나)" : ""}`;
}

/** 뷰어 머리의 보조 줄 — 「정원, 동규 · 10.20 · 치이카와 파크 · 1 / 3」. 연결이 없으면 「기타」, 한 장이면 쪽 표시 없음 */
export function viewerSubText(
  owners: string,
  target: string | null,
  page: number,
  total: number,
): string {
  return [owners, target ?? "기타", total > 1 ? `${page + 1} / ${total}` : null]
    .filter(Boolean)
    .join(" · ");
}

/** 일정 상세 바우처 줄의 보조 글 — 「PDF · 예약번호 K7QX2M」 · 「이미지」, 원본 · 번호가 없으면 빈 글 */
export function linkedSubText(v: Pick<Voucher, "file_key" | "file_mime" | "numbers">): string {
  const first = voucherNumbers(v)[0];
  return [fileKind(v), first ? `${first.label} ${first.value}` : null].filter(Boolean).join(" · ");
}

/** 원본 종류 글 — 「PDF」 · 「이미지」, 원본이 없으면 null */
function fileKind(v: Pick<Voucher, "file_key" | "file_mime">): string | null {
  if (!v.file_key) return null;
  return isPdf(v) ? "PDF" : "이미지";
}

/** 뷰어의 번호 한 줄 — 보이는 순서로 정렬해 라벨을 붙인 것 */
export type ViewerNumber = {
  key: string;
  /** 「예약번호 · 정원 (나)」 */
  text: string;
  value: string;
  /** 주인 멤버 id, 비면 모두 */
  owner: string;
  mine: boolean;
};

/** 뷰어가 그릴 바우처 — 주인 · 연결 · 날짜 글은 화면(view)이 만들어 넘긴다 */
export type ViewerContent = {
  voucher: Voucher;
  /** 「정원, 동규」 · 「모두」 */
  owners: string;
  /** 연결 이름, 없으면 null(「기타」) */
  target: string | null;
  /** 사용일 글, 없으면 null */
  date: string | null;
  numbers: ViewerNumber[];
};
