"use client";

import { Dialog, DialogContent } from "@/shared/ui/dialog";

type FlowDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 1024px 아래에서 그릴 전체 화면 레이아웃 */
  mobile: React.ReactNode;
  /** 1024px 이상에서 그릴 가운데 모달 레이아웃 */
  pc: React.ReactNode;
};

/**
 * 여러 단계짜리 흐름(여행 만들기·기간 수정)의 다이얼로그 껍데기.
 * PC 는 가운데 760×660(창이 낮으면 줄고 본문이 안에서 스크롤), 1024px 아래는 전체 화면.
 * 두 레이아웃을 CSS 로 갈라 함께 그리므로, 상태는 감싸는 쪽이 하나만 들고 둘에 넘긴다.
 */
export function FlowDialog({ open, onOpenChange, mobile, pc }: FlowDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 h-dvh w-full max-w-none translate-0 gap-0 overflow-hidden rounded-none bg-white p-0 shadow-sheet ring-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-[min(660px,calc(100dvh-2rem))] lg:w-190 lg:max-w-190 lg:-translate-1/2 lg:rounded-sheet"
      >
        {/* DialogContent 가 grid 라 자식이 min-width:auto 로 내용 폭만큼 커진다.
            줄바꿈 없는 칩 줄 같은 것이 모달을 화면 밖으로 밀지 않게 min-w-0 으로 묶는다 */}
        <div className="flex h-full min-h-0 min-w-0 flex-col lg:hidden">{mobile}</div>
        <div className="hidden h-full min-h-0 min-w-0 lg:block">{pc}</div>
      </DialogContent>
    </Dialog>
  );
}
