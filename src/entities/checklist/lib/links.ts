import type { Json } from "@/shared/api/supabase/database.types";

import type { ChecklistLink } from "../model/types";

/**
 * jsonb 링크 칸을 안전하게 읽는다 — 주소가 없는 줄 · 모양이 다른 값 · http(s) 가 아닌 주소는 뺀다.
 * 폼은 http(s) 만 저장하지만 API 로 직접 넣은 값이 읽기 화면의 href 로 그려지지 않게 여기서도 거른다
 */
export function checklistLinksOf(links: Json): ChecklistLink[] {
  if (!Array.isArray(links)) return [];
  return links.flatMap((l) =>
    l && typeof l === "object" && !Array.isArray(l) && typeof l.url === "string" && isHttp(l.url)
      ? [{ title: typeof l.title === "string" ? l.title : "", url: l.url }]
      : [],
  );
}

/** http(s) 주소인지 */
function isHttp(url: string): boolean {
  return /^https?:\/\//i.test(url.trim());
}
