"use client";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { OwnerOption } from "../model/use-owner-options";

type OwnerChipsProps = {
  members: OwnerOption[];
  /** 고른 멤버 id. 비면 「모두」 */
  value: string[];
  onChange: (owners: string[]) => void;
};

/**
 * 「누구 거」 — 「모두」 칩(고르면 잉크) + 멤버 칩(아바타 28 · 이름, 고르면 블루 연한 바탕). 여러 명을 고른다.
 * 「모두」 를 누르면 고른 멤버를 비운다
 */
export function OwnerChips({ members, value, onChange }: OwnerChipsProps) {
  const all = value.length === 0;
  return (
    <div role="group" aria-label="누구 거" className="flex flex-wrap gap-1.5">
      <button
        type="button"
        aria-pressed={all}
        onClick={() => onChange([])}
        className={cn(
          "flex h-9 items-center rounded-full px-3.5 text-sm font-bold",
          all ? "bg-ink-900 text-white" : "bg-surface-muted text-ink-700",
        )}
      >
        모두
      </button>
      {members.map((m) => {
        const on = value.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((id) => id !== m.id) : [...value, m.id])}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full pr-3 pl-1 text-sm font-bold",
              on ? "bg-primary-tint text-primary-pressed" : "bg-surface-muted text-ink-700",
            )}
          >
            <Avatar className="size-7">
              {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
              <AvatarFallback className="bg-primary font-extrabold text-white">
                {m.name.slice(0, 1)}
              </AvatarFallback>
            </Avatar>
            {m.name}
          </button>
        );
      })}
    </div>
  );
}
