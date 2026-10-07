import { CloudOff, X } from "lucide-react";

import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

type EditorHeaderProps = {
  title: string;
  /** 페이지의 뒤로 가기. 있으면 페이지 머리(←) */
  back?: string;
  /** 창이면 ✕ — 폼이 없는 화면(실패 · 못 찾음)에서도 창을 닫을 수 있게 */
  onClose: () => void;
};

/** 폼 대신 안내만 보일 때의 머리 — 페이지면 ← 뒤로, 창이면 폼과 같은 ✕ + 제목 */
export function EditorHeader({ title, back, onClose }: EditorHeaderProps) {
  if (back) return <AppHeader title={title} back={back} />;
  return (
    <header className="flex h-14 shrink-0 items-center gap-3.5 px-4.5">
      <button type="button" aria-label="닫기" onClick={onClose} className="flex text-ink-900">
        <X className="size-6.5" />
      </button>
      <h1 className="flex-1 text-[17px] font-bold text-ink-900">{title}</h1>
    </header>
  );
}

type FormLoadErrorProps = EditorHeaderProps & { onRetry: () => void };

/** 비용 화면에 필요한 것(여행 · 멤버 · 정산 인원 · 일정)을 읽지 못했을 때 — 빈 화면 대신 안내와 「다시 시도」 */
export function FormLoadError({ onRetry, ...header }: FormLoadErrorProps) {
  return (
    <>
      <EditorHeader {...header} />
      <EmptyState
        icon={CloudOff}
        title="비용 화면을 불러오지 못했어요"
        description="인터넷 연결을 확인하고 다시 시도해 주세요."
        action={
          <Button variant="outline" size="form" onClick={onRetry}>
            다시 시도
          </Button>
        }
        className="flex-1 justify-center py-20"
      />
    </>
  );
}
