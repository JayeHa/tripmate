import { Link as LinkIcon, Star } from "lucide-react";

import { withKeys } from "@/shared/lib/keys";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

import type { Memo, MemoAuthor } from "../model/memo";
import { linkListOf } from "../model/place";

type MemoCardProps = {
  memo: Memo;
  author: MemoAuthor | null;
  /** 누르면 고치기(일정 상세). 없으면 눌러도 반응하지 않는다(타임라인) */
  onClick?: () => void;
};

/** 「10.31 13:20」 — 메모를 쓴 시각(기기 시간대) */
export function memoWhen(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}.${d.getDate()} ${hh}:${mm}`;
}

/**
 * 메모 하나 — 작성자 아바타 · (★ 중요) · 쓴 시각, 본문(줄바꿈 유지), 링크 칩.
 * 중요 메모는 연주황 바탕 · 굵은 주황 글씨로 구분한다. 작성자를 모르면(나간 멤버 · 지운 계정 · 예전 데이터) 아바타를 그리지 않는다
 */
export function MemoCard({ memo, author, onClick }: MemoCardProps) {
  const links = linkListOf(memo.links);
  const body = (
    <>
      <span className="flex items-center gap-1.5">
        {author && (
          <Avatar className="size-4.5">
            <AvatarImage src={author.avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="text-[10px]">{author.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
        )}
        {memo.starred && (
          <span className="flex items-center gap-0.5 text-[11px] font-extrabold text-important-text">
            <Star className="size-3 fill-current" />
            중요
          </span>
        )}
        <span className="text-xs text-ink-350">{memoWhen(memo.created_at)}</span>
      </span>
      <span
        className={cn(
          "text-sm/normal whitespace-pre-line",
          memo.starred ? "font-semibold text-important-text" : "text-ink-800",
        )}
      >
        {memo.body}
      </span>
    </>
  );
  const className = cn(
    "flex flex-col gap-1.5 rounded-memo px-3.5 py-3 text-left",
    memo.starred ? "bg-important-bg" : "bg-surface-memo",
  );
  return (
    <div className="flex flex-col gap-1.5">
      {onClick ? (
        <button type="button" onClick={onClick} className={className}>
          {body}
        </button>
      ) : (
        <div className={className}>{body}</div>
      )}
      {links.length > 0 && (
        <span className="flex flex-wrap gap-1.5">
          {withKeys(links, (l) => `${l.title}:${l.url}`).map(({ key, value: l }) => (
            <a
              key={key}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6.5 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-xs font-semibold text-ink-700"
            >
              <LinkIcon className="size-3 text-ink-500" />
              {l.title || "링크"}
            </a>
          ))}
        </span>
      )}
    </div>
  );
}
