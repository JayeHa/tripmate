"use client";

import { useEffect, useRef, useState } from "react";

import { type PackPhoto, removePackPhotos } from "@/entities/pack";

import { photoErrorText, uploadPackPhoto } from "./pack-photo-upload";

/**
 * 상세 시트의 사진 칸 — 고르면 바로 올리고, 저장할 때 항목에 붙인다(그때까지는 이 창의 것).
 * 이 창이 올린 사진은 다른 사진으로 바꾸거나 · 지우거나 · 저장하지 않고 닫으면 바로 지운다(올리는 중이면 끝난 뒤).
 * 닫힌 창은 DOM 에 남아(다시 열 때 새로 마운트) 언마운트만 기다리면 늦어서, open 이 꺼질 때 지운다.
 * 저장을 누르면(handOff) 저장 쪽이 맡는다 — 실패하면 저장 쪽이 지운다
 */
export function usePhotoDraft(
  tripId: string,
  initial: PackPhoto | null,
  open: boolean,
  onToast: (text: string) => void,
) {
  const [photo, setPhoto] = useState(initial);
  const [uploading, setUploading] = useState(false);
  // 이 창이 올렸고 아직 저장 쪽에 넘기지 않은 사진
  const owned = useRef<PackPhoto | null>(null);
  const alive = useRef(true);

  // 창이 열려 있는 동안만 산다 — 닫히거나 사라지면 올린 사진을 지우고, 그 뒤에 끝난 올리기도 지운다
  useEffect(() => {
    alive.current = open;
    if (!open) return;
    return () => {
      alive.current = false;
      if (owned.current) void removePackPhotos(tripId, [owned.current]);
      owned.current = null;
    };
  }, [tripId, open]);

  /** 이 창이 올린 사진을 버린다 */
  function dropOwned() {
    if (owned.current) void removePackPhotos(tripId, [owned.current]);
    owned.current = null;
  }

  /** 사진을 골랐다 — 올린 뒤 칸에 넣는다. 그사이 창이 닫혔으면 올린 것을 지운다 */
  async function pick(file: File) {
    setUploading(true);
    try {
      const next = await uploadPackPhoto(tripId, file);
      if (!alive.current) {
        void removePackPhotos(tripId, [next]);
        return;
      }
      dropOwned();
      owned.current = next;
      setPhoto(next);
    } catch (e) {
      if (alive.current) onToast(photoErrorText(e));
    } finally {
      if (alive.current) setUploading(false);
    }
  }

  return {
    photo,
    uploading,
    pick: (file: File) => void pick(file),
    /** 「사진 지우기」 — 저장할 때 항목에서도 뺀다 */
    clear: () => {
      dropOwned();
      setPhoto(null);
    },
    /** 저장 — 올린 사진을 저장 쪽에 넘기고(닫혀도 지우지 않게) 칸의 사진을 돌려준다 */
    handOff: () => {
      owned.current = null;
      return photo;
    },
  };
}
