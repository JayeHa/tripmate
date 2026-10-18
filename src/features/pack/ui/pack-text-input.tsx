"use client";

import { useState } from "react";

type PackTextInputProps = {
  /** 글을 담았다(앞뒤 공백을 뺀 빈 글이 아닐 때만) */
  onSubmit: (text: string) => void;
  maxLength: number;
  placeholder: string;
  label: string;
  className: string;
  /** 글이 있을 때 오른쪽에 「추가」 버튼 */
  showButton?: boolean;
};

/**
 * Enter 로 담는 입력 칸 — 한글 조합 중 Enter 는 무시하고, 담으면 바로 비워 이어서 칠 수 있게 한다.
 * 빈 글(공백뿐)은 담지 않는다
 */
export function PackTextInput({
  onSubmit,
  maxLength,
  placeholder,
  label,
  className,
  showButton = false,
}: PackTextInputProps) {
  const [text, setText] = useState("");

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
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="done"
        className={className}
      />
      {showButton && text.trim() && (
        <button type="button" onClick={submit} className="shrink-0 text-sm font-bold text-primary">
          추가
        </button>
      )}
    </>
  );
}
