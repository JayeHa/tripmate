"use client";

import { useState } from "react";

import {
  PACK_PHOTO_CHANGED,
  type PackItem,
  photoOf,
  removePackPhotos,
  usePackPhotoUrls,
  useSetPackPhoto,
} from "@/entities/pack";

import { photoErrorText, uploadPackPhoto } from "./pack-photo-upload";

/**
 * 쇼핑 줄의 사진 — 목록 썸네일 주소 · 줄에서 바로 넣기 · 전체 화면(열린 항목) · 교체 · 지우기(확인을 거친다).
 * 넣기 · 교체는 올린 뒤 항목에 붙이고, 붙이지 못하면 올린 파일을 지운다. 붙였으면 앞 사진 파일을 지운다.
 * 붙이기 · 지우기는 누른 때의 사진일 때만 한다 — 그사이 일행이 바꿨으면 일행의 사진을 덮거나 비우지 않고 알린다.
 * 쇼핑이 아니면 null 을 넘겨 쓰지 않는다(훅은 늘 부른다)
 */
export function usePackPhotoActions(
  tripId: string,
  items: readonly PackItem[],
  onToast: (text: string) => void,
) {
  const setPhoto = useSetPackPhoto(tripId);
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());
  const [viewId, setViewId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const thumbKeys = items.flatMap((i) => (i.thumb_key ? [i.thumb_key] : []));
  const { data: thumbUrls = {} } = usePackPhotoUrls(tripId, thumbKeys);
  // 전체 화면 — 그사이 일행이 항목이나 사진을 지웠으면 닫힌다
  const viewing = items.find((i) => i.id === viewId && photoOf(i)) ?? null;

  /** 그 항목을 「올리는 중」 으로 표시하거나 푼다 */
  function setBusy(id: string, busy: boolean) {
    setBusyIds((cur) => {
      const next = new Set(cur);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  /** 사진을 올려 붙인다(넣기 · 교체) — 실패는 토스트로 */
  async function put(item: PackItem, file: File) {
    setBusy(item.id, true);
    try {
      const photo = await uploadPackPhoto(tripId, file);
      try {
        await setPhoto.mutateAsync({ id: item.id, photo, expected: item.photo_key });
      } catch (e) {
        void removePackPhotos(tripId, [photo]);
        throw e;
      }
      void removePackPhotos(tripId, [photoOf(item)]);
    } catch (e) {
      onToast(photoErrorText(e));
    } finally {
      setBusy(item.id, false);
    }
  }

  return {
    /** 목록 썸네일 주소 — 아직 못 받았으면 undefined */
    thumbUrl: (item: PackItem) => (item.thumb_key ? thumbUrls[item.thumb_key] : undefined),
    isBusy: (id: string) => busyIds.has(id),
    /** 줄의 점선 칸 · 전체 화면의 「교체」 */
    put: (item: PackItem, file: File) => void put(item, file),
    viewing,
    openViewer: (id: string) => setViewId(id),
    closeViewer: () => setViewId(null),
    removing,
    askRemove: () => setRemoving(true),
    cancelRemove: () => setRemoving(false),
    /** 지우기 확인 — 두 칸을 비우고 파일을 지운다. 전체 화면도 닫는다 */
    confirmRemove: () => {
      setRemoving(false);
      if (!viewing) return;
      const item = viewing;
      setViewId(null);
      void setPhoto
        .mutateAsync({ id: item.id, photo: null, expected: item.photo_key })
        .then(() => {
          onToast("사진을 삭제했어요");
          return removePackPhotos(tripId, [photoOf(item)]);
        })
        .catch((e: unknown) =>
          onToast(
            e instanceof Error && e.message === PACK_PHOTO_CHANGED
              ? PACK_PHOTO_CHANGED
              : "지우지 못했어요. 잠시 후 다시 시도해 주세요",
          ),
        );
    },
  };
}

export type PackPhotoActions = ReturnType<typeof usePackPhotoActions>;
