"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** 다른 화면이 「이 항목을 열어 줘」 로 보낼 때 쓰는 주소 검색값 이름 — `?open=id` */
export const OPEN_PARAM = "open";

/**
 * 주소의 `?open=id` 를 마운트할 때 한 번 읽는다 — 홈 카드의 줄처럼 다른 화면에서 그 항목의 상세를 열어 달라는 요청.
 * 읽은 뒤 주소에서 뺀다. 남겨 두면 새로고침 · 앞으로 가기마다 상세가 다시 열린다.
 * 주소만 바꾸는 `history.replaceState` 라 서버에 다시 묻지 않고 방문 기록도 쌓지 않는다
 * @see https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api
 */
export function useOpenParam(): string | null {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [id] = useState(() => searchParams.get(OPEN_PARAM));
  useEffect(() => {
    if (!id) return;
    const params = new URLSearchParams(window.location.search);
    params.delete(OPEN_PARAM);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [id, pathname]);
  return id;
}
