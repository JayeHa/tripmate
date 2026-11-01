"use client";

import { keepPreviousData, queryOptions, useQuery } from "@tanstack/react-query";

import { withOfflineFileUrls } from "@/shared/api/offline-files";
import { queryKeys } from "@/shared/api/query-keys";

import { fetchRefundPhotos, fetchRefundPhotoUrls } from "../api/photos";

/** 읽기 주소를 다시 받는 간격 — 1시간 만료 전에 */
const URL_STALE_MS = 50 * 60 * 1000;

/** 환급 사진 줄의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const refundPhotosQuery = (tripId: string) =>
  queryOptions({
    queryKey: queryKeys.refundPhotos(tripId),
    queryFn: () => fetchRefundPhotos(tripId),
  });

/** 여행의 환급 사진 줄 */
export function useRefundPhotos(tripId: string) {
  return useQuery(refundPhotosQuery(tripId));
}

/**
 * 사진을 볼 주소 — 키 묶음이 같으면(순서는 상관없다) 다시 받지 않는다. 기기에는 저장하지 않는다(주소가 만료된다).
 * 받는 동안 앞 주소를 그대로 둔다 — 사진 하나를 더해도 모든 썸네일이 깜빡이지 않게. 오프라인이면 token 없는 주소(서비스 워커가 저장해 둔 사진)
 */
export function useRefundPhotoUrls(tripId: string, keys: string[]) {
  const sorted = [...keys].sort();
  const query = useQuery({
    queryKey: [...queryKeys.refundPhotos(tripId), "urls", ...sorted],
    queryFn: () => fetchRefundPhotoUrls(tripId, sorted),
    enabled: sorted.length > 0,
    placeholderData: keepPreviousData,
    staleTime: URL_STALE_MS,
    gcTime: URL_STALE_MS,
    refetchInterval: URL_STALE_MS,
  });
  return withOfflineFileUrls(query, "refund-photos", sorted);
}
