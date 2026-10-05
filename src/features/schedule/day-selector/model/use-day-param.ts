"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * ?day=N 을 읽고 쓰는 훅. 범위를 벗어나면 0으로 clamp.
 * 쓸 때는 `history.replaceState` 로 주소만 바꾼다 — Next 라우터와 맞물려 useSearchParams 가 따라오고, 서버에 다시 묻지 않는다.
 * 이어서 보기에서는 스크롤할 때마다 바뀌어서 뒤로 가기 기록을 쌓지 않는다
 * @see https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api
 */
export function useDayParam(totalDays: number) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const raw = Number(searchParams.get("day") ?? 0);
  const day = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), Math.max(totalDays - 1, 0)) : 0;

  const setDay = useCallback(
    (next: number) => {
      const params = new URLSearchParams(window.location.search);
      params.set("day", String(next));
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    },
    [pathname],
  );

  return [day, setDay] as const;
}
