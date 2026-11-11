"use client";

import { type PointerEvent, useState } from "react";

import { cn } from "@/shared/lib/utils";

import { ratingText } from "../../model/rating";

const STARS = [1, 2, 3, 4, 5] as const;

/** 크기 — 카드(별 24 · 사이 1 · 문구 12/800) · 기록 창(별 34, PC 32 · 사이 2 · 문구 13/800) */
const SIZE = {
  card: { stars: "gap-px text-2xl", text: "text-xs" },
  sheet: { stars: "gap-0.5 text-[34px] lg:text-[32px]", text: "text-[13px]" },
} as const;

type RatingPickerProps = {
  /** 0 = 아직 안 매김, 1~5 */
  value: number;
  /** 별을 눌렀다 — 누른 점수(같은 점수를 다시 누르면 지울지는 부르는 쪽이 정한다) */
  onPick: (stars: number) => void;
  size: keyof typeof SIZE;
  /** 안 매겼을 때 오른쪽 문구(회색). 없으면 비운다 */
  emptyText?: string;
  /** 화면 읽기용 묶음 이름 */
  label: string;
};

/**
 * 별 ★ 다섯 개 + 오른쪽 점수 문구(「4 → 좋아요」). 누르면 그 점수를 알린다.
 * 마우스를 올리면 그 별까지 옅은 노랑으로 칠하고 문구도 그 점수로 미리 보여 준다(PC). 손가락은 미리보기를 쓰지 않는다 —
 * 터치 뒤에 올림 상태가 남아 누른 값과 다르게 보인다
 */
export function RatingPicker({ value, onPick, size, emptyText, label }: RatingPickerProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const text = ratingText(shown);
  /** 마우스만 미리보기 */
  const preview = (n: number) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHover(n);
  };
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        role="group"
        aria-label={label}
        className={cn("flex shrink-0 leading-none", SIZE[size].stars)}
        onPointerLeave={() => setHover(0)}
      >
        {STARS.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`별 ${n}개`}
            aria-pressed={n === value}
            onPointerEnter={preview(n)}
            onClick={() => onPick(n)}
            className={cn("transition-colors duration-150", starColor(n, value, hover))}
          >
            ★
          </button>
        ))}
      </span>
      <span
        className={cn(
          "truncate font-extrabold",
          SIZE[size].text,
          text ? "text-my-star-text" : "text-[#AAA]",
        )}
      >
        {text ?? emptyText}
      </span>
    </span>
  );
}

/** 별 하나의 색 — 올린 별까지 옅은 노랑, 아니면 매긴 점수까지 노랑, 나머지는 빈 별 */
function starColor(n: number, value: number, hover: number): string {
  if (hover > 0) return n <= hover ? "text-my-star-hover" : "text-my-star-empty";
  return n <= value ? "text-my-star" : "text-my-star-empty";
}
