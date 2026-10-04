import { Link as LinkIcon, MapPin } from "lucide-react";

import { withKeys } from "@/shared/lib/keys";

import type { TimelineLink } from "../../lib/timeline";

type LinkChipsProps = { links: TimelineLink[] };

/** 구글맵 1개 + 추가 링크 N개 */
export function LinkChips({ links }: LinkChipsProps) {
  if (links.length === 0) return null;
  return (
    <div className="mt-0.5 flex flex-wrap gap-1.5">
      {withKeys(links, (l) => `${l.title}:${l.url}`).map(({ key, value: link }) => (
        <a
          key={key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-7 max-w-full items-center gap-1 truncate rounded-full bg-surface-muted px-2.5 text-[13px] font-bold text-ink-700"
        >
          {link.gmap ? (
            <MapPin className="size-3.25 shrink-0 text-cat-food" />
          ) : (
            <LinkIcon className="size-3.25 shrink-0 text-ink-500" />
          )}
          <span className="truncate">{link.title}</span>
        </a>
      ))}
    </div>
  );
}
