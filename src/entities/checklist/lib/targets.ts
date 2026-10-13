import type { ChecklistTargetKind, ChecklistTargetRef, ChecklistTargetRow } from "../model/types";

/** 대상 종류마다 그 id 를 담는 칸 */
const COLUMN = {
  schedule_item: "schedule_item_id",
  flight: "flight_id",
  stay: "stay_id",
} as const satisfies Record<ChecklistTargetKind, keyof ChecklistTargetRow>;

/** 대상을 글자 하나로 — 같은 대상인지 비교 · 고르기 창의 줄 id. 「flight:…」 */
export function targetKey(ref: ChecklistTargetRef): string {
  return `${ref.kind}:${ref.id}`;
}

/** targetKey 를 되돌린다. 모르는 모양이면 null */
export function targetFromKey(key: string): ChecklistTargetRef | null {
  const at = key.indexOf(":");
  const kind = key.slice(0, at);
  const id = key.slice(at + 1);
  return at > 0 && id && kind in COLUMN ? { kind: kind as ChecklistTargetKind, id } : null;
}

/** 저장 함수(save_checklist_item)의 p_add · p_remove 한 줄 — `{ flight_id: … }` */
export function targetColumns(ref: ChecklistTargetRef): Record<string, string> {
  return { [COLUMN[ref.kind]]: ref.id };
}

/** 저장된 연결 줄 → 대상. 대상 칸이 하나도 없으면(DB 검사로 생기지 않는다) null */
function targetOfRow(row: ChecklistTargetRow): ChecklistTargetRef | null {
  for (const kind of Object.keys(COLUMN) as ChecklistTargetKind[]) {
    const id = row[COLUMN[kind]];
    if (id) return { kind, id };
  }
  return null;
}

/** 항목마다 연결 대상 — 연결한 순서대로 */
export function targetsByItem(rows: ChecklistTargetRow[]): Map<string, ChecklistTargetRef[]> {
  const out = new Map<string, ChecklistTargetRef[]>();
  for (const row of rows.toSorted((a, b) => a.created_at.localeCompare(b.created_at))) {
    const ref = targetOfRow(row);
    if (ref) out.set(row.item_id, [...(out.get(row.item_id) ?? []), ref]);
  }
  return out;
}
