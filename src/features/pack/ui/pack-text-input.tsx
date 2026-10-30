"use client";

import { useState } from "react";

import { useMediaQuery } from "@/shared/lib/use-media-query";
import { QuickSubmitButton } from "@/shared/ui/quick-submit-button";

type PackTextInputProps = {
  /** 글을 담았다(앞뒤 공백을 뺀 빈 글이 아닐 때만) */
  onSubmit: (text: string) => void;
  maxLength: number;
  placeholder: string;
  /** PC 에서만 쓸 안내 — 모바일은 「등록」 버튼이 있어 「후 엔터」 를 뺀다. 없으면 placeholder */
  pcPlaceholder?: string;
  label: string;
  className: string;
  /** 오른쪽 「등록」 크기(QuickSubmitButton) */
  button: "md" | "sm";
};

/**
 * Enter · 「등록」 으로 담는 입력 칸 — 한글 조합 중 Enter 는 무시하고, 담으면 바로 비워 이어서 칠 수 있게 한다.
 * 빈 글(공백뿐)은 담지 않는다. 「등록」 은 모바일에서 늘, PC 는 글이 있을 때만 보인다
 */
export function PackTextInput({
  onSubmit,
  maxLength,
  placeholder,
  pcPlaceholder,
  label,
  className,
  button,
}: PackTextInputProps) {
  const [text, setText] = useState("");
  const desktop = useMediaQuery("(min-width: 1024px)");

  /** 담는다 */
  function submit() {
    const value = text.trim();
    if (!value) return;
    setText("");
    onSubmit(value);
  }

  return (
    <>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        maxLength={maxLength}
        placeholder={(desktop && pcPlaceholder) || placeholder}
        aria-label={label}
        enterKeyHint="done"
        className={className}
      />
      <QuickSubmitButton active={!!text.trim()} onSubmit={submit} size={button} />
    </>
  );
}
