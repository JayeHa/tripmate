import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { NAV } from "@/shared/lib/nav-transition";
import { cn } from "@/shared/lib/utils";

/**
 * 모바일은 흰 칸을 굵은 회색 줄(8)로 나누고, PC 는 회색 바탕 위의 흰 카드(r12 · 테두리 · 옅은 그림자)
 */
const SHELL = {
  mobile: "border-t-8 border-surface-sunken",
  pc: "rounded-card border border-line-card shadow-[0_1px_6px_rgba(0,0,0,.05)]",
};

type BoardCardProps = {
  title: string;
  /** 제목 옆 회색 글자(개수 · 날짜) */
  count?: string;
  /** 오른쪽 위 파란 이동 링크(「노트 ›」) */
  link?: { label: string; href: string };
  layout: "mobile" | "pc";
  children: React.ReactNode;
};

/** 요약 탭 상태판의 카드 한 장 — 제목 15/800 · 회색 개수 · 오른쪽 링크, 아래 내용 */
export function BoardCard({ title, count, link, layout, children }: BoardCardProps) {
  return (
    <section
      aria-label={title}
      className={cn("flex flex-col gap-3 bg-white px-5 py-4", SHELL[layout])}
    >
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate text-[15px] font-extrabold text-ink-900">
          {title}
          {count && <span className="ml-1.5 font-semibold text-ink-400">{count}</span>}
        </h2>
        {link && (
          <Link
            href={link.href}
            transitionTypes={NAV.tab}
            className="flex items-center text-[13px] font-bold whitespace-nowrap text-brand-text"
          >
            {link.label}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

type BoardRowProps = {
  /** 왼쪽 표식(아이콘 칸 · 번호 원) */
  lead: React.ReactNode;
  title: string;
  sub: string;
  /** 오른쪽 끝(배지 · 날짜 · 버튼) */
  trail?: React.ReactNode;
  /** 있으면 줄 전체가 그 화면으로 가는 링크 */
  href?: string;
  /** 있으면 줄 전체가 버튼(미리 보기 열기). href 와 함께 쓰지 않는다 */
  onClick?: () => void;
};

/** 줄 전체를 누르는 영역 */
const HIT = "flex min-w-0 flex-1 items-center gap-3";

/** 상태판 카드 안의 한 줄 — 왼쪽 표식 · 제목 15/700 · 보조 12, 오른쪽 끝 */
export function BoardRow({ lead, title, sub, trail, href, onClick }: BoardRowProps) {
  const body = (
    <>
      {lead}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold text-ink-900">{title}</span>
        {sub && <span className="truncate text-xs text-ink-400">{sub}</span>}
      </div>
      {trail}
    </>
  );
  return <li className="flex min-h-11 items-center gap-3">{hitArea(body, href, onClick)}</li>;
}

/** 줄의 내용을 링크 · 버튼으로 감싼다 — 둘 다 없으면 그대로 */
function hitArea(body: React.ReactNode, href?: string, onClick?: () => void) {
  if (href)
    return (
      <Link href={href} transitionTypes={NAV.tab} className={HIT}>
        {body}
      </Link>
    );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cn(HIT, "cursor-pointer text-left")}>
        {body}
      </button>
    );
  return body;
}
