"use client";

import { Collapsible } from "@base-ui/react/collapsible";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type MoreSectionProps = {
  /** 머리 글 — 예: 「추가 정보 입력」 */
  title: string;
  /** 접혀 있을 때 오른쪽에 보이는 안에 든 것 — 예: 「결제 상태 · 메모 · 영수증 · 합계 제외」 */
  hint?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
};

/**
 * 자주 안 쓰는 칸을 접어 두는 칸 — 회색 머리(48 · r12), 접혀 있으면 오른쪽에 안에 든 것을 작게 보인다.
 * 펼침 상태는 부른 쪽이 쥔다 — 값이 이미 있는 칸이 안에 있으면 펼친 채 열려고
 */
export function MoreSection({ title, hint, open, onOpenChange, children }: MoreSectionProps) {
  return (
    <Collapsible.Root open={open} onOpenChange={onOpenChange} className="flex flex-col gap-4">
      <Collapsible.Trigger className="group flex h-12 items-center gap-2 rounded-card bg-surface-sunken px-4 text-left">
        <span className="text-[15px] font-bold text-ink-700">{title}</span>
        <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-400 group-data-panel-open:invisible">
          {hint}
        </span>
        <ChevronDown className="size-4.5 shrink-0 text-ink-500 transition-transform group-data-panel-open:rotate-180" />
      </Collapsible.Trigger>
      <Collapsible.Panel className="flex flex-col gap-5">{children}</Collapsible.Panel>
    </Collapsible.Root>
  );
}
