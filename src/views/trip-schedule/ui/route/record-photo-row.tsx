/* eslint-disable @next/next/no-img-element -- 서명 주소 사진이라 이미지 최적화를 거치지 않는다 */

/** 카드 사진 줄의 한 장 */
export type CardPhoto = {
  id: string;
  /** 썸네일 주소. 아직 없으면 회색 칸 */
  src: string | undefined;
  caption: string | null;
};

type RecordPhotoRowProps = {
  photos: readonly CardPhoto[];
  /** 사진을 눌렀다 */
  onOpen: () => void;
};

/**
 * 다녀온 장소 카드 안 사진 줄 — 56 · r10 · 사이 6(PC 72 · r12 · 사이 8), 넘치면 가로 스크롤.
 * 설명이 있는 사진은 아래에 11 회색 한 줄(말줄임). 누르면 기록 자세히 보기를 연다
 */
export function RecordPhotoRow({ photos, onOpen }: RecordPhotoRowProps) {
  return (
    <ul className="flex scrollbar-none gap-1.5 overflow-x-auto lg:gap-2">
      {photos.map((p, i) => (
        <li key={p.id} className="flex w-14 shrink-0 flex-col gap-1 lg:w-18">
          <button
            type="button"
            onClick={onOpen}
            aria-label={p.caption ?? `사진 ${i + 1}`}
            className="size-14 overflow-hidden rounded-memo bg-surface-muted lg:size-18 lg:rounded-card"
          >
            {p.src && <img src={p.src} alt="" className="size-full object-cover" />}
          </button>
          {p.caption && (
            <span className="truncate text-[11px] text-route-walk-text">{p.caption}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
