"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { NAV } from "@/shared/lib/nav-transition";
import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import { SheetDialog } from "@/shared/ui/sheet-dialog";

import type { Peek } from "../../lib/peek";

type PeekBodyProps = { peek: Peek };

/** 미리 보기 안 — 무엇인지 · 제목 20/800 · 사실 줄(라벨 | 값) · 글 칸, 아래 「○○에서 보기 ›」 */
function PeekBody({ peek }: PeekBodyProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-bold text-ink-400">{peek.heading}</span>
        <p className="text-xl/tight font-extrabold wrap-break-word text-ink-900">{peek.title}</p>
      </div>
      {peek.facts.length > 0 && (
        <dl className="flex flex-col">
          {peek.facts.map((f) => (
            <div
              key={f.label}
              className="flex min-h-11 items-center gap-3 border-b border-divider last:border-b-0"
            >
              <dt className="w-18 shrink-0 text-sm text-ink-400">{f.label}</dt>
              <dd className="min-w-0 flex-1 text-[15px] font-semibold text-ink-900">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {peek.body && (
        <p
          className={cn(
            "rounded-memo px-3.5 py-3 text-sm/normal wrap-break-word whitespace-pre-line text-ink-900",
            peek.important ? "bg-important-bg" : "bg-surface-muted",
          )}
        >
          {peek.body}
        </p>
      )}
      <Link
        href={peek.link.href}
        transitionTypes={peek.link.forward ? NAV.forward : NAV.tab}
        className={cn(buttonVariants({ size: "form" }), "w-full gap-0.5")}
      >
        {peek.link.label}
        <ChevronRight className="size-4.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

type PeekDialogProps = { peek: Peek | null; onClose: () => void };

/**
 * 홈 카드의 줄을 눌렀을 때 홈 위에 띄우는 미리 보기 — 모바일 바텀시트, PC 가운데 창.
 * 홈을 떠나지 않고 훑어보고, 고치거나 체크하려면 버튼으로 그 화면의 상세로 간다. 닫히는 동안 내용을 남긴다
 */
export function PeekDialog({ peek, onClose }: PeekDialogProps) {
  const shown = useHeldWhileClosing(peek !== null, peek);
  return (
    <SheetDialog open={peek !== null} onClose={onClose} ariaTitle={shown?.title}>
      {shown && <PeekBody peek={shown} />}
    </SheetDialog>
  );
}
