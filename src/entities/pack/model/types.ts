import type { Tables } from "@/shared/api/supabase/database.types";

/** 목록 종류 — 준비물 · 쇼핑(같은 모양, 문구 · 쇼핑 사진만 다르다) */
export type PackKind = "pack" | "shop";

/** 그룹 한 줄 */
export type PackGroup = Tables<"pack_groups">;

/** 항목 한 줄 — 챙김은 checked_at 이 기준(checked_by 는 체크한 사람, 나간 멤버면 null) */
export type PackItem = Tables<"pack_items">;

/** 여행의 준비물 · 쇼핑 — 두 종류를 함께 읽는다(순서대로) */
export type PackLists = { groups: PackGroup[]; items: PackItem[] };

/** 「기본 목록으로 시작」 의 그룹 하나 */
export type PackPreset = { name: string; items: string[] };
