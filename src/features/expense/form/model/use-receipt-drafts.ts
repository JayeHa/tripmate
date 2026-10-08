"use client";

import { useState } from "react";

import {
  type ExpenseReceipt,
  isReceiptMime,
  RECEIPT_MAX_BYTES,
  RECEIPT_MAX_COUNT,
  type ReceiptChange,
  uploadReceipt,
} from "@/entities/expense";
import { compressImage } from "@/shared/lib/compress-image";

/** 폼의 영수증 한 장 — 이미 붙어 있던 것(id), 방금 올린 것, 올리는 중인 것(key 없음) */
export type ReceiptDraft = {
  /** 목록 key — 붙어 있던 것은 줄 id, 새 것은 임시 id */
  uid: string;
  id?: string;
  key?: string;
  name: string;
  mime: string;
  size: number;
  /** 고른 기기의 미리 보기 주소(새 사진만) */
  preview?: string;
};

/**
 * 비용 입력의 영수증 — 고르면 줄여서(사진) 바로 저장소에 올리고, 「완료」 할 때 붙일 것 · 뗄 것을 넘긴다.
 * 이미 붙어 있던 영수증을 지우면 저장할 때 떼고 파일도 지운다. 닫으면(저장 안 함) 붙어 있던 것은 그대로다.
 * 사진 · PDF 만, 장당 10MB, 지출당 3장까지(RECEIPT_MAX_COUNT) — 넘는 파일은 올리지 않고 이유를 알린다
 */
export function useReceiptDrafts(tripId: string, initial: ExpenseReceipt[]) {
  const [items, setItems] = useState<ReceiptDraft[]>(() =>
    initial.map((r) => ({
      uid: r.id,
      id: r.id,
      key: r.key,
      name: r.name,
      mime: r.mime,
      size: r.size,
    })),
  );
  const [error, setError] = useState<string | null>(null);

  /** 한 파일을 올린다 — 올리는 동안 자리를 먼저 보이고, 끝나면 키를 채운다. 실패하면 자리를 뺀다 */
  async function uploadOne(file: File) {
    const uid = crypto.randomUUID();
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setItems((list) => [
      ...list,
      { uid, name: file.name, mime: file.type, size: file.size, preview },
    ]);
    try {
      const blob = await compressImage(file);
      if (blob.size > RECEIPT_MAX_BYTES) throw new Error("too-big");
      const done = await uploadReceipt(tripId, blob, file.name);
      setItems((list) => list.map((d) => (d.uid === uid ? { ...d, ...done } : d)));
    } catch (e) {
      setItems((list) => list.filter((d) => d.uid !== uid));
      setError(
        (e as Error).message === "too-big"
          ? `${file.name} 은(는) 10MB 를 넘어요.`
          : "영수증을 올리지 못했어요. 다시 시도해 주세요.",
      );
    }
  }

  /** 고른 파일들 — 받지 않는 종류는 건너뛰고, 장수를 넘는 만큼은 올리지 않는다 */
  function add(files: File[]) {
    setError(null);
    const room = RECEIPT_MAX_COUNT - items.length;
    const accepted = files.filter((f) => isReceiptMime(f.type));
    if (accepted.length < files.length) setError("사진과 PDF 만 붙일 수 있어요.");
    if (accepted.length > room) setError(`영수증은 ${RECEIPT_MAX_COUNT}장까지 붙일 수 있어요.`);
    accepted.slice(0, Math.max(0, room)).forEach((f) => void uploadOne(f));
  }

  return {
    items,
    error,
    add,
    remove: (uid: string) => setItems((list) => list.filter((d) => d.uid !== uid)),
    /** 올리는 중인 파일이 있다 — 저장을 기다리게 한다 */
    uploading: items.some((d) => !d.key),
    full: items.length >= RECEIPT_MAX_COUNT,
    /** 저장할 때 — 새로 올린 것은 붙이고, 지운 것은 뗀다 */
    change(): ReceiptChange {
      const kept = new Set(items.map((d) => d.id).filter(Boolean));
      return {
        attach: items.flatMap((d) =>
          !d.id && d.key ? [{ key: d.key, name: d.name, mime: d.mime, size: d.size }] : [],
        ),
        detach: initial.filter((r) => !kept.has(r.id)).map((r) => ({ id: r.id, key: r.key })),
      };
    },
  };
}

export type ReceiptDrafts = ReturnType<typeof useReceiptDrafts>;
