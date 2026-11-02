"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  addRefundPhoto,
  deleteRefundPhoto,
  REFUND_PHOTO_LIMIT,
  type RefundPhotoKind,
  removeRefundPhotoFiles,
  type TaxRefundPhoto,
} from "@/entities/tax-refund";
import { queryKeys } from "@/shared/api/query-keys";
import { saveErrorText } from "@/shared/api/sync";

import { refundPhotoErrorText, uploadRefundPhoto } from "./refund-photo-upload";

/** 사진 하나를 올리고 줄에 붙인다 — 줄을 넣지 못하면 올린 파일을 지우고 던진다 */
async function addOne(tripId: string, refundId: string, kind: RefundPhotoKind, file: File) {
  const keys = await uploadRefundPhoto(tripId, file);
  try {
    await addRefundPhoto(tripId, { refund_id: refundId, kind, ...keys });
  } catch (e) {
    await removeRefundPhotoFiles(tripId, [keys.photo_key, keys.thumb_key]);
    throw e;
  }
}

/**
 * 환급 사진 올리기 · 지우기 — 고르면 바로 올리고 붙인다(저장 단계 없음). 여러 장을 고르면 남은 자리(6장)만큼 차례로,
 * 넘친 것은 올리지 않고 알린다. 지우기는 줄을 지운 뒤 파일. 끝나면 줄을 다시 읽는다(읽기 주소는 키가 그대로면 그대로)
 */
export function useRefundPhotoActions(
  tripId: string,
  refundId: string,
  count: number,
  onToast: (text: string) => void,
) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(0);
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.refundPhotos(tripId), exact: true });

  /** 고른 사진들을 올린다 — 하나라도 실패하면 첫 오류를 알리고 나머지는 계속한다 */
  async function add(kind: RefundPhotoKind, files: File[]) {
    const room = Math.max(0, REFUND_PHOTO_LIMIT - count);
    const picked = files.slice(0, room);
    if (picked.length < files.length) onToast(`사진은 ${REFUND_PHOTO_LIMIT}장까지 붙일 수 있어요`);
    if (picked.length === 0) return;
    setUploading((n) => n + picked.length);
    let failed: unknown = null;
    for (const file of picked) {
      await addOne(tripId, refundId, kind, file).catch((e: unknown) => {
        failed ??= e;
      });
      setUploading((n) => n - 1);
    }
    await refresh();
    if (failed) onToast(refundPhotoErrorText(failed));
  }

  const remove = useMutation({
    mutationFn: async (photo: TaxRefundPhoto) => {
      await deleteRefundPhoto(photo.id);
      await removeRefundPhotoFiles(tripId, [photo.photo_key, photo.thumb_key]);
    },
    onSuccess: () => onToast("사진을 삭제했어요"),
    onError: (e) => onToast(saveErrorText(e, "사진을 지우지 못했어요. 잠시 뒤 다시 해 주세요")),
    onSettled: refresh,
  });

  return {
    /** 올리는 중인 장수 */
    uploading,
    add: (kind: RefundPhotoKind, files: File[]) => void add(kind, files),
    remove: (photo: TaxRefundPhoto) => remove.mutate(photo),
    removing: remove.isPending,
  };
}

export type RefundPhotoActions = ReturnType<typeof useRefundPhotoActions>;
