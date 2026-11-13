/* eslint-disable @next/next/no-img-element -- 서명 주소 · 미리보기(object URL) 사진이라 이미지 최적화를 거치지 않는다 */
import { ChevronLeft, ChevronRight } from "lucide-react";

import { VISIT_CAPTION_MAX } from "@/entities/schedule-item";

type PhotoPreviewProps = {
  /** 큰 사진 주소. 아직 없으면 회색 칸 */
  src: string | undefined;
  /** 고른 사진(0부터) · 전체 장수 */
  index: number;
  count: number;
  /** 올린 사람 이름 — 「2 / 3 · 김동규」. 혼자 여행이면 없다 */
  by?: string;
  caption: string;
  onCaption: (text: string) => void;
  onSelect: (index: number) => void;
  onRemove: () => void;
  /** 오프라인 · 저장 중 — 빼기 · 설명 고치기를 막는다 */
  disabled: boolean;
};

const ARROW =
  "absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-ink-700 shadow-[0_1px_4px_rgba(0,0,0,.15)]";

/**
 * 고른 사진 크게(200, PC 240) + 설명 칸(40자). 왼쪽 위 「2 / 3 · 올린 사람」, 오른쪽 위 「사진 삭제」, 좌우 ‹ ›(처음 · 끝에서 숨김).
 * 설명 칸의 Enter 는 저장이 아니라 다음 사진으로 — 한글 조합을 끝내는 Enter 는 무시한다(안 그러면 마지막 글자가 다음 사진으로 넘어간다)
 */
export function PhotoPreview({
  src,
  index,
  count,
  by,
  caption,
  onCaption,
  onSelect,
  onRemove,
  disabled,
}: PhotoPreviewProps) {
  const last = index === count - 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-50 overflow-hidden rounded-card bg-surface-muted lg:h-60">
        {src && (
          <img src={src} alt={caption || `사진 ${index + 1}`} className="size-full object-cover" />
        )}
        <span className="absolute top-2 left-2 max-w-[60%] truncate rounded-xl bg-white/88 px-2 text-xs/6 font-extrabold text-ink-700 tabular-nums">
          {index + 1} / {count}
          {by && ` · ${by}`}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 h-7 rounded-[14px] bg-[rgba(17,17,17,.6)] px-2.5 text-xs font-bold text-white"
          >
            사진 삭제
          </button>
        )}
        {index > 0 && (
          <button
            type="button"
            aria-label="이전 사진"
            onClick={() => onSelect(index - 1)}
            className={`${ARROW} left-2`}
          >
            <ChevronLeft className="size-4.5" strokeWidth={2.5} />
          </button>
        )}
        {!last && (
          <button
            type="button"
            aria-label="다음 사진"
            onClick={() => onSelect(index + 1)}
            className={`${ARROW} right-2`}
          >
            <ChevronRight className="size-4.5" strokeWidth={2.5} />
          </button>
        )}
      </div>
      <input
        value={caption}
        onChange={(e) => onCaption(e.target.value)}
        onKeyDown={(e) => {
          // Safari 는 조합을 끝내는 Enter 를 isComposing 없이 keyCode 229 로 보낸다
          if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
          e.preventDefault();
          if (!last) onSelect(index + 1);
        }}
        disabled={disabled}
        maxLength={VISIT_CAPTION_MAX}
        enterKeyHint="next"
        aria-label={`사진 ${index + 1} 설명`}
        placeholder="이 사진에 설명 붙이기 (선택)"
        className="h-11 w-full rounded-memo border border-line px-3 text-sm text-ink-900 outline-none placeholder:text-ink-350 focus:border-primary disabled:bg-surface-muted"
      />
      <div className="flex justify-between text-[11px] text-ink-350">
        <span>{last ? "마지막 사진이에요" : "엔터 → 다음 사진"}</span>
        <span className="tabular-nums">
          {caption.length} / {VISIT_CAPTION_MAX}
        </span>
      </div>
    </div>
  );
}
