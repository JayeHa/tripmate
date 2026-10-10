import { Camera } from "lucide-react";

import { initialOfName } from "@/entities/session";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";

type AvatarPickerProps = {
  /** 보이는 사진 주소. null 이면 이니셜 */
  src: string | null;
  name: string;
  /** 사진을 바꿀 수 있다 — 둘러보기(익명) 계정은 false(카메라 배지 없이 그림만) */
  editable: boolean;
  canReset: boolean;
  /** 사진을 줄이는 중 — 다시 고르지 못하게 */
  busy: boolean;
  onPick: (file: File) => void;
  onReset: () => void;
};

/**
 * 내 정보의 아바타 72 — 누르면 사진 고르기(오른쪽 아래 카메라 배지 28: 흰 원 · 회색 테두리 · 그림자, 아이콘 15).
 * 기본 사진이 아닌 것이 보이면 아래 「기본 이미지로」(13/600 회색 밑줄)
 */
export function AvatarPicker({
  src,
  name,
  editable,
  canReset,
  busy,
  onPick,
  onReset,
}: AvatarPickerProps) {
  const avatar = (
    <Avatar className="size-18">
      {src && <AvatarImage src={src} alt="" />}
      <AvatarFallback>{initialOfName(name)}</AvatarFallback>
    </Avatar>
  );
  if (!editable) return avatar;
  return (
    <div className="flex flex-col items-center gap-2">
      <label className="relative cursor-pointer has-disabled:cursor-default">
        {avatar}
        <span className="absolute -right-0.5 -bottom-0.5 flex size-7 items-center justify-center rounded-full border border-line bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
          <Camera aria-hidden="true" className="size-3.75 text-ink-700" />
        </span>
        <input
          type="file"
          accept="image/*"
          aria-label="프로필 사진 바꾸기"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            // 같은 사진을 다시 골라도 바뀌게 비운다
            e.target.value = "";
            if (file) onPick(file);
          }}
          className="sr-only"
        />
      </label>
      {canReset && (
        <button
          type="button"
          onClick={onReset}
          className="text-[13px] font-semibold text-ink-400 underline"
        >
          기본 이미지로
        </button>
      )}
    </div>
  );
}
