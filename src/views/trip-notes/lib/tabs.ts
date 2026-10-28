import { Backpack, ListTodo, type LucideIcon, ShoppingBag, Ticket } from "lucide-react";

/** 노트 탭 — 바우처 · 체크리스트 · 준비물 · 쇼핑. 시안은 체크리스트가 먼저지만 현장에서 가장 자주 꺼내는 바우처를 앞에(사용자 결정) */
export const NOTE_TABS = ["voucher", "checklist", "pack", "shop"] as const;
export type NoteTab = (typeof NOTE_TABS)[number];

/** 탭 이름 · PC 메뉴 아이콘 */
export const NOTE_TAB_INFO: Record<NoteTab, { label: string; Icon: LucideIcon }> = {
  checklist: { label: "체크리스트", Icon: ListTodo },
  voucher: { label: "바우처", Icon: Ticket },
  pack: { label: "준비물", Icon: Backpack },
  shop: { label: "쇼핑", Icon: ShoppingBag },
};

/** 주소의 tab 값 → 탭. 없거나 모르는 값이면 첫 탭(바우처) */
export function parseNoteTab(value: string | null): NoteTab {
  return NOTE_TABS.find((t) => t === value) ?? "voucher";
}
