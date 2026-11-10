"use client";

import { APILoadingStatus, useApiLoadingStatus } from "@vis.gl/react-google-maps";
import { CloudOff, MapPinOff } from "lucide-react";
import { Component, type ReactNode } from "react";

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
 * 스크립트를 한 번 못 부르면 지도 라이브러리가 다시 부르지 않아서, 그때만 새로고침한다.
 * 그리는 중에 지도 라이브러리가 오류를 던지면 지도 칸만 「지도를 그리지 못했어요」 로 바꾼다
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
        <ReloadButton />
      </MapNotice>
    );
  }
  return <MapErrorBoundary>{children}</MapErrorBoundary>;
}

type MapErrorBoundaryProps = { children: ReactNode };

/**
 * 지도 라이브러리가 그리다 던진 오류를 지도 칸에 가둔다. 막지 않으면 오류가 화면 전체로 올라가 Next 의
 * 「This page couldn't load」 로 일정 화면이 통째로 사라진다 — 지도 키가 허용되지 않은 주소에서 핀을 고를 때 재현됐다.
 * 지도 스크립트가 한번 깨지면 같은 페이지에서 다시 그려도 깨져서 「다시 불러오기」 는 새로고침이다
 */
class MapErrorBoundary extends Component<MapErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  /** 아래에서 오류가 나면 지도 대신 안내를 그린다 */
  static getDerivedStateFromError() {
    return { failed: true };
  }

  /** 안내 또는 지도 */
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <MapNotice icon={MapPinOff} text="지도를 그리지 못했어요">
        <ReloadButton />
      </MapNotice>
    );
  }
}

/** 새로고침 — 깨진 지도 스크립트를 다시 부른다 */
function ReloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="h-8 rounded-button border border-line-strong bg-white px-3 text-[13px] font-bold text-ink-700"
    >
      다시 불러오기
    </button>
  );
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
