"use client";

import { useUser } from "@/entities/session";
import { useTrip } from "@/entities/trip";
import { useMemberLookup } from "@/entities/trip-member";
import {
  useVouchers,
  useVoucherUrls,
  type Voucher,
  voucherNumbers,
  voucherTarget,
} from "@/entities/voucher";
import { targetLabel, type TargetSources, useTargetSources } from "@/features/checklist";
import { numberLabel, sortNumbers } from "@/features/voucher";
import { dayCount } from "@/shared/lib/days";

import { ownersText, voucherDay } from "../lib/voucher-day";
import { fileInfo, voucherDateText } from "../lib/voucher-detail";

/**
 * 고른 바우처의 상세 — 목록 캐시에서 id 로 찾아 일행이 고친 것도 바로 보인다. 그사이 지워졌으면 voucher 가 null.
 * 연결 이름 · 날짜는 일정 · 항공편 · 숙소를 다 읽기 전에는 null
 */
export function useVoucherDetail(tripId: string, id: string | null) {
  const { data: vouchers } = useVouchers(tripId);
  const voucher = vouchers?.find((v) => v.id === id) ?? null;
  const src = useTargetSources(tripId);
  const { data: trip } = useTrip(tripId);
  const { data: user } = useUser();
  const memberOf = useMemberLookup(tripId);
  const thumbKeys = voucher?.thumb_key ? [voucher.thumb_key] : [];
  const { data: urls = {} } = useVoucherUrls(tripId, thumbKeys);
  if (!voucher) return null;
  return detailOf(voucher, {
    me: user?.id ?? null,
    nameOf: (uid) => memberOf(uid)?.name ?? null,
    src,
    startDate: trip?.start_date ?? null,
    totalDays: trip ? dayCount(trip.start_date, trip.end_date) : 0,
    thumb: voucher.thumb_key ? (urls[voucher.thumb_key] ?? null) : null,
  });
}

type DetailContext = {
  me: string | null;
  nameOf: (id: string) => string | null;
  src: TargetSources | null;
  /** 여행 첫날, 아직 못 읽었으면 null */
  startDate: string | null;
  totalDays: number;
  thumb: string | null;
};

/** 상세에 그릴 글 — 파일 정보 · 주인 · 번호 줄(보이는 순서 · 라벨) · 연결 이름 · 날짜 */
function detailOf(voucher: Voucher, ctx: DetailContext) {
  const { me, nameOf, src, startDate } = ctx;
  const ref = voucherTarget(voucher);
  const day = src ? voucherDay(voucher, src, ctx.totalDays) : null;
  return {
    voucher,
    thumb: ctx.thumb,
    fileInfo: fileInfo(voucher),
    owners: ownersText(voucher.owners, nameOf),
    numbers: withKeys(sortNumbers(voucherNumbers(voucher), me)).map((n) => ({
      ...n,
      text: numberLabel(n, me, nameOf),
      mine: me !== null && n.owner === me,
    })),
    target: ref && src ? targetLabel(ref, src) : null,
    date: startDate ? voucherDateText(voucher, day, startDate) : null,
  };
}

/** 번호 줄마다 그릴 때 쓸 key — 같은 줄이 겹치면 몇 번째인지 붙인다 */
function withKeys<T extends { label: string; owner: string; value: string }>(rows: T[]) {
  const seen = new Map<string, number>();
  return rows.map((n) => {
    const base = `${n.label}|${n.owner}|${n.value}`;
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { ...n, key: `${base}|${count}` };
  });
}

export type VoucherDetail = NonNullable<ReturnType<typeof useVoucherDetail>>;
