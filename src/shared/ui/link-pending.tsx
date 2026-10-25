"use client";

import { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type LinkPendingProps = { children: (pending: boolean) => ReactNode };

/**
 * `<Link>` 안에서 이동을 기다리는지 알려 준다 — 누른 뒤 주소가 바뀌기 전까지 true.
 * 미리 받아 둔(프리페치) 화면은 바로 바뀌어 늘 false 다. 프리페치가 끝나기 전에 눌렀을 때만 보이는 보조 표시다
 * @see https://nextjs.org/docs/app/api-reference/functions/use-link-status
 */
export function LinkPending({ children }: LinkPendingProps) {
  const { pending } = useLinkStatus();
  return children(pending);
}

type LinkPendingVeilProps = { className?: string };

/**
 * 카드 · 줄 링크 위에 덮는 흰 막 — 이동을 기다리는 동안만 보인다. 늘 그려 두고 투명도만 바꿔 자리가 흔들리지 않는다.
 * 가장 가까운 `relative` 조상을 덮으므로 링크(또는 카드)에 `relative` 가 있어야 한다
 */
export function LinkPendingVeil({ className }: LinkPendingVeilProps) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] bg-white/60 opacity-0 transition-opacity duration-150",
        pending && "opacity-100",
        className,
      )}
    />
  );
}
