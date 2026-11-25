import { ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { linkDomain, linkToneOf } from "../../lib/memo-link";
import type { PlaceLink } from "../../model/place";

/** 아이콘 칸 색 — 도메인마다 하나로 정해진다 */
const TONES = ["bg-[#11c1a9]", "bg-[#3a8bff]", "bg-[#f59e0b]", "bg-[#8b5cf6]", "bg-[#e5484d]"];

type MemoLinkIconProps = { domain: string; className?: string };

/** 링크 아이콘 칸 — 도메인 첫 글자(흰 15/900)를 색 바탕 위에. 파비콘은 바깥 요청이라 쓰지 않는다 */
export function MemoLinkIcon({ domain, className }: MemoLinkIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-button text-[15px] font-black text-white uppercase",
        TONES[linkToneOf(domain, TONES.length)],
        className,
      )}
    >
      {domain.charAt(0)}
    </span>
  );
}

type MemoLinkPreviewProps = { link: PlaceLink };

/**
 * 메모 카드의 링크 한 줄 — 아이콘 34 · 제목(12/800 말줄임) · 「🔗 도메인」 · ›. 누르면 새 탭(카드 열기와 따로).
 * 카드를 덮는 버튼 위에 올라와야 해서 relative z-1
 */
export function MemoLinkPreview({ link }: MemoLinkPreviewProps) {
  const domain = linkDomain(link.url);
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative z-1 flex items-center gap-2.25 rounded-memo border border-memo-link-line bg-white px-2 py-1.75"
    >
      <MemoLinkIcon domain={domain} className="size-8.5" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-xs font-extrabold text-ink-900">{link.title || domain}</span>
        <span className="truncate text-[11px] text-route-card-meta">🔗 {domain}</span>
      </span>
      <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-350" />
    </a>
  );
}
