import type { Json } from "@/shared/api/supabase/database.types";

import type { ChecklistLink } from "../model/types";

/** jsonb 링크 칸을 안전하게 읽는다 — 주소가 없는 줄 · 모양이 다른 값은 뺀다 */
export function checklistLinksOf(links: Json): ChecklistLink[] {
  if (!Array.isArray(links)) return [];
  return links.flatMap((l) =>
    l && typeof l === "object" && !Array.isArray(l) && typeof l.url === "string" && l.url
      ? [{ title: typeof l.title === "string" ? l.title : "", url: l.url }]
      : [],
  );
}
