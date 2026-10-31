"use client";

import { useState } from "react";

import { useAddChecklistItem } from "@/entities/checklist";
import { saveErrorText } from "@/shared/api/sync";

/**
 * 체크리스트 빠른 추가 — 제목만 쳐서 Enter · 「추가」 로 「해야 할 것」 에 담는다. 한글 조합 중 Enter 는 무시한다.
 * 보낸 뒤 바로 칸을 비워 다음 항목을 이어 칠 수 있게 하고, 실패하면 친 글을 돌려놓는다.
 * 결과는 호출마다 받는다 — `mutate` 에 넘긴 콜백은 마지막 호출에만 실행돼서, 이어 담다 앞 항목이 실패하면 알림 없이 사라진다.
 * 여러 개가 실패하면 칸이 비어 있을 때만 돌려놓는다(지금 치는 글을 덮지 않게)
 */
export function useQuickAdd(tripId: string, onToast: (text: string) => void) {
  const [text, setText] = useState("");
  const add = useAddChecklistItem(tripId);

  /** 담는다 — 빈 글이면 아무것도 하지 않는다 */
  function submit() {
    const title = text.trim();
    if (!title) return;
    setText("");
    add.mutateAsync(title).then(
      () => onToast("해야 할 것에 담았어요"),
      (e: unknown) => {
        setText((now) => now || title);
        onToast(saveErrorText(e, "담지 못했어요. 다시 시도해 주세요"));
      },
    );
  }

  return {
    text,
    setText,
    submit,
    /** Enter — 한글 조합 중(isComposing)이면 무시 */
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        submit();
      }
    },
  };
}
