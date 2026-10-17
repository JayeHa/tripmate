"use client";

import { useState } from "react";

import {
  isVoucherMime,
  removeVoucherFiles,
  targetColumns,
  titleFromFileName,
  uploadVoucherFile,
  useSaveVoucher,
  VOUCHER_MAX_BYTES,
  type VoucherTargetRef,
} from "@/entities/voucher";

import { prepareVoucherFiles } from "./voucher-files";

/**
 * 「+ 바우처」 바로 만들기 — 폼 없이 고른 파일로 바우처 하나를 만든다(제목 = 파일 이름에서 확장자를 뗀 것, 주인 모두,
 * PDF 현장용 페이지 「1」, 연결 = target). 원본을 올리고 그림(PDF 첫 쪽 · 썸네일)을 만든 뒤 줄을 저장한다.
 * 줄 저장까지 실패하면 이번에 올린 파일을 지운다. 번호 · 메모는 나중에 수정에서
 */
export function useQuickAddVoucher(tripId: string, onToast: (text: string) => void) {
  const [busy, setBusy] = useState(false);
  const save = useSaveVoucher(tripId);

  /** 만든다 — 받지 않는 종류 · 20MB 넘는 파일은 올리지 않고 알린다 */
  async function add(file: File, target: VoucherTargetRef) {
    if (!isVoucherMime(file.type)) {
      onToast("사진과 PDF 만 올릴 수 있어요.");
      return;
    }
    if (file.size > VOUCHER_MAX_BYTES) {
      onToast(`${file.name} 은(는) 20MB 를 넘어요.`);
      return;
    }
    setBusy(true);
    const created: string[] = [];
    try {
      const key = await uploadVoucherFile(tripId, file);
      created.push(key);
      const prepared = await prepareVoucherFiles({
        tripId,
        voucher: null,
        picked: { file, key, preview: null },
        pages: "1",
      });
      created.push(...prepared.created);
      await save.mutateAsync({
        id: null,
        fields: {
          title: titleFromFileName(file.name) || "바우처",
          pages: "1",
          owners: [],
          numbers: [],
          ...targetColumns(target),
          use_date: null,
          site_title: "",
          site_url: "",
          memo: "",
          file_key: null,
          file_name: null,
          file_mime: null,
          file_size: null,
          page_keys: [],
          thumb_key: null,
          ...prepared.fields,
        },
      });
      onToast(
        prepared.drawFailed ? "PDF 를 그림으로 만들지 못해 원본으로 보여요" : "바우처를 추가했어요",
      );
    } catch {
      void removeVoucherFiles(tripId, created);
      onToast("바우처를 올리지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    /** 파일을 골랐다 — 만드는 중이면 무시한다 */
    add: (file: File, target: VoucherTargetRef) => {
      if (!busy) void add(file, target);
    },
  };
}
