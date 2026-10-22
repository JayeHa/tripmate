"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/shared/api/query-keys";

import { fetchPackPhotoUrls } from "../api/photos";

/** 읽기 주소를 다시 받는 간격 — 1시간 만료 전에 */
const URL_STALE_MS = 50 * 60 * 1000;

/**
 * 사진을 볼 주소 — 키 묶음이 같으면(순서는 상관없다) 다시 받지 않는다. 기기에는 저장하지 않는다(`shouldPersistQuery`, 주소가 만료된다).
 * 목록은 사진 하나만 바뀌어도 묶음이 새 키가 되니, 받는 동안 앞 주소를 그대로 둔다 — 모든 썸네일이 빈 칸으로 깜빡이지 않게
 */
export function usePackPhotoUrls(tripId: string, keys: string[]) {
  const sorted = [...keys].sort();
  return useQuery({
    queryKey: [...queryKeys.packPhotos(tripId), "urls", ...sorted],
    queryFn: () => fetchPackPhotoUrls(tripId, sorted),
    enabled: sorted.length > 0,
    placeholderData: keepPreviousData,
    staleTime: URL_STALE_MS,
    gcTime: URL_STALE_MS,
    // 화면을 오래 띄워 둬도(포커스 · 다시 마운트 없이) 만료 전에 새 주소로 바꾼다
    refetchInterval: URL_STALE_MS,
  });
}
