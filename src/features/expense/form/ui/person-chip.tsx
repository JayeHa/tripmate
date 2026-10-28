import { Check } from "lucide-react";

import { PersonAvatar } from "@/entities/expense";
import { cn } from "@/shared/lib/utils";

import type { FormPerson } from "../model/use-people-picker";

type PersonChipProps = {
  person: FormPerson;
  /** payer: 고르면 잉크로 채운다(한 명) · with: 고르면 블루 테두리 + 아바타 ✓(여러 명) */
  variant: "payer" | "with";
  selected: boolean;
  onClick: () => void;
};

/** 첫 글자 아바타 색 — 고른 결제자는 흰 바탕, 안 고른 함께한 사람은 회색, 그 밖엔 멤버(블루 계열) · 정산 인원(분홍 계열) */
function avatarTone(variant: PersonChipProps["variant"], selected: boolean, guest: boolean) {
  if (variant === "payer" && selected) return "bg-white text-ink-900";
  if (variant === "with" && !selected) return "bg-line-strong";
  if (variant === "payer") return guest ? "bg-guest-soft" : "bg-line-dashed";
  return guest ? "bg-guest" : "bg-primary";
}

/**
 * 사람 칩 — 36 높이, 이름 앞에 아바타 26(사진, 없으면 첫 글자). 정산 인원은 분홍 아바타로 멤버와 구분한다.
 * 안 고른 함께한 사람의 사진은 흐린 흑백 — 첫 글자 아바타가 회색이 되는 것과 같은 뜻
 */
export function PersonChip({ person, variant, selected, onClick }: PersonChipProps) {
  const payer = variant === "payer";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center gap-1.5 rounded-full border-[1.5px] pr-3 pl-1 text-sm font-bold",
        payer && selected && "border-ink-900 bg-ink-900 text-white",
        payer && !selected && "border-line bg-white text-ink-700",
        !payer && selected && "border-primary bg-white text-ink-900",
        !payer && !selected && "border-line bg-white text-ink-400",
      )}
    >
      <span className="relative flex">
        <PersonAvatar
          name={person.name}
          url={person.avatarUrl}
          guest={person.guest}
          className={cn("size-6.5", !payer && !selected && "opacity-50 grayscale")}
          fallbackClassName={cn("text-[11px]", avatarTone(variant, selected, person.guest))}
        />
        {!payer && selected && (
          <span className="absolute -right-0.75 -bottom-0.75 flex size-3.5 items-center justify-center rounded-full border-2 border-white bg-primary">
            <Check className="size-2 text-white" strokeWidth={4} aria-hidden="true" />
          </span>
        )}
      </span>
      {person.name}
    </button>
  );
}
