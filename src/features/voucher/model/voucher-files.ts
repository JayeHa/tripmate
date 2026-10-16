import {
  fetchVoucherKeysInUse,
  fetchVoucherUrls,
  isPdf,
  removeVoucherFiles,
  uploadVoucherFile,
  type Voucher,
  type VoucherFields,
} from "@/entities/voucher";

import { renderPdfPages } from "../lib/pdf-pages";
import { makeThumbnail } from "../lib/thumbnail";
import type { PickedFile } from "./use-voucher-file";

/** 저장 직전에 정한 파일 칸 */
export type PreparedFiles = {
  /** 줄에 함께 저장할 파일 칸(바뀐 것만) */
  fields: Partial<VoucherFields>;
  /** 이번에 새로 만들어 올린 그림 — 줄 저장이 실패하면 지운다 */
  created: string[];
  /** 줄 저장이 끝나면 지울 옛 파일(다른 줄이 쓰지 않을 때만) */
  replaced: string[];
  /** PDF 를 그림으로 만들지 못했다 — 원본만 저장하고 알린다 */
  drawFailed: boolean;
};

type PrepareInput = {
  tripId: string;
  /** 고치는 바우처. 새로 넣으면 null */
  voucher: Voucher | null;
  /** 이번 창에서 고른 새 원본(다 올라간 것). 없으면 null */
  picked: PickedFile | null;
  /** 현장용 페이지(normalizePages 한 글자) */
  pages: string;
};

/**
 * 저장 직전에 파일 칸을 정한다.
 * - 새 원본: 원본 칸 넷 + 그림. PDF 는 현장용 페이지를 PNG 로(첫 장으로 썸네일), 사진은 썸네일만. 옛 원본 · 그림은 지울 것
 * - 원본은 그대로인데 PDF 의 현장용 페이지가 바뀜: 원본을 다시 받아 그린다. 옛 페이지 그림은 지울 것
 * - 그 밖: 바꾸지 않는다
 * 그리기에 실패하면 페이지 그림 없이(뷰어는 원본 열기로) 저장한다. 올리기에 실패하면 이번에 올린 그림을 지우고 던진다
 */
export async function prepareVoucherFiles(input: PrepareInput): Promise<PreparedFiles> {
  const { voucher, picked, pages } = input;
  if (picked?.key) return fromPicked(input.tripId, voucher, picked.key, picked.file, pages);
  if (voucher?.file_key && isPdf(voucher) && pages !== voucher.pages) {
    return redrawPages(input.tripId, voucher, voucher.file_key, pages);
  }
  return { fields: {}, created: [], replaced: [], drawFailed: false };
}

/** 새 원본의 파일 칸 */
async function fromPicked(
  tripId: string,
  voucher: Voucher | null,
  key: string,
  file: File,
  pages: string,
): Promise<PreparedFiles> {
  const drawn = await drawFile(file, pages);
  const uploaded = await uploadAll(tripId, drawn.pages, drawn.thumb);
  return {
    fields: {
      file_key: key,
      file_name: file.name.slice(0, 200),
      file_mime: file.type,
      file_size: file.size,
      page_keys: uploaded.pageKeys,
      thumb_key: uploaded.thumbKey,
    },
    created: uploaded.created,
    replaced: voucher ? oldKeys(voucher, true) : [],
    drawFailed: drawn.failed,
  };
}

/** 붙어 있던 PDF 를 받아 바뀐 현장용 페이지를 다시 그린다. 실패하면 페이지 그림만 비운다(썸네일은 그대로) */
async function redrawPages(
  tripId: string,
  voucher: Voucher,
  fileKey: string,
  pages: string,
): Promise<PreparedFiles> {
  const blob = await downloadOriginal(tripId, fileKey).catch(() => null);
  const drawn = blob ? await drawPdf(blob, pages) : { pages: [], failed: true };
  const thumb = drawn.pages[0] ? await makeThumbnail(drawn.pages[0]) : null;
  const uploaded = await uploadAll(tripId, drawn.pages, thumb);
  return {
    fields: {
      page_keys: uploaded.pageKeys,
      ...(uploaded.thumbKey ? { thumb_key: uploaded.thumbKey } : {}),
    },
    created: uploaded.created,
    replaced: uploaded.thumbKey ? oldKeys(voucher, false) : voucher.page_keys,
    drawFailed: drawn.failed,
  };
}

/** 고른 파일의 그림 — PDF 는 페이지 그림 + 첫 장 썸네일, 사진은 썸네일만 */
async function drawFile(file: File, pages: string) {
  if (file.type !== "application/pdf") {
    return { pages: [], thumb: await makeThumbnail(file), failed: false };
  }
  const drawn = await drawPdf(file, pages);
  const thumb = drawn.pages[0] ? await makeThumbnail(drawn.pages[0]) : null;
  return { ...drawn, thumb };
}

/** PDF 를 그린다 — 실패해도 던지지 않고 failed 로 알린다 */
async function drawPdf(file: Blob, pages: string): Promise<{ pages: Blob[]; failed: boolean }> {
  try {
    return { pages: await renderPdfPages(file, pages), failed: false };
  } catch {
    return { pages: [], failed: true };
  }
}

/** 붙어 있는 원본을 받는다 */
async function downloadOriginal(tripId: string, key: string): Promise<Blob> {
  const url = (await fetchVoucherUrls(tripId, [key]))[key];
  if (!url) throw new Error("no url");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  return res.blob();
}

/** 그림들을 올린다 — 하나라도 실패하면 이번에 올린 것을 지우고 던진다 */
async function uploadAll(tripId: string, pages: Blob[], thumb: Blob | null) {
  const created: string[] = [];
  try {
    for (const blob of [...pages, ...(thumb ? [thumb] : [])]) {
      created.push(await uploadVoucherFile(tripId, blob));
    }
  } catch (e) {
    void removeVoucherFiles(tripId, created);
    throw e;
  }
  return {
    pageKeys: created.slice(0, pages.length),
    thumbKey: thumb ? (created[pages.length] ?? null) : null,
    created,
  };
}

/** 바꿀 옛 파일 — withOriginal 이면 원본까지 */
function oldKeys(v: Voucher, withOriginal: boolean): string[] {
  return [...(withOriginal && v.file_key ? [v.file_key] : []), v.thumb_key, ...v.page_keys].filter(
    (k): k is string => !!k,
  );
}

/** 저장이 끝난 뒤 옛 파일을 지운다 — 다른 바우처가 아직 쓰는 키는 남긴다(files.md 「키 겹침」) */
export async function removeReplaced(tripId: string, voucherId: string, keys: string[]) {
  if (keys.length === 0) return;
  const inUse = await fetchVoucherKeysInUse(tripId, keys, voucherId);
  await removeVoucherFiles(
    tripId,
    keys.filter((k) => !inUse.has(k)),
  );
}
