import { Accessibility, type DragDropManager } from "@dnd-kit/dom";
import { isSortable } from "@dnd-kit/react/sortable";

import {
  DRAG_INSTRUCTIONS,
  droppedText,
  movedText,
  pickedUpText,
} from "@/shared/lib/drag-announcements";

/** 끌고 있는 것 */
type Source = DragDropManager["dragOperation"]["source"];

/** 끄는 항목의 이름과 지금 자리(1부터). 정렬 목록 밖이면 null */
function describe(source: Source): { name: string; position: number } | null {
  if (!source || !isSortable(source)) return null;
  const name = (source.data as { name?: string } | undefined)?.name ?? "항목";
  return { name, position: source.index + 1 };
}

/** 접근성 플러그인 옵션. configure 는 옵션을 느슨하게(Record) 받아서 생성자 쪽 타입을 쓴다 */
type AccessibilityOptions = NonNullable<ConstructorParameters<typeof Accessibility>[1]>;

/** 한국어 안내 */
const OPTIONS: AccessibilityOptions = {
  screenReaderInstructions: { draggable: DRAG_INSTRUCTIONS },
  announcements: {
    dragstart: ({ operation }) => {
      const it = describe(operation.source);
      return it ? pickedUpText(it.name, it.position) : undefined;
    },
    dragover: ({ operation }) => {
      const it = describe(operation.source);
      return it ? movedText(it.name, it.position) : undefined;
    },
    dragend: ({ operation, canceled }) => {
      const it = describe(operation.source);
      return it ? droppedText(it.name, it.position, canceled) : undefined;
    },
  },
};

/** 기본 접근성 플러그인을 한국어 안내로 바꾼 것 */
const KoreanAccessibility = Accessibility.configure(OPTIONS);

/**
 * DragDropProvider 의 plugins — 기본 묶음에서 접근성만 한국어로 갈아 끼운다(자동 스크롤 · 커서 등은 그대로).
 * 모듈 상수라 렌더마다 플러그인이 다시 등록되지 않는다
 */
export function koreanPlugins<T>(defaults: T[]): T[] {
  return defaults.map((p) => (p === Accessibility ? (KoreanAccessibility as T) : p));
}
