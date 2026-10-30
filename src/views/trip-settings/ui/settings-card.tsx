import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type SettingsCardProps = {
  title: ReactNode;
  /** 제목 아래 13 회색 설명 */
  description?: string;
  className?: string;
  children: ReactNode;
};

/** 설정 카드 — 흰 바탕 r12 · 테두리 · 안쪽 20/16(PC 22) · 제목 17/800, 설명이 있으면 제목 아래 4 */
export function SettingsCard({ title, description, className, children }: SettingsCardProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-card border border-line-card bg-white px-4 py-5 lg:p-5.5",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-[17px] font-extrabold text-ink-900">{title}</h2>
        {description && (
          <p className="text-[13px]/normal text-pretty text-ink-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
