import type { PackKind } from "@/entities/pack";

/** 종류마다 다른 글 — 준비물은 「챙김」, 쇼핑은 「구매」(시안). 화면 모양은 같다 */
export const PACK_COPY: Record<
  PackKind,
  {
    done: string;
    emptyTitle: string;
    emptyText: string;
    listLabel: string;
    /** 상세 시트 제목 */
    sheetTitle: string;
    memoLabel: string;
    memoPlaceholder: string;
    /** 상세의 챙김 줄 — 켜짐 · 꺼짐 */
    checkedLabel: string;
    uncheckedLabel: string;
    /** 「모두 해제」 확인 문구의 「챙긴 항목」 */
    checkedItems: string;
  }
> = {
  pack: {
    done: "챙김",
    sheetTitle: "챙길 것",
    memoLabel: "메모",
    memoPlaceholder: "예) 위탁 불가, 기내만",
    checkedLabel: "챙겼어요",
    uncheckedLabel: "아직 안 챙겼어요",
    checkedItems: "챙긴 항목",
    emptyTitle: "준비물을 정리해 보세요",
    emptyText: "자주 챙기는 것으로 시작하거나 빈 목록에 직접 그룹을 만들어요",
    listLabel: "준비물",
  },
  shop: {
    done: "구매",
    sheetTitle: "살 것",
    memoLabel: "어디서 · 메모",
    memoPlaceholder: "예) 돈키호테 · 딸기맛 2박스",
    checkedLabel: "샀어요",
    uncheckedLabel: "아직 안 샀어요",
    checkedItems: "산 항목",
    emptyTitle: "살 것을 정리해 보세요",
    emptyText: "그룹을 만들고 살 것을 담아요",
    listLabel: "쇼핑",
  },
};

/** 그룹 이름 최대 길이(DB 검사와 같다) */
export const GROUP_NAME_MAX = 40;
/** 항목 이름 최대 길이(DB 검사와 같다) */
export const ITEM_NAME_MAX = 100;
/** 항목 메모 최대 길이(DB 검사와 같다) */
export const ITEM_MEMO_MAX = 200;
