import { CloudOff } from "lucide-react";

import { AppHeader } from "@/shared/ui/app-header";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";

type FormLoadErrorProps = {
  title: string;
  /** 머리의 뒤로 가기. 없으면 머리를 그리지 않는다(모달 — 창의 ✕ 가 대신한다) */
  back?: string;
  onRetry: () => void;
};

/** 비용 화면에 필요한 것(여행 · 멤버 · 정산 인원)을 읽지 못했을 때 — 빈 화면 대신 안내와 「다시 시도」 */
export function FormLoadError({ title, back, onRetry }: FormLoadErrorProps) {
  return (
    <>
      {back && <AppHeader title={title} back={back} />}
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
