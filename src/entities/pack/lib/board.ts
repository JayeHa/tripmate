import type { PackGroup, PackItem, PackKind, PackLists, PackPreset } from "../model/types";

/** 그룹 하나와 그 항목 — 챙긴 수 · 전체 수 */
export type PackGroupView = { group: PackGroup; items: PackItem[]; done: number; total: number };

/** 한 종류의 목록 — 그룹(순서대로)과 전체 챙긴 수 · 전체 수 */
export type PackBoard = { groups: PackGroupView[]; done: number; total: number };

/** 챙겼는가 — 체크한 시각이 있으면(체크한 사람이 나가 비어도) */
export function isChecked(item: Pick<PackItem, "checked_at">): boolean {
  return item.checked_at !== null;
}

/** 한 종류(준비물 · 쇼핑)의 목록 — 받은 순서(position · 넣은 순서)를 그대로 두고 그룹마다 항목을 묶는다. 체크해도 자리는 그대로 */
export function packBoard(lists: PackLists, kind: PackKind): PackBoard {
  const groups = lists.groups
    .filter((g) => g.kind === kind)
    .map((group) => {
      const items = lists.items.filter((i) => i.group_id === group.id);
      return { group, items, done: items.filter(isChecked).length, total: items.length };
    });
  return {
    groups,
    done: groups.reduce((n, g) => n + g.done, 0),
    total: groups.reduce((n, g) => n + g.total, 0),
  };
}

/** 맨 뒤 순서 — 가장 큰 position + 1, 없으면 0 */
export function nextPosition(rows: Pick<PackGroup, "position">[]): number {
  return rows.reduce((max, r) => Math.max(max, r.position + 1), 0);
}

/** 탭 · 메뉴 숫자 — 「12/30」 */
export function packCountText(board: Pick<PackBoard, "done" | "total">): string {
  return `${board.done}/${board.total}`;
}

/**
 * 「기본 목록으로 시작」 — 어느 나라든 맞는 것만(2026-10-19 사용자 결정, 시안은 그룹 이름만 정했다).
 * 이모지는 이름 앞에 그대로 넣는다(시안)
 */
export const PACK_PRESETS: PackPreset[] = [
  { name: "📄 서류 · 결제", items: ["여권", "해외 결제 카드", "현금", "항공권 · 예약 확인서"] },
  { name: "🔌 전자기기", items: ["휴대폰 충전기", "보조배터리", "멀티 어댑터", "e심 · 유심"] },
  { name: "👕 옷", items: ["상의", "하의", "속옷", "양말", "잠옷"] },
  { name: "🧴 세면 · 생활", items: ["칫솔 · 치약", "상비약", "선크림", "세면도구"] },
];
