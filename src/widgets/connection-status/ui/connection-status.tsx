"use client";

import { WifiOff } from "lucide-react";

import { useOnline } from "@/shared/lib/use-online";
import { cn } from "@/shared/lib/utils";

import { useSyncStatus } from "../model/use-sync-status";
import { SyncChip } from "./sync-chip";

/**
 * 연결 상태 — 오프라인 띠와 동기화 칩(오프라인 편집 대기열).
 * - 오프라인: 화면 맨 위 띠(40 · #333, 모바일 · PC 같은 모양) 오른쪽에 칩. 화면마다 헤더 아래가 달라 떠 있는 칩은 내용(탭 · 버튼)을 가려서 띠 안에 둔다
 * - 온라인: 칩(올리는 중 · 모두 저장됨 · 실패)만 오른쪽 위에 잠깐 떠 있다 — 헤더 바로 아래(모바일 상단바 52 · PC 64)
 * 일행의 수정을 덮었다는 알림은 칩 아래에 — 화면의 토스트(아래 가운데)와 겹치지 않게 위에 둔다
 */
export function ConnectionStatus() {
  const online = useOnline();
  const { chip, notice, retry } = useSyncStatus();
  // 온라인일 때만 떠 있는 칩 — 오프라인이면 띠 안에 그린다
  const floatingChip = online ? chip : null;
  return (
    <>
      {!online && (
        <div className="flex h-10 shrink-0 items-center gap-2 bg-ink-800 px-4 text-[13px] font-semibold text-white">
          <WifiOff className="size-4 shrink-0" aria-hidden="true" />
          <span role="status" className="min-w-0 flex-1 truncate">
            오프라인이에요 · 받아 둔 여행은 그대로 열 수 있어요
          </span>
          {chip && <SyncChip chip={chip} onRetry={retry} />}
        </div>
      )}
      {(floatingChip !== null || notice !== null) && (
        <div
          className={cn(
            "pointer-events-none fixed right-3 z-40 flex flex-col items-end gap-1.5",
            online ? "top-15 lg:top-18" : "top-12",
          )}
        >
          {floatingChip && <SyncChip chip={floatingChip} onRetry={retry} />}
          {notice && (
            <span
              role="status"
              className="max-w-70 rounded-[20px] bg-ink-900/92 px-3.5 py-2 text-[13px] font-semibold text-white"
            >
              {notice}
            </span>
          )}
        </div>
      )}
    </>
  );
}
