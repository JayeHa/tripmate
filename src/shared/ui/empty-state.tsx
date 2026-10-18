import type { LucideIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
  /** 행동 버튼(선택) */
  action?: React.ReactNode;
  className?: string;
};

/** 화면 · 목록 단위 빈 상태(P8) — 아이콘 36 #D5D8DC · 제목 15/700 #444 · 설명 13 #999 · (선택) 버튼 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-5 py-12 text-center", className)}>
      <Icon className="size-9 text-line-strong" strokeWidth={1.6} />
      <p className="pt-1 text-[15px] font-bold text-ink-700">{title}</p>
      {description && <p className="text-[13px]/normal text-ink-400">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
