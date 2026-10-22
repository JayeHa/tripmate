"use client";

import { WifiOff } from "lucide-react";

import { useOnline } from "@/shared/lib/use-online";

/**
 * 오프라인 띠(40 · #333) — 화면 맨 위, 모바일 · PC 같은 모양. 연결이 끊기면 나타나고 돌아오면 사라진다.
 * 저장해 둔 화면(서비스 워커)과 데이터(IndexedDB)로 볼 수 있다는 안내
 */
export function OfflineBanner() {
  const online = useOnline();
  if (online) return null;
  return (
    <div
      role="status"
      className="flex h-10 shrink-0 items-center gap-2 bg-ink-800 px-4 text-[13px] font-semibold text-white"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">
        오프라인이에요 · 저장해 둔 일정과 바우처는 볼 수 있어요
      </span>
    </div>
  );
}
