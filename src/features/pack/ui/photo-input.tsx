"use client";

type PhotoInputProps = { onPick: (file: File) => void; disabled?: boolean };

/**
 * 사진 고르기 — label 안에 숨겨 두는 파일 칸. 고른 뒤 값을 비워 같은 사진을 다시 골라도 바뀌게 한다.
 * 줄 · 시트 · 전체 화면이 함께 쓴다
 */
export function PhotoInput({ onPick, disabled = false }: PhotoInputProps) {
  return (
    <input
      type="file"
      accept="image/*"
      disabled={disabled}
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) onPick(file);
      }}
    />
  );
}
