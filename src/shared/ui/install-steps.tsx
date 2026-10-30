import { Check, type LucideIcon, Share, SquarePlus } from "lucide-react";

/** 공유 메뉴로 홈 화면에 추가하는 순서 — Safari 는 공유 버튼이 아래, iOS Chrome · Edge 는 주소창 오른쪽 */
const STEPS: Record<
  InstallStepsProps["share"],
  readonly { n: number; text: string; icon: LucideIcon }[]
> = {
  bottom: [
    { n: 1, text: "아래쪽 공유 버튼을 눌러요", icon: Share },
    { n: 2, text: "목록을 내려 「홈 화면에 추가」를 골라요", icon: SquarePlus },
    { n: 3, text: "오른쪽 위 「추가」를 눌러요", icon: Check },
  ],
  top: [
    { n: 1, text: "주소창 오른쪽 공유 버튼을 눌러요", icon: Share },
    { n: 2, text: "「홈 화면에 추가」를 골라요", icon: SquarePlus },
    { n: 3, text: "오른쪽 위 「추가」를 눌러요", icon: Check },
  ],
};

type InstallStepsProps = {
  /** 공유 버튼 자리 — Safari 는 아래(bottom), iOS Chrome · Edge 는 주소창 오른쪽(top) */
  share: "bottom" | "top";
};

/** iPhone 에서 홈 화면에 추가하는 3단계 카드 — 버튼으로 설치 창을 열 수 없어 브라우저 버튼을 짚어 준다 */
export function InstallSteps({ share }: InstallStepsProps) {
  return (
    <ol className="flex flex-col gap-2">
      {STEPS[share].map(({ n, text, icon: Icon }) => (
        <li key={n} className="flex items-center gap-3 rounded-card bg-surface-sunken px-3.5 py-3">
          <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-action text-[13px] font-extrabold text-on-action">
            {n}
          </span>
          <span className="flex-1 text-sm/normal text-ink-900">{text}</span>
          <Icon className="size-5 shrink-0 text-ink-700" aria-hidden />
        </li>
      ))}
    </ol>
  );
}
