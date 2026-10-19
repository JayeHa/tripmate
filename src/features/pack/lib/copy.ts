import type { PackKind } from "@/entities/pack";

/** 종류마다 다른 글 — 준비물은 「챙김」, 쇼핑은 「구매」(시안). 화면 모양은 같다 */
export const PACK_COPY: Record<
  PackKind,
  { done: string; emptyTitle: string; emptyText: string; listLabel: string }
> = {
  pack: {
    done: "챙김",
    emptyTitle: "준비물을 정리해 보세요",
    emptyText: "자주 챙기는 것으로 시작하거나 빈 목록에 직접 그룹을 만들어요",
    listLabel: "준비물",
  },
  shop: {
    done: "구매",
    emptyTitle: "살 것을 정리해 보세요",
    emptyText: "그룹을 만들고 살 것을 담아요",
    listLabel: "쇼핑",
  },
};

/** 그룹 이름 최대 길이(DB 검사와 같다) */
export const GROUP_NAME_MAX = 40;
/** 항목 이름 최대 길이(DB 검사와 같다) */
export const ITEM_NAME_MAX = 100;
