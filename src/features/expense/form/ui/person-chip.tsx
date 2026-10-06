import { Check } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import type { FormPerson } from "../model/use-people-picker";

type PersonChipProps = {
  person: FormPerson;
  /** payer: 고르면 잉크로 채운다(한 명) · with: 고르면 블루 테두리 + 아바타 ✓(여러 명) */
  variant: "payer" | "with";
  selected: boolean;
  onClick: () => void;
};

/** 아바타 색 — 고른 결제자는 흰 바탕, 안 고른 함께한 사람은 회색, 그 밖엔 멤버(블루 계열) · 정산 인원(분홍 계열) */
function avatarTone(variant: PersonChipProps["variant"], selected: boolean, guest: boolean) {
  if (variant === "payer" && selected) return "bg-white text-ink-900";
  if (variant === "with" && !selected) return "bg-line-strong";
  if (variant === "payer") return guest ? "bg-guest-soft" : "bg-line-dashed";
  return guest ? "bg-guest" : "bg-primary";
}

/** 사람 칩 — 36 높이, 이름 앞에 첫 글자 아바타 26. 정산 인원은 분홍 아바타로 멤버와 구분한다 */
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
        <span
          className={cn(
            "flex size-6.5 items-center justify-center rounded-full text-[11px] font-extrabold text-white",
            avatarTone(variant, selected, person.guest),
          )}
        >
          {person.name.slice(0, 1)}
        </span>
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
