import { Button } from "@/shared/ui/button";

type ExistingFooterProps = {
  /** 「이 장소로 day 2에 담기」 처럼 이미 있는 장소를 쓰는 버튼 글자 */
  attachLabel: string;
  saving: boolean;
  onAttach: () => void;
  onRegisterNew: () => void;
};

/** ① 에서 고른 곳이 이미 있는 장소일 때의 아래 버튼 — 그 장소를 쓰기 · 「새로 등록할래요」 */
export function ExistingFooter({
  attachLabel,
  saving,
  onAttach,
  onRegisterNew,
}: ExistingFooterProps) {
  return (
    <>
      <Button
        size="lg"
        className="h-13 w-full text-base font-bold"
        disabled={saving}
        onClick={onAttach}
      >
        {attachLabel}
      </Button>
      <button
        type="button"
        onClick={onRegisterNew}
        disabled={saving}
        className="h-9 text-sm font-semibold text-ink-500 disabled:opacity-40"
      >
        새로 등록할래요
      </button>
    </>
  );
}
