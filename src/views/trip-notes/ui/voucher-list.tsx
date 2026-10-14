"use client";

import { ChevronRight, FileText, Plane, QrCode, Ticket } from "lucide-react";

import { isPdf, type Voucher, VOUCHER_GROUP_LABEL } from "@/entities/voucher";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { EmptyState } from "@/shared/ui/empty-state";
import { FilterSelect } from "@/shared/ui/filter-select";
import { Skeleton } from "@/shared/ui/skeleton";

import type { VoucherListState } from "../model/use-voucher-list";

type VoucherListProps = { list: VoucherListState };

/**
 * 노트 › 바우처 목록 — 필터 줄(사람 · 날짜 · 종류, 걸리면 「초기화」 와 「N개 중 M개」),
 * 묶음(항공편 · 숙소 · 일정 · 기타, 위에 8px 회색 띠)마다 가로형 줄. 비면 「바우처가 없어요」
 */
export function VoucherList({ list }: VoucherListProps) {
  if (list.isPending) {
    return (
      <div className="flex flex-col gap-2 bg-white px-5 pt-3">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
    );
  }
  return (
    <section aria-label="바우처" className="flex flex-1 flex-col bg-white pb-7">
      <FilterRow list={list} />
      {list.groups.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="바우처가 없어요"
          description="탑승권 · 입장권 · 예약 확인서를 올려 두세요"
          className="py-20"
        />
      ) : (
        list.groups.map((g) => (
          <div key={g.group} className="border-t-8 border-surface-sunken">
            <h3 className="px-5 pt-3 pb-1 text-[13px] font-semibold text-ink-450">
              {VOUCHER_GROUP_LABEL[g.group]}
            </h3>
            <ul>
              {g.items.map((v) => (
                <VoucherRow key={v.id} voucher={v} list={list} />
              ))}
            </ul>
          </div>
        ))
      )}
    </section>
  );
}

/** 필터 줄 — 칩 셋(사람은 멤버가 둘 이상일 때만) · 「초기화」, 걸렸으면 아래 「N개 중 M개」 */
function FilterRow({ list }: VoucherListProps) {
  const { filters, options, patch } = list;
  return (
    <div className="flex flex-col gap-1.5 px-5 pt-3 pb-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {options.who && (
          <FilterSelect
            label="사람"
            allLabel="사람 전체"
            value={filters.who}
            onChange={(who) => patch({ who })}
            options={options.who.map((m) => ({
              value: m.id,
              label: m.name,
              icon: <MemberAvatar name={m.name} url={m.avatarUrl} className="size-6" />,
              chipIcon: <MemberAvatar name={m.name} url={m.avatarUrl} className="size-4.5" />,
            }))}
          />
        )}
        <FilterSelect
          label="날짜"
          allLabel="날짜 전체"
          value={filters.day}
          onChange={(day) => patch({ day })}
          options={options.day}
        />
        <FilterSelect
          label="종류"
          allLabel="종류 전체"
          value={filters.group}
          onChange={(group) => patch({ group })}
          options={options.group}
        />
        {list.filtered && (
          <button
            type="button"
            onClick={list.reset}
            className="px-1.5 text-[13px] font-bold text-ink-400"
          >
            초기화
          </button>
        )}
      </div>
      {list.filtered && (
        <span className="text-xs text-ink-400">
          {list.total}개 중 {list.shown}개
        </span>
      )}
    </div>
  );
}

type VoucherRowProps = { voucher: Voucher; list: VoucherListState };

/** 줄(P5 가로형) — 썸네일 48 · r8(없으면 아이콘) · 제목 15/700 · 보조 12 · 주인 12/700 블루 · › */
function VoucherRow({ voucher: v, list }: VoucherRowProps) {
  const thumb = list.thumbOf(v);
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-button bg-surface-muted">
        {thumb ? (
          // 서명 주소라 next/image 최적화를 거치지 않는다
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="" className="size-full object-cover" />
        ) : (
          <FallbackIcon voucher={v} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold text-ink-900">{v.title}</span>
        <span className="truncate text-xs text-ink-400">{list.subOf(v)}</span>
        <span className="truncate text-xs font-bold text-primary">{list.ownersOf(v)}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-line-dashed" aria-hidden="true" />
    </li>
  );
}

type FallbackIconProps = { voucher: Voucher };

/** 썸네일이 없을 때 — PDF 는 문서, 항공편 연결은 비행기, 그 밖은 QR */
function FallbackIcon({ voucher: v }: FallbackIconProps) {
  const className = "size-5.5 text-ink-350";
  if (isPdf(v)) return <FileText className={className} aria-hidden="true" />;
  if (v.flight_id) return <Plane className={className} aria-hidden="true" />;
  return <QrCode className={className} aria-hidden="true" />;
}

type MemberAvatarProps = { name: string; url: string | null; className: string };

/** 멤버 아바타 — 사진, 없으면 이름 첫 글자 */
function MemberAvatar({ name, url, className }: MemberAvatarProps) {
  return (
    <Avatar className={className}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback className="bg-primary font-extrabold text-white">
        {name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  );
}
