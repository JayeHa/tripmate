"use client";

import { useState } from "react";

import { fetchVoucherUrls, type Voucher } from "@/entities/voucher";
import { saveErrorText } from "@/shared/api/sync";

import { downloadName } from "../lib/voucher-view";

/** 원본을 받아 파일로 — 서명 주소에서 내려받는다(주소를 그대로 열면 키 이름으로 저장된다) */
async function fetchOriginal(tripId: string, v: Voucher, name: string): Promise<File> {
  const key = v.file_key ?? "";
  const url = (await fetchVoucherUrls(tripId, [key]))[key];
  if (!url) throw new Error("no url");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const blob = await res.blob();
  return new File([blob], name, { type: v.file_mime ?? blob.type });
}

/** 공유 시트로 넘길 수 있는가 — 손가락으로 쓰는 기기(모바일)만. PC 는 공유 창 대신 바로 내려받는다 */
function canShareFile(file: File): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

/** 링크를 눌러 내려받기 */
function saveByLink(file: File) {
  const href = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = href;
  a.download = file.name;
  a.click();
  // 내려받기가 시작된 뒤에 주소를 푼다
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

/** 모바일은 공유 시트(사진 앱 · 파일에 저장), 안 되면 내려받기. 공유 시트를 닫았으면 false */
async function saveFile(file: File): Promise<boolean> {
  if (canShareFile(file)) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return false;
      // 받는 사이 사용자 동작으로 인정되는 시간이 지났다(iOS NotAllowedError) 등 — 내려받기로
    }
  }
  saveByLink(file);
  return true;
}

/**
 * 바우처 원본 저장 — 파일 이름은 「바우처 제목 + 원본 확장자」. 일행이 올린 바우처도 누구나 받는다.
 * 끝나면 「{파일명} 저장했어요」, 받지 못하면 다시 시도 안내를 토스트로 요청한다. 받는 동안 다시 누르면 무시한다
 */
export function useVoucherDownload(tripId: string, onToast: (text: string) => void) {
  const [busy, setBusy] = useState(false);

  /** 받는다 — 원본이 없으면 아무것도 하지 않는다 */
  async function download(v: Voucher) {
    const name = downloadName(v);
    if (!name || !v.file_key || busy) return;
    setBusy(true);
    try {
      const file = await fetchOriginal(tripId, v, name);
      if (await saveFile(file)) onToast(`${name} 저장했어요`);
    } catch (e) {
      onToast(saveErrorText(e, "파일을 받지 못했어요. 잠시 후 다시 시도해 주세요."));
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    download: (v: Voucher) => void download(v),
  };
}
