"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string | true;
  right?: ReactNode;
  /** 우측 마지막 액션에 빨간 점을 띄운다 (읽지 않은 변경 표시). */
  dot?: boolean;
};

/**
 * 모바일 상단바. 높이 52, 좌우 18, 액션 간격 22.
 * (design_handoff_tripmate/design-system.md · components/navigation TopBar)
 */
export function AppHeader({ title, subtitle, back, right, dot }: Props) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex h-13 shrink-0 items-center gap-3.5 bg-background px-[18px]">
      {back && (
        <button
          type="button"
          aria-label="뒤로"
          className="flex cursor-pointer items-center text-ink-900"
          onClick={() => (back === true ? router.back() : router.push(back))}
        >
          <ArrowLeft className="size-6" strokeWidth={2} />
        </button>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-[15px] font-bold text-ink-900">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-ink-400">{subtitle}</p>}
      </div>
      {right && (
        <div
          className={cn(
            "flex items-center gap-[22px] text-ink-900",
            dot &&
              "[&>*:last-child]:relative [&>*:last-child]:after:absolute [&>*:last-child]:after:-top-0.5 [&>*:last-child]:after:-right-[3px] [&>*:last-child]:after:size-[7px] [&>*:last-child]:after:rounded-full [&>*:last-child]:after:bg-cat-food [&>*:last-child]:after:content-['']",
          )}
        >
          {right}
        </div>
      )}
    </header>
  );
}
