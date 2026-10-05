"use client";

import { Keyboard, Laptop, Smartphone } from "lucide-react";
import { useState } from "react";

import {
  EMOJI_GROUPS,
  emojiKeyboardHint,
  firstEmoji,
  recentAndRecommended,
} from "@/shared/lib/emoji";
import { useRecentEmojis } from "@/shared/lib/use-recent-emojis";
import { cn } from "@/shared/lib/utils";

/** 「최근 · 추천」 탭 이름 — 처음 열면 이 탭 */
const RECENT_TAB = "최근 · 추천";

/** 안내 줄 아이콘 */
const HINT_ICON = { phone: Smartphone, computer: Laptop, other: Keyboard };

type EmojiPickerPanelProps = {
  value: string;
  /** 「기본」 버튼에 보일 이모지(없으면 글자만) */
  defaultEmoji?: string;
  /** 골랐다 — 빈 글이면 「기본」 */
  onPick: (emoji: string) => void;
};

/**
 * 이모지 고르기 창의 안쪽 — 탭(최근 · 추천 / 숙소·장소 / 음식 / 쇼핑 / 이동) · 8열 격자 · 키보드 입력 줄 · 「기본」 · 기기별 안내.
 * 열릴 때만 그려져 최근 목록(localStorage)을 이때 읽는다
 */
export function EmojiPickerPanel({ value, defaultEmoji, onPick }: EmojiPickerPanelProps) {
  const { recent, remember } = useRecentEmojis();
  const [tab, setTab] = useState(RECENT_TAB);
  const [typed, setTyped] = useState("");
  const tabs = [{ label: RECENT_TAB, emojis: recentAndRecommended(recent) }, ...EMOJI_GROUPS];
  const emojis = tabs.find((t) => t.label === tab)?.emojis ?? [];
  const hint = emojiKeyboardHint(navigator);
  const HintIcon = HINT_ICON[hint.kind];

  /** 하나를 골라 적용하고 최근에 넣는다 */
  function pick(emoji: string) {
    remember(emoji);
    onPick(emoji);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="-mx-3 flex scrollbar-none gap-1.5 overflow-x-auto px-3 [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.label}
            type="button"
            aria-pressed={t.label === tab}
            onClick={() => setTab(t.label)}
            className={cn(
              "h-7 shrink-0 rounded-full px-3 text-xs font-bold whitespace-nowrap",
              t.label === tab ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-0.5" role="listbox" aria-label={tab}>
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            role="option"
            aria-selected={e === value}
            onClick={() => pick(e)}
            className={cn(
              "flex size-8.5 items-center justify-center rounded-button text-xl hover:bg-surface-muted",
              e === value && "bg-primary-tint hover:bg-primary-tint",
            )}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="h-px bg-surface-muted" />
      <div className="flex gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-button bg-surface-muted px-2.5">
          <Keyboard className="size-4 shrink-0 text-ink-400" />
          <input
            value={typed}
            onChange={(e) => {
              const emoji = firstEmoji(e.target.value);
              if (emoji) pick(emoji);
              else setTyped(e.target.value);
            }}
            // 길이 제한은 두지 않는다 — 친 글자가 칸을 채우면 이모지가 들어가지 못한다. 고르는 건 첫 이모지 묶음뿐
            placeholder="다른 이모지는 키보드로"
            aria-label="이모지 직접 입력"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink-900 outline-none placeholder:text-ink-400"
          />
        </label>
        <button
          type="button"
          onClick={() => onPick("")}
          className="flex h-9 shrink-0 items-center gap-1 rounded-button border border-line px-2.5 text-[13px] font-bold text-ink-700"
        >
          {defaultEmoji && <span className="text-base">{defaultEmoji}</span>}
          기본
        </button>
      </div>
      <p className="flex items-center gap-1 text-[11px] text-ink-400">
        <HintIcon className="size-3 shrink-0" />
        {hint.text}
      </p>
    </div>
  );
}
