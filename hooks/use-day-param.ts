"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/** ?day=N 을 읽고 쓰는 훅. 범위를 벗어나면 0으로 clamp */
export function useDayParam(totalDays: number) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const raw = Number(searchParams.get("day") ?? 0);
  const day = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), Math.max(totalDays - 1, 0)) : 0;

  const setDay = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("day", String(next));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return [day, setDay] as const;
}
