import {
  type ChecklistFields,
  type ChecklistItem,
  checklistLinksOf,
  type ChecklistStatus,
  type ChecklistTargetRef,
  targetKey,
} from "@/entities/checklist";
import type { LinkDraft } from "@/shared/ui/link-rows";

/** 제목 · 메모 최대 글자(DB 검사와 같다) */
export const TITLE_MAX = 100;
export const BODY_MAX = 2000;

/** 추가 · 편집 창의 값 — 입력 칸이 다루는 그대로. 저장할 때 toChecklistFields 로 바꾼다 */
export type ChecklistFormValues = {
  status: ChecklistStatus;
  title: string;
  /** 「YYYY-MM-DD」 또는 ""(없음) */
  due: string;
  body: string;
  links: LinkDraft[];
  pinned: boolean;
  /** 연결된 일정 · 항공편 · 숙소 — 고른 순서대로 */
  targets: ChecklistTargetRef[];
};

/** 새 항목 — 「해야 할 것」, 빠른 추가 바에 치던 제목을 그대로 가져온다 */
export function blankChecklistForm(title: string): ChecklistFormValues {
  return {
    status: "todo",
    title: title.trim(),
    due: "",
    body: "",
    links: [],
    pinned: false,
    targets: [],
  };
}

/** 저장된 항목과 그 연결을 폼 값으로 */
export function checklistFormFrom(
  item: ChecklistItem,
  targets: ChecklistTargetRef[],
): ChecklistFormValues {
  return {
    status: item.status as ChecklistStatus,
    title: item.title,
    due: item.due_date ?? "",
    body: item.body,
    links: checklistLinksOf(item.links),
    pinned: item.pinned_by !== null,
    targets,
  };
}

export type ChecklistPayload = { ok: true; fields: ChecklistFields } | { ok: false; error: string };

export type ChecklistPatchResult =
  { ok: true; patch: Partial<ChecklistFields> } | { ok: false; error: string };

/** http(s) 링크인지 */
const isHttp = (url: string) => /^https?:\/\//i.test(url);

/** 폼 값을 저장 모양으로(검사 없이) — 앞뒤 공백 · 빈 링크 줄을 버리고, 고정하면 나(userId)를 남긴다 */
function normalize(v: ChecklistFormValues, userId: string): ChecklistFields {
  return {
    status: v.status,
    title: v.title.trim().slice(0, TITLE_MAX),
    due_date: v.due || null,
    body: v.body.trim().slice(0, BODY_MAX),
    links: v.links.map((l) => ({ title: l.title.trim(), url: l.url.trim() })).filter((l) => l.url),
    pinned_by: v.pinned ? userId : null,
  };
}

/** 새 항목의 저장 칸. 제목이 비었거나 링크 주소가 http(s) 가 아니면 문구를 돌려준다 */
export function toChecklistFields(v: ChecklistFormValues, userId: string): ChecklistPayload {
  const fields = normalize(v, userId);
  if (!fields.title) return { ok: false, error: "제목을 입력해 주세요" };
  if (fields.links.some((l) => !isHttp(l.url))) {
    return { ok: false, error: "링크 주소는 http:// 나 https:// 로 시작해야 해요" };
  }
  return { ok: true, fields };
}

/**
 * 편집 저장 — 연 때(initial)와 **달라진 칸만**. 창을 연 사이 목록 체크박스 · 일행이 바꾼 상태 · 고정을
 * 연 때 값으로 덮지 않게. 고정은 켜고 끈 것만 보낸다(이미 고정된 항목은 처음 고정한 사람이 남는다).
 * 바뀐 칸이 없으면 빈 patch
 */
export function toChecklistPatch(
  v: ChecklistFormValues,
  initial: ChecklistFormValues,
  userId: string,
): ChecklistPatchResult {
  const result = toChecklistFields(v, userId);
  if (!result.ok) return result;
  const before = normalize(initial, userId);
  const patch: Partial<Record<keyof ChecklistFields, unknown>> = {};
  for (const key of Object.keys(result.fields) as (keyof ChecklistFields)[]) {
    if (JSON.stringify(result.fields[key]) !== JSON.stringify(before[key])) {
      patch[key] = result.fields[key];
    }
  }
  return { ok: true, patch: patch as Partial<ChecklistFields> };
}

/** 연결 바꾼 것 — 연 때(before)에 없던 대상은 add, 빠진 대상은 remove */
export function targetChanges(
  now: ChecklistTargetRef[],
  before: ChecklistTargetRef[],
): { add: ChecklistTargetRef[]; remove: ChecklistTargetRef[] } {
  const nowKeys = new Set(now.map(targetKey));
  const beforeKeys = new Set(before.map(targetKey));
  return {
    add: now.filter((t) => !beforeKeys.has(targetKey(t))),
    remove: before.filter((t) => !nowKeys.has(targetKey(t))),
  };
}
