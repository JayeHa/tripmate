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
  setVoucherUsed,
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
  return useVoucherFieldToggle(tripId, "pinned_by", setVoucherPin);
}

/** 「사용했어요」 · 되돌리기 — 고정과 같다(화면 먼저, 실패하면 그 바우처만 되돌린다) */
export function useSetVoucherUsed(tripId: string) {
  return useVoucherFieldToggle(tripId, "used_at", setVoucherUsed);
}

/**
 * 바우처 한 칸(고정한 사람 · 쓴 시각)을 바로 바꾸는 저장 — 캐시의 그 바우처만 먼저 바꾸고 보낸 뒤, 실패하면 그 칸만 되돌린다.
 * 끝나면 목록을 다시 읽는다
 */
function useVoucherFieldToggle(
  tripId: string,
  field: "pinned_by" | "used_at",
  send: (id: string, value: string | null) => Promise<void>,
) {
  const qc = useQueryClient();
  const key = queryKeys.vouchers(tripId);
  /** 캐시의 그 바우처 칸만 바꾼다 */
  const setIn = (id: string, value: string | null) =>
    qc.setQueryData<Voucher[]>(key, (items) =>
      items?.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    );
  return useMutation({
    mutationFn: (v: { id: string; value: string | null }) => send(v.id, v.value),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: key, exact: true });
      const before = qc.getQueryData<Voucher[]>(key)?.find((x) => x.id === v.id);
      setIn(v.id, v.value);
      return { before: before?.[field] ?? null };
    },
    onError: (_e, v, ctx) => setIn(v.id, ctx?.before ?? null),
    onSettled: () => qc.invalidateQueries({ queryKey: key, exact: true }),
  });
}
