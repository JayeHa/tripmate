"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { isPdf, type Voucher } from "@/entities/voucher";
import { cn } from "@/shared/lib/utils";

import type { ViewerNumber } from "../lib/voucher-view";
import { usePageSwipe } from "../model/use-page-swipe";
import type { VoucherViewerState } from "../model/use-voucher-viewer";
import { NoImage, NumberCard } from "./viewer-fallbacks";
import { ZoomPane } from "./zoom-pane";

type ViewerStageProps = {
  voucher: Voucher;
  viewer: VoucherViewerState;
  numbers: ViewerNumber[];
  /** 번호 카드 아래 날짜 — 사용일, 없으면 연결 이름 */
  dateText: string | null;
};

/**
 * 뷰어 가운데 — 흰 판(r8)에 그림을 맞춰 넣고(contain), 여러 장이면 판 양옆 화살표(끝에서 흐리게) · 손가락으로 밀어 넘기기 · 아래 점.
 * 그림은 두 손가락으로 확대한다(ZoomPane). 확대 중에는 밀어도 넘기지 않고 그림이 움직인다 — 화살표로는 넘기고, 넘기면 원래 크기로.
 * 그림이 없으면: 번호가 있는 사진 · 파일 없는 바우처는 번호 카드, 그 밖은 큰 아이콘과 안내(그림이 없는 PDF 는 「원본 열기」)
 */
export function ViewerStage({ voucher, viewer, numbers, dateText }: ViewerStageProps) {
  // 지금 그림을 확대했는지. 쪽을 넘기면 확대 칸이 새로 그려져 원래 크기가 되는데, 사라지는 칸은 알리지 않으므로
  // 그림이 바뀐 렌더에서 함께 버린다 — 확대했던 쪽으로 돌아와도 밀어 넘기기가 막히지 않게
  const [zoomed, setZoomed] = useState(false);
  const [shownImage, setShownImage] = useState(viewer.image);
  if (shownImage !== viewer.image) {
    setShownImage(viewer.image);
    setZoomed(false);
  }
  const swipe = usePageSwipe(viewer.go, zoomed);
  if (viewer.total === 0) {
    if (!isPdf(voucher) && numbers[0]) {
      return <NumberCard first={numbers[0]} dateText={dateText} />;
    }
    return <NoImage voucher={voucher} originalUrl={viewer.originalUrl} />;
  }
  const many = viewer.total > 1;
  return (
    <>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-5 py-2"
        {...swipe}
      >
        <div className="flex size-full items-center justify-center overflow-hidden rounded-button bg-white">
          {viewer.image && (
            <ZoomPane key={viewer.image} onZoomChange={setZoomed}>
              <PlateImage
                src={viewer.image}
                alt={`${voucher.title}${many ? ` ${viewer.page + 1}쪽` : ""}`}
              />
            </ZoomPane>
          )}
        </div>
        {many && (
          <>
            <PageArrow side="left" disabled={viewer.page === 0} onClick={() => viewer.go(-1)} />
            <PageArrow
              side="right"
              disabled={viewer.page === viewer.total - 1}
              onClick={() => viewer.go(1)}
            />
          </>
        )}
      </div>
      {many && <Dots page={viewer.page} total={viewer.total} />}
    </>
  );
}

type PlateImageProps = { src: string; alt: string };

/** 판 안의 그림 — 이 브라우저가 그리지 못하는 사진(Chrome 의 HEIC)이면 원본 저장을 안내한다. 주소마다 감싼 확대 칸의 key 로 새로 그린다 */
function PlateImage({ src, alt }: PlateImageProps) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <p className="px-6 text-center text-sm text-ink-400">
        이 기기에서 그릴 수 없는 사진이에요. 원본 저장으로 받아 열어 주세요.
      </p>
    );
  }
  return (
    // 서명 주소라 next/image 최적화를 거치지 않는다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      draggable={false}
      onError={() => setBroken(true)}
      className="size-full object-contain select-none"
    />
  );
}

type PageArrowProps = { side: "left" | "right"; disabled: boolean; onClick: () => void };

/** 판 바깥 가장자리 화살표(36 × 40 · 28 흰색) — 끝이면 흐리게 */
function PageArrow({ side, disabled, onClick }: PageArrowProps) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "이전 쪽" : "다음 쪽"}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex h-10 w-9 -translate-y-1/2 items-center justify-center text-white disabled:opacity-20",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <Icon className="size-7" strokeWidth={2} />
    </button>
  );
}

type DotsProps = { page: number; total: number };

/** 쪽 점 — 지금 쪽은 18 흰색, 나머지 6 회색 */
function Dots({ page, total }: DotsProps) {
  return (
    <div className="flex shrink-0 justify-center gap-1.5 pt-2 pb-3" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          // 점은 순서 말고 구분할 것이 없다

          key={i}
          className={cn("h-1.5 rounded-full", i === page ? "w-4.5 bg-white" : "w-1.5 bg-ink-500")}
        />
      ))}
    </div>
  );
}
