"use client";

import { useMemo, useState } from "react";

import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useMemberLookup, useTripMembers } from "@/entities/trip-member";
import {
  useVouchers,
  useVoucherUrls,
  type Voucher,
  VOUCHER_GROUP_LABEL,
  VOUCHER_GROUPS,
  voucherTarget,
} from "@/entities/voucher";
import { targetLabel, useTargetSources } from "@/features/checklist";
import { dayCount } from "@/shared/lib/days";
import { FILTER_ALL } from "@/shared/ui/filter-select";

import {
  dayOptions,
  groupVouchers,
  matchesFilters,
  ownersText,
  voucherDay,
  type VoucherFilters,
  voucherSubText,
} from "../lib/vouchers";

const NO_FILTER: VoucherFilters = { who: FILTER_ALL, day: FILTER_ALL, group: FILTER_ALL };

/** 종류 필터 옵션 — 시안은 「항공」 (묶음 제목은 「항공편」) */
const GROUP_OPTIONS = VOUCHER_GROUPS.map((g) => ({
  value: g,
  label: g === "flight" ? "항공" : VOUCHER_GROUP_LABEL[g],
}));

/**
 * 노트 › 바우처 목록의 상태 — 필터(사람 · 날짜 · 종류)와 걸러진 묶음, 줄마다 보조 글 · 주인 글 · 썸네일 주소.
 * 일정 · 항공편 · 숙소를 다 읽기 전에는 연결 이름 · 날짜를 모르는 것으로 그린다
 */
export function useVoucherList(tripId: string) {
  const { data: vouchers, isPending } = useVouchers(tripId);
  const src = useTargetSources(tripId);
  const { data: trip } = useTrip(tripId);
  const { data: members = [] } = useTripMembers(tripId);
  const { data: user } = useUser();
  const memberOf = useMemberLookup(tripId);
  const [filters, setFilters] = useState(NO_FILTER);
  const totalDays = trip ? dayCount(trip.start_date, trip.end_date) : 0;

  const filtered = useMemo(() => {
    const dayOf = (v: Voucher) => (src ? voucherDay(v, src, totalDays) : null);
    return (vouchers ?? []).filter((v) => matchesFilters(v, filters, dayOf, FILTER_ALL));
  }, [vouchers, filters, src, totalDays]);
  const thumbKeys = filtered.flatMap((v) => (v.thumb_key ? [v.thumb_key] : []));
  const { data: urls = {} } = useVoucherUrls(tripId, thumbKeys);

  // 사람 필터는 나를 먼저
  const people = [...members].sort(
    (a, b) => Number(b.user_id === user?.id) - Number(a.user_id === user?.id),
  );
  return {
    isPending,
    total: vouchers?.length ?? 0,
    shown: filtered.length,
    groups: groupVouchers(filtered),
    filters,
    filtered:
      filters.who !== FILTER_ALL || filters.day !== FILTER_ALL || filters.group !== FILTER_ALL,
    patch: (next: Partial<VoucherFilters>) => setFilters((f) => ({ ...f, ...next })),
    reset: () => setFilters(NO_FILTER),
    options: {
      /** 멤버가 둘 이상일 때만 사람 필터를 보인다 */
      who:
        people.length >= 2
          ? people.map((m) => ({
              id: m.user_id,
              name: m.profile.display_name ?? "이름 없음",
              avatarUrl: m.profile.avatar_url,
            }))
          : null,
      day: trip ? dayOptions(trip.start_date, totalDays) : [],
      group: GROUP_OPTIONS,
    },
    /** 줄 보조 글 — 연결 이름 · 첫 번호 */
    subOf: (v: Voucher) => {
      const ref = voucherTarget(v);
      return voucherSubText(v, ref && src ? targetLabel(ref, src) : null);
    },
    ownersOf: (v: Voucher) => ownersText(v.owners, (id) => memberOf(id)?.name ?? null),
    thumbOf: (v: Voucher) => (v.thumb_key ? (urls[v.thumb_key] ?? null) : null),
  };
}

export type VoucherListState = ReturnType<typeof useVoucherList>;
