import type { Tables } from "@/shared/api/supabase/database.types";

/** 일정의 다녀감 표시 — 다녀왔어요 · 패스(일정엔 넣었지만 가지 않았다) */
export type VisitMark = "visited" | "skipped";

/** 한 여행의 표시 — 일정 id → 표시. 표시 없는 일정은 아직 남은 곳이다 */
export type VisitMarks = Readonly<Record<string, VisitMark>>;

/** 다녀감 표시 한 줄(0083) — 일정 하나에 하나, 일행이 함께 쓴다 */
export type Visit = Omit<Tables<"schedule_visits">, "mark"> & { mark: VisitMark };

/** 표시 줄 → 일정 id 별 표시. 모르는 값은 뺀다 */
export function marksOf(visits: readonly Visit[]): VisitMarks {
  return Object.fromEntries(
    visits
      .filter((v) => v.mark === "visited" || v.mark === "skipped")
      .map((v) => [v.item_id, v.mark]),
  );
}
