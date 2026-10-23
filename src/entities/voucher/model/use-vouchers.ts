"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { withOfflineFileUrls } from "@/shared/api/offline-files";
import { queryKeys } from "@/shared/api/query-keys";

import {
  deleteVoucher,
  fetchVouchers,
  fetchVoucherUrls,
  saveVoucher,
  setVoucherPin,
} from "../api/vouchers";
import type { Voucher, VoucherSave } from "./types";

/** 여행의 바우처 */
export function useVouchers(tripId: string) {
  return useQuery(vouchersQuery(tripId));
}

/** 바우처 목록의 조회 정의 — 화면 훅과 오프라인용으로 받기가 같이 쓴다 */
export const vouchersQuery = (tripId: string) =>
  queryOptions({ queryKey: queryKeys.vouchers(tripId), queryFn: () => fetchVouchers(tripId) });

/** 읽기 주소가 1시간 유효해서, 그보다 조금 짧게만 쓰고 그 전에 새로 받는다(영수증과 같다) */
const URL_STALE_MS = 50 * 60 * 1000;

/** 바우처 파일을 볼 주소 — 키 목록이 같으면 다시 받지 않는다. 기기에는 저장하지 않는다(`shouldPersistQuery`, 주소가 만료된다) */
export function useVoucherUrls(tripId: string, keys: string[]) {
  const query = useQuery({
    queryKey: [...queryKeys.vouchers(tripId), "urls", ...keys],
    queryFn: () => fetchVoucherUrls(tripId, keys),
    enabled: keys.length > 0,
    staleTime: URL_STALE_MS,
    gcTime: URL_STALE_MS,
    // 화면을 오래 띄워 둬도(포커스 · 다시 마운트 없이) 만료 전에 새 주소로 바꾼다
    refetchInterval: URL_STALE_MS,
  });
  // 서버에 닿지 못했으면(오프라인) token 없는 주소 — 서비스 워커가 저장해 둔 사진이면 보인다
  return withOfflineFileUrls(query, "vouchers", keys);
}

/** 추가 · 수정 저장 — 끝나면 목록만 다시 읽는다(읽기 주소는 키가 그대로면 다시 받지 않는다) */
export function useSaveVoucher(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (save: VoucherSave) => saveVoucher(tripId, save),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.vouchers(tripId), exact: true }),
  });
}

/** 지우기 — 끝나면 목록만 다시 읽는다 */
export function useDeleteVoucher(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVoucher(tripId, id),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.vouchers(tripId), exact: true }),
  });
}

/** 「홈에 고정」 — 누르면 바로 바뀌고(화면 먼저) 서버에 보낸다. 실패하면 그 바우처만 되돌린다 */
export function useSetVoucherPin(tripId: string) {
  const qc = useQueryClient();
  const key = queryKeys.vouchers(tripId);
  /** 캐시의 그 바우처 고정만 바꾼다 */
  const setPinIn = (id: string, pinnedBy: string | null) =>
    qc.setQueryData<Voucher[]>(key, (items) =>
      items?.map((v) => (v.id === id ? { ...v, pinned_by: pinnedBy } : v)),
    );
  return useMutation({
    mutationFn: (v: { id: string; pinnedBy: string | null }) => setVoucherPin(v.id, v.pinnedBy),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key, exact: true });
      const before = qc.getQueryData<Voucher[]>(key)?.find((x) => x.id === v.id);
      setPinIn(v.id, v.pinnedBy);
      return { before: before?.pinned_by ?? null };
    },
    onError: (_e, v, ctx) => setPinIn(v.id, ctx?.before ?? null),
    onSettled: () => qc.invalidateQueries({ queryKey: key, exact: true }),
  });
}
