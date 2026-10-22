"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchPackPhotoUrls } from "../api/photos";

/** 읽기 주소를 다시 받는 간격 — 1시간 만료 전에 */
const URL_STALE_MS = 50 * 60 * 1000;

/** 사진을 볼 주소 — 키 목록이 같으면 다시 받지 않는다. 기기에는 저장하지 않는다(`shouldPersistQuery`, 주소가 만료된다) */
export function usePackPhotoUrls(tripId: string, keys: string[]) {
  return useQuery({
    queryKey: [...queryKeys.packPhotos(tripId), "urls", ...keys],
    queryFn: () => fetchPackPhotoUrls(tripId, keys),
    enabled: keys.length > 0,
    staleTime: URL_STALE_MS,
    gcTime: URL_STALE_MS,
    // 화면을 오래 띄워 둬도(포커스 · 다시 마운트 없이) 만료 전에 새 주소로 바꾼다
    refetchInterval: URL_STALE_MS,
  });
}
