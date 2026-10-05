"use client";

import { ChevronDown, Smile } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

import { EmojiPickerPanel } from "./emoji-picker-panel";

type EmojiFieldProps = {
  /** 고른 이모지. ""(빈 글) = 기본 */
  value: string;
  onChange: (value: string) => void;
  /** 비었을 때 흐리게 보일 기본 이모지(예: 장소의 아이콘). 없으면 웃는 얼굴 자리 표시 */
  defaultEmoji?: string;
  /** 창을 칸 아래(기본) · 위에 */
  placement?: "bottom" | "top";
  /** 창을 칸 왼쪽(기본) · 오른쪽 끝에 맞춘다 — 오른쪽 칸이면 화면 밖으로 잘리지 않게 */
  align?: "left" | "right";
  "aria-label"?: string;
};

/**
 * 아이콘 칸(P26) — 브라우저는 기기 이모지 창을 직접 열 수 없어, 자주 쓰는 여행 이모지를 고르는 창과 키보드 입력을 함께 둔다.
 * 칸 56×44 · r10, 오른쪽 아래 작은 ⌄. 누르면 316 창(TimeField 와 같은 팝오버 계열), 고르면 바로 적용하고 닫힌다
 */
export function EmojiField({
  value,
  onChange,
  defaultEmoji,
  placement = "bottom",
  align = "left",
  "aria-label": ariaLabel = "아이콘",
}: EmojiFieldProps) {
  const [open, setOpen] = useState(false);
  const shown = value || defaultEmoji;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={value ? `${ariaLabel} ${value}` : `${ariaLabel} 기본`}
        className={cn(
          "relative flex h-11 w-14 shrink-0 items-center justify-center rounded-memo bg-white",
          open ? "border-[1.5px] border-primary" : "border border-line",
        )}
      >
        {shown ? (
          <span className={cn("text-[22px] leading-none", !value && "opacity-40")}>{shown}</span>
        ) : (
          <Smile className="size-5.5 text-ink-350" />
        )}
        <span className="absolute right-1 bottom-1 flex size-3.5 items-center justify-center rounded-full bg-surface-muted">
          <ChevronDown className="size-2.5 text-ink-500" strokeWidth={2.4} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        side={placement}
        align={align === "right" ? "end" : "start"}
        sideOffset={6}
        className="w-79 max-w-[calc(100vw-2rem)] gap-0 rounded-card bg-white p-3 shadow-[0_6px_20px_rgba(0,0,0,0.12)] ring-1 ring-divider"
      >
        <EmojiPickerPanel
          value={value}
          defaultEmoji={defaultEmoji}
          onPick={(emoji) => {
            onChange(emoji);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
