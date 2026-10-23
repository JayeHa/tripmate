import { addDays, format, max, min, parseISO } from "date-fns";

import { type PackItem, photoOf } from "@/entities/pack";
import { viewerKeys, type Voucher } from "@/entities/voucher";

/**
 * 받을 화면 — 여행 탭과 가계부 하위 화면. 지도(약관상 저장할 수 없어 오프라인이면 반쯤 깨진다)와
 * 수정 화면(오프라인이면 저장이 막힌다)은 뺀다. 비용 상세는 비용마다 따로 받는다
 */
const TRIP_PAGES = [
  "home",
  "schedule",
  "notes",
  "expenses",
  "expenses/new",
  "expenses/stats",
  "expenses/settlement",
  "expenses/categories",
  "settings",
] as const;

/** 받은 여행을 최소로 두는 날 수 · 길게 두는 끝 — 받은 날부터 */
const KEEP_MIN_DAYS = 7;
export const KEEP_MAX_DAYS = 60;

/** 받을 사진 하나 — 사용자에게 보이는 그림 한 장(바우처 쪽 · 사진, 쇼핑 사진). 썸네일은 같은 묶음에 붙인다 */
export type PhotoTarget = {
  bucket: "vouchers" | "pack-photos";
  keys: string[];
  /** 받지 못했을 때 보일 이름 — 「쇼핑 · 돈키호테 영수증」 */
  label: string;
};

/** 받지 못한 것 — 데이터(한 묶음) · 화면 하나 · 사진 하나. 「다시 받기」 는 이것만 다시 받는다 */
export type FailedItem =
  { kind: "data" } | { kind: "page"; path: string } | ({ kind: "photo" } & PhotoTarget);

/**
 * 여행 하나를 받은 기록(기기별). done · total 은 처리한 수 / 전체 수.
 * missing 은 받지 못한 수 — 받는 도중 앱을 닫으면 시도하지 못한 것까지 센다(그때 failed 는 일부만 안다)
 */
export type SavedTrip = {
  status: "busy" | "done" | "partial";
  done: number;
  total: number;
  failed: FailedItem[];
  missing: number;
  /** 마지막으로 다 받은 때(ISO) — 처음 받는 중이면 null */
  savedAt: string | null;
  /** 이 날(yyyy-MM-dd)까지 보관한다 */
  keepUntil: string | null;
};

/** 여행의 받을 화면 주소 — 탭 화면들 + 비용 상세 */
export function tripPagePaths(tripId: string, expenseIds: readonly string[]): string[] {
  return [...TRIP_PAGES, ...expenseIds.map((id) => `expenses/${id}`)].map(
    (p) => `/trips/${tripId}/${p}`,
  );
}

/** 바우처 하나의 사진 — 넘겨 볼 그림마다 하나, 썸네일은 첫 장에 붙인다. 그림이 없으면 썸네일만 */
function voucherTargets(v: Voucher): PhotoTarget[] {
  const label = `바우처 · ${v.title}`;
  const pics = viewerKeys(v);
  const thumb = v.thumb_key && !pics.includes(v.thumb_key) ? [v.thumb_key] : [];
  if (pics.length === 0) return thumb.length ? [{ bucket: "vouchers", keys: thumb, label }] : [];
  return pics.map((key, i) => ({
    bucket: "vouchers",
    keys: i === 0 ? [key, ...thumb] : [key],
    label,
  }));
}

/** 받을 사진 — 바우처 그림(PDF 원본은 빼고) · 썸네일, 쇼핑 사진 · 썸네일 */
export function photoTargets(
  vouchers: readonly Voucher[],
  items: readonly Pick<PackItem, "name" | "photo_key" | "thumb_key">[],
): PhotoTarget[] {
  const shopping = items.flatMap((item): PhotoTarget[] => {
    const photo = photoOf(item);
    if (!photo) return [];
    const keys = [photo.photo_key, photo.thumb_key];
    return [{ bucket: "pack-photos", keys, label: `쇼핑 · ${item.name}` }];
  });
  return [...vouchers.flatMap(voucherTargets), ...shopping];
}

/**
 * 보관 기한 — 받은 날부터 7일과 여행 끝 다음 날 중 늦은 날, 길어도 받은 날부터 60일(기기의 데이터 캐시가 그만큼 남는다).
 * 일찍 받아도 떠나기 전에 지워지지 않게(2026-10-23 사용자 결정)
 */
export function keepUntilDate(savedDate: string, endDate: string): string {
  const saved = parseISO(savedDate);
  const late = max([addDays(saved, KEEP_MIN_DAYS), addDays(parseISO(endDate), 1)]);
  return format(min([late, addDays(saved, KEEP_MAX_DAYS)]), "yyyy-MM-dd");
}

/** 보관 기한이 지났는가 — 받는 중이면 아니다 */
export function isExpired(saved: SavedTrip, today: string): boolean {
  return saved.status !== "busy" && saved.keepUntil !== null && today > saved.keepUntil;
}

/**
 * 받은 데이터가 기기 캐시에서 사라졌다 — 데이터 모양이 바뀐 배포는 캐시를 통째로 버린다(`QUERY_CACHE_BUSTER`).
 * 일부 실패로 바꿔 「다시 받기」 로 이끈다. 데이터를 이미 못 받은 기록이면 그대로
 */
export function withDataMissing(saved: SavedTrip): SavedTrip {
  if (saved.failed.some((f) => f.kind === "data")) return { ...saved, status: "partial" };
  return {
    ...saved,
    status: "partial",
    failed: [{ kind: "data" }, ...saved.failed],
    missing: saved.missing + 1,
  };
}

/** 메뉴 줄 오른쪽 힌트 — muted 면 흐리게 그리고 누르면 토스트만 */
export type MenuHint = { text: string | null; muted: boolean };

/** 메뉴 힌트 — 오프라인 「연결되면」 · 받는 중 · 「10.23 받음」 · 받은 적 없음(없음) */
export function menuHint(saved: SavedTrip | undefined, online: boolean, today: string): MenuHint {
  if (!online) return { text: "연결되면", muted: true };
  if (!saved || isExpired(saved, today)) return { text: null, muted: false };
  if (saved.status === "busy") return { text: "받는 중", muted: false };
  return {
    text: saved.savedAt ? `${format(parseISO(saved.savedAt), "MM.dd")} 받음` : null,
    muted: false,
  };
}

/** 받기 창의 단계 */
export type DownloadStep = "confirm" | "busy" | "done" | "partial" | "again";

/** 받기 창 단계 — 처음 · 받는 중 · 이 창에서 다 받음 · 일부 실패 · 전에 받음(다시 받을지) */
export function downloadStep(
  saved: SavedTrip | undefined,
  startedHere: boolean,
  today: string,
): DownloadStep {
  if (!saved || isExpired(saved, today)) return "confirm";
  if (saved.status === "busy") return "busy";
  if (saved.status === "partial") return "partial";
  return startedHere ? "done" : "again";
}

/** 「다시 받기」 의 범위 — 받지 못한 것을 다 알면 그것만, 도중에 끊겨 모르면 전부 */
export function retryScope(saved: SavedTrip): "failed" | "all" {
  return saved.missing > saved.failed.length ? "all" : "failed";
}

/** 일부 실패의 제목 — 사진만 못 받았으면 「사진 N장」, 아니면 「N개」 */
export function partialTitle(saved: SavedTrip): string {
  const photos = saved.failed.filter((f) => f.kind === "photo").length;
  if (photos > 0 && photos === saved.missing) return `사진 ${photos}장을 받지 못했어요`;
  return `${saved.missing}개를 받지 못했어요`;
}

/** 못 받은 사진 줄 — 「쇼핑 · 돈키호테 영수증 외 1장」. 사진이 없으면 null */
export function failedPhotoLine(failed: readonly FailedItem[]): string | null {
  const photos = failed.filter((f) => f.kind === "photo");
  if (photos.length === 0) return null;
  return photos.length === 1 ? photos[0].label : `${photos[0].label} 외 ${photos.length - 1}장`;
}
