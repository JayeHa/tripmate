"use client";

import { ImagePlus, LoaderCircle } from "lucide-react";

import type { PackItem } from "@/entities/pack";

import type { PackPhotoActions } from "../model/use-pack-photo-actions";
import { PhotoInput } from "./photo-input";

type PackPhotoSlotProps = { item: PackItem; photos: PackPhotoActions };

/**
 * 쇼핑 줄 오른쪽 48 칸 — 사진이 있으면 썸네일(누르면 전체 화면), 없으면 점선 칸(누르면 사진을 골라 바로 붙인다).
 * 줄을 눌러 상세가 열리지 않게 클릭을 줄로 올려 보내지 않는다
 */
export function PackPhotoSlot({ item, photos }: PackPhotoSlotProps) {
  const busy = photos.isBusy(item.id);
  if (busy) {
    return (
      <span
        role="status"
        aria-label="사진 올리는 중"
        className="flex size-12 shrink-0 items-center justify-center rounded-button border border-line bg-surface-sunken"
      >
        <LoaderCircle className="size-4.5 animate-spin text-ink-400" aria-hidden="true" />
      </span>
    );
  }
  if (item.thumb_key) {
    const url = photos.thumbUrl(item);
    return (
      <button
        type="button"
        aria-label={`${item.name} 사진 크게 보기`}
        onClick={(e) => {
          e.stopPropagation();
          photos.openViewer(item.id);
        }}
        className="size-12 shrink-0 cursor-zoom-in overflow-hidden rounded-button border border-line bg-surface-sunken"
      >
        {url && (
          // 서명 주소(1시간)라 next/image 최적화를 거치지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        )}
      </button>
    );
  }
  return (
    <label
      aria-label={`${item.name} 참고 사진 추가`}
      onClick={(e) => e.stopPropagation()}
      className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-button border-[1.5px] border-dashed border-line-dashed"
    >
      <PhotoInput onPick={(file) => photos.put(item, file)} />
      <ImagePlus className="size-4.5 text-ink-350" aria-hidden="true" />
    </label>
  );
}
