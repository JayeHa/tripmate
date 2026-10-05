"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/shared/lib/utils";

type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  "aria-label"?: string;
  /** 바깥 라벨과 잇는 id */
  id?: string;
  className?: string;
};

/** 켜고 끄는 스위치 — 트랙 46×28(끔 회색 · 켬 블루), 흰 손잡이 22. 예: 「합계에서 제외」 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      {...props}
      className={cn(
        "relative inline-flex h-7 w-11.5 shrink-0 items-center rounded-full bg-line-strong p-0.75 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 data-checked:bg-primary data-disabled:opacity-40",
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="size-5.5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform duration-200 data-checked:translate-x-4.5" />
    </SwitchPrimitive.Root>
  );
}
