"use client";

import { useEffect, useState } from "react";

/** 「복사했어요」 를 보이는 시간 */
const COPIED_MS = 1400;

/**
 * 글을 클립보드에 복사하고, 복사했으면 잠깐(1.4초) true. 복사하지 못하면(권한 · 안전하지 않은 주소) 그대로 false
 */
export function useCopied() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(t);
  }, [copied]);
  return {
    copied,
    copy: (text: string) => {
      void navigator.clipboard?.writeText(text).then(
        () => setCopied(true),
        () => undefined,
      );
    },
  };
}
