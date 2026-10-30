"use client";

import { useEffect, useState } from "react";

import { GUIDE_PAGE } from "../lib/guide";

/**
 * 가이드 목록을 15장씩 — 목록 끝의 표시(sentinel)가 화면 아래 240px 안에 들어오면 15장 더 그린다.
 * 데이터는 한 번에 다 읽고 그리는 양만 나눈다(여행 하나의 장소라 많지 않다). 탭을 바꾸면 부모가 key 로 새로 그려 처음부터
 */
export function useGuidePaging(total: number) {
  const [limit, setLimit] = useState(GUIDE_PAGE);
  // 표시 요소 — ref 대신 상태로 받아, 붙고 떨어질 때 관찰을 다시 건다
  const [sentinel, setSentinel] = useState<HTMLDivElement | null>(null);
  const hasMore = total > limit;

  // 더 그린 뒤에도 표시가 화면 안이면 다시 관찰을 걸어 곧바로 한 번 더 늘린다(limit 이 바뀔 때마다 새로)
  useEffect(() => {
    if (!sentinel || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + GUIDE_PAGE);
      },
      { rootMargin: "0px 0px 240px 0px" },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [sentinel, hasMore, limit]);

  return { limit, hasMore, watchEnd: setSentinel };
}
