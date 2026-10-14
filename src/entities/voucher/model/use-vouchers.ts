"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchVouchers, fetchVoucherUrls } from "../api/vouchers";

/** 여행의 바우처 */
export function useVouchers(tripId: string) {
  return useQuery({
    queryKey: queryKeys.vouchers(tripId),
    queryFn: () => fetchVouchers(tripId),
  });
}

/** 읽기 주소가 1시간 유효해서, 그보다 조금 짧게만 쓰고 그 전에 새로 받는다(영수증과 같다) */
const URL_STALE_MS = 50 * 60 * 1000;

/** 바우처 파일을 볼 주소 — 키 목록이 같으면 다시 받지 않는다. 기기에는 저장하지 않는다(`shouldPersistQuery`, 주소가 만료된다) */
export function useVoucherUrls(tripId: string, keys: string[]) {
  return useQuery({
    queryKey: [...queryKeys.vouchers(tripId), "urls", ...keys],
    queryFn: () => fetchVoucherUrls(tripId, keys),
    enabled: keys.length > 0,
    staleTime: URL_STALE_MS,
    gcTime: URL_STALE_MS,
    // 화면을 오래 띄워 둬도(포커스 · 다시 마운트 없이) 만료 전에 새 주소로 바꾼다
    refetchInterval: URL_STALE_MS,
  });
}
