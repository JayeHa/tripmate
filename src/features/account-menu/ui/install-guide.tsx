"use client";

import {
  ArrowLeft,
  CloudDownload,
  type LucideIcon,
  Share,
  Smartphone,
  SquarePlus,
} from "lucide-react";
import { useState } from "react";

import { promptInstall } from "@/shared/lib/install-prompt";
import { Button } from "@/shared/ui/button";
import { IconButton } from "@/shared/ui/icon-button";

import type { TitleComponent } from "./profile-editor";

/** iOS Safari 에서 홈 화면에 추가하는 순서 */
const IOS_STEPS: readonly { n: number; text: string; icon: LucideIcon }[] = [
  { n: 1, text: "Safari 아래쪽 공유 버튼을 눌러요", icon: Share },
  { n: 2, text: "「홈 화면에 추가」를 골라요", icon: SquarePlus },
  { n: 3, text: "홈 화면의 tripmate 아이콘으로 열어요", icon: Smartphone },
];

type InstallGuideProps = {
  mode: "ios" | "prompt";
  /** PC 드롭다운인가 — 설치 뒤 생기는 자리가 「앱 목록」 이다 */
  pc: boolean;
  Title: TitleComponent;
  onBack: () => void;
};

/**
 * 홈 화면에 앱 추가 — iOS 는 공유 메뉴 3단계, 설치 창을 띄울 수 있는 브라우저(Chrome · Edge)는 「설치하기」.
 * 맨 아래 안내 줄은 안 열어 본 화면까지 받는 「오프라인용으로 받기」 로 이끈다
 */
export function InstallGuide({ mode, pc, Title, onBack }: InstallGuideProps) {
  return (
    <>
      <div className="flex h-14 shrink-0 items-center gap-3 px-4.5">
        <IconButton label="뒤로" onClick={onBack} className="text-ink-900">
          <ArrowLeft className="size-5.5" strokeWidth={2} />
        </IconButton>
        <Title className="text-[17px] font-extrabold text-ink-900">홈 화면에 앱 추가</Title>
      </div>
      <div className="flex flex-col gap-3 px-5 pb-6">
        <p className="text-sm leading-[1.6] text-ink-500">
          앱처럼 바로 열리고, 저장해 둔 일정·바우처를 오프라인에서도 볼 수 있어요.
        </p>
        {mode === "ios" ? <IosSteps /> : <InstallButton pc={pc} onDone={onBack} />}
        <p className="mt-1 flex items-start gap-1.5 border-t border-surface-muted pt-3.5 text-xs leading-[1.55] text-ink-350">
          <CloudDownload className="mt-0.5 size-3.5 shrink-0" />
          <span className="text-pretty">
            안 열어 본 화면까지 받아 두려면 내 여행의 ⋯에서 「오프라인용으로 받기」를 눌러요
          </span>
        </p>
      </div>
    </>
  );
}

/** iOS 3단계 카드 */
function IosSteps() {
  return (
    <ol className="flex flex-col gap-3">
      {IOS_STEPS.map(({ n, text, icon: Icon }) => (
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

type InstallButtonProps = { pc: boolean; onDone: () => void };

/** 「설치하기」 — 브라우저의 설치 창을 띄우고, 설치하든 닫든 메뉴로 돌아간다(설치 창은 한 번만 띄울 수 있다) */
function InstallButton({ pc, onDone }: InstallButtonProps) {
  const [busy, setBusy] = useState(false);

  /** 설치 창을 띄운다 */
  async function install() {
    setBusy(true);
    await promptInstall().catch(() => false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-2 pt-1">
      <Button size="cta" className="w-full" disabled={busy} onClick={() => void install()}>
        설치하기
      </Button>
      <span className="text-center text-xs text-ink-400">
        {pc
          ? "설치하면 tripmate가 앱 목록에 생겨요"
          : "설치하면 홈 화면에 tripmate 아이콘이 생겨요"}
      </span>
    </div>
  );
}
