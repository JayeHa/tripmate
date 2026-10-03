import { ArrowLeft, X } from "lucide-react";

import { IconButton } from "@/shared/ui/icon-button";

import type { TripCreateState } from "../../model/use-trip-create";
import type { TitleComponent } from "../parts/title";

const COPY = {
  city: { title: "어디로 떠나시나요?", sub: "여러 도시를 함께 고를 수 있어요.", step: "1 / 2" },
  date: {
    title: "여행일정 등록",
    sub: "날짜에 맞춰 날씨와 여행 정보를 알려드려요.",
    step: "2 / 2",
  },
} as const;

type PcHeaderProps = {
  state: TripCreateState;
  onClose: () => void;
  Title: TitleComponent;
};

/** PC 모달 머리. 제목 · 단계 · 닫기, 날짜 단계에서는 ← (시안 6b · 6c) */
export function PcHeader({ state, onClose, Title }: PcHeaderProps) {
  const copy = COPY[state.step];
  return (
    <div className="flex shrink-0 items-center gap-3 px-7 pt-5.5 pb-3.5">
      {state.step === "date" && (
        <IconButton
          label="도시 다시 고르기"
          onClick={state.backToCity}
          disabled={state.locked}
          className="text-ink-900"
        >
          <ArrowLeft className="size-5.5" strokeWidth={2} />
        </IconButton>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.75">
        <Title className="text-[22px] font-extrabold tracking-[-0.02em] text-ink-900">
          {copy.title}
        </Title>
        <p className="text-sm text-ink-400">{copy.sub}</p>
      </div>
      <span className="text-[13px] font-bold text-ink-400">{copy.step}</span>
      <IconButton label="닫기" onClick={onClose} disabled={state.locked} className="text-ink-400">
        <X className="size-6" strokeWidth={2} />
      </IconButton>
    </div>
  );
}
