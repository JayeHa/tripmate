"use client";

import { useEffect, useRef, useState } from "react";

import {
  isVoucherMime,
  removeVoucherFiles,
  uploadVoucherFile,
  type Voucher,
  VOUCHER_MAX_BYTES,
} from "@/entities/voucher";

/** 이번 창에서 고른 새 원본 — 올리는 중이면 key 가 없다 */
export type PickedFile = {
  file: File;
  key: string | null;
  /** 기기 미리 보기 주소(사진만) */
  preview: string | null;
};

/**
 * 바우처 원본 칸 — 고르면 줄이지 않고 바로 저장소에 올린다(원본 그대로, 20MB 까지). 바꿔 고르면 앞서 올린 새 파일은 지운다.
 * 저장하지 않고 창이 사라지면 올린 새 파일을 지운다(올리는 중이면 끝난 뒤). 저장했으면 `keep()` 으로 남긴다.
 * 이미 붙어 있던 원본은 여기서 지우지 않는다 — 저장이 끝난 뒤 바꾼 원본을 지우는 것은 저장 쪽 일이다
 */
export function useVoucherFile(tripId: string, voucher: Voucher | null) {
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 지금 고른 파일의 차례 — 올리는 사이 다시 고르거나 창이 사라지면 끝난 올리기의 키를 버리고 지운다
  const turn = useRef(0);
  // 올려 둔 새 파일 — 같은 객체의 칸만 바꾼다(정리 함수가 마운트 때 잡은 객체를 그대로 읽는다)
  const live = useRef<{ key: string | null; kept: boolean }>({ key: null, kept: false });

  useEffect(() => {
    const state = live.current;
    return () => {
      turn.current += 1;
      if (state.key && !state.kept) void removeVoucherFiles(tripId, [state.key]);
    };
  }, [tripId]);

  /** 파일을 고른다 — 받지 않는 종류 · 20MB 넘는 파일은 올리지 않고 이유를 알린다 */
  function pick(file: File) {
    setError(null);
    if (!isVoucherMime(file.type)) {
      setError("사진과 PDF 만 올릴 수 있어요.");
      return;
    }
    if (file.size > VOUCHER_MAX_BYTES) {
      setError(`${file.name} 은(는) 20MB 를 넘어요.`);
      return;
    }
    const mine = ++turn.current;
    if (live.current.key) void removeVoucherFiles(tripId, [live.current.key]);
    live.current.key = null;
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    setPicked({ file, key: null, preview });
    void uploadVoucherFile(tripId, file).then(
      (key) => {
        if (mine !== turn.current) {
          void removeVoucherFiles(tripId, [key]);
          return;
        }
        live.current.key = key;
        setPicked({ file, key, preview });
      },
      () => {
        if (mine !== turn.current) return;
        setPicked(null);
        setError("파일을 올리지 못했어요. 다시 골라 주세요.");
      },
    );
  }

  return {
    picked,
    error,
    pick,
    /** 올리는 중 — 저장을 기다리게 한다 */
    uploading: picked !== null && picked.key === null,
    /** 보이는 파일 이름 · 종류 — 새로 고른 것, 없으면 붙어 있던 것 */
    name: picked?.file.name ?? voucher?.file_name ?? null,
    mime: picked?.file.type ?? voucher?.file_mime ?? null,
    /** 저장했다 — 창이 사라져도 새 파일을 지우지 않는다 */
    keep: () => {
      live.current.kept = true;
    },
  };
}

export type VoucherFileState = ReturnType<typeof useVoucherFile>;
