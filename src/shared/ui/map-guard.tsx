"use client";

import { APILoadingStatus, useApiLoadingStatus } from "@vis.gl/react-google-maps";
import { CloudOff, MapPinOff } from "lucide-react";
import type { ReactNode } from "react";

import { useOnline } from "@/shared/lib/use-online";

type MapGuardProps = {
  /** 지도와 그 위에 얹는 것(핀 안내 · 버튼) — 지도를 그릴 수 없으면 통째로 안내로 바뀐다 */
  children: ReactNode;
};

/**
 * 구글 지도를 그릴 수 없으면 지도 대신 회색 칸 안내 — 오프라인이면 「오프라인에서는 지도를 볼 수 없어요」,
 * 지도 스크립트를 못 불렀으면(오프라인으로 앱을 열었음) 「다시 불러오기」.
 * 그냥 두면 구글 오류창(「Google 지도를 제대로 로드할 수 없습니다 · 이 웹사이트의 소유자이신가요?」)이 지도 칸에 보인다(#219).
 * 지도는 약관상 기기에 남기지 않아 오프라인이면 그릴 수 없다. 연결되면 지도를 다시 그린다.
 * 스크립트를 한 번 못 부르면 지도 라이브러리가 다시 부르지 않아서, 그때만 새로고침한다
 */
export function MapGuard({ children }: MapGuardProps) {
  const online = useOnline();
  const status = useApiLoadingStatus();
  if (!online) {
    return <MapNotice icon={CloudOff} text="오프라인에서는 지도를 볼 수 없어요" />;
  }
  if (status === APILoadingStatus.FAILED) {
    return (
      <MapNotice icon={MapPinOff} text="지도를 불러오지 못했어요">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-8 rounded-button border border-line-strong bg-white px-3 text-[13px] font-bold text-ink-700"
        >
          다시 불러오기
        </button>
      </MapNotice>
    );
  }
  return children;
}

type MapNoticeProps = {
  icon: typeof CloudOff;
  text: string;
  children?: ReactNode;
};

/** 지도 칸을 채우는 회색 안내 — 작은 지도(180)에도 들어가게 아이콘 · 한 줄 · (선택) 버튼 */
function MapNotice({ icon: Icon, text, children }: MapNoticeProps) {
  return (
    <div
      role="status"
      className="flex size-full flex-col items-center justify-center gap-2 bg-map-bg px-5 text-center"
    >
      <Icon className="size-6 text-ink-350" strokeWidth={1.8} />
      <p className="text-[13px] font-semibold text-ink-500">{text}</p>
      {children}
    </div>
  );
}
