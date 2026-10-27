"use client";

import { ChevronLeft, LoaderCircle } from "lucide-react";

import { usePdfAllPages } from "../model/use-pdf-all-pages";

type PdfAllPagesViewProps = {
  tripId: string;
  fileKey: string;
  title: string;
  /** 「‹ 현장용 페이지」 — 넘겨 보는 화면으로 돌아간다 */
  onBack: () => void;
};

/**
 * 뷰어의 「PDF 전체 보기」 — 원본 PDF 의 모든 쪽을 세로로 이어서. 쪽 크기대로 자리를 먼저 잡고(그리는 동안 밀리지 않게)
 * 앞에서부터 그려진 쪽을 채운다. 받지 못하면(오프라인 · 깨진 파일) 안내와 「다시 시도」
 */
export function PdfAllPagesView({ tripId, fileKey, title, onBack }: PdfAllPagesViewProps) {
  const { state, retry } = usePdfAllPages(tripId, fileKey);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3.5 pb-2">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 items-center gap-0.5 rounded-full bg-white/10 pr-3 pl-2 text-[13px] font-bold text-white"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          현장용 페이지
        </button>
        {state.status === "ready" && (
          <span className="text-xs text-ink-350">전체 {state.sizes.length}쪽</span>
        )}
      </div>
      {state.status === "loading" && <Notice text="PDF 를 여는 중이에요" spinning />}
      {state.status === "failed" && (
        <Notice text="PDF 를 열지 못했어요. 인터넷 연결을 확인해 주세요.">
          <button
            type="button"
            onClick={retry}
            className="flex h-10 items-center rounded-full bg-white/10 px-4 text-[13px] font-bold text-white"
          >
            다시 시도
          </button>
        </Notice>
      )}
      {state.status === "ready" && (
        <ol className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-1 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {state.sizes.map((size, i) => (
            <li
              // 쪽은 순서 말고 구분할 것이 없다(PDF 쪽 번호)
              key={`page-${i + 1}`}
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-button bg-white"
              style={{ aspectRatio: `${size.width} / ${size.height}` }}
            >
              {state.images[i] ? (
                // 앱 안에서 그린 그림(blob 주소)이라 next/image 를 거치지 않는다
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={state.images[i]}
                  alt={`${title} ${i + 1}쪽`}
                  draggable={false}
                  className="size-full object-contain select-none"
                />
              ) : (
                <LoaderCircle
                  className="size-6 animate-spin text-ink-350"
                  aria-label={`${i + 1}쪽 그리는 중`}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

type NoticeProps = { text: string; spinning?: boolean; children?: React.ReactNode };

/** 가운데 안내 — 여는 중(돌아가는 표시) · 실패(아래 버튼) */
function Notice({ text, spinning = false, children }: NoticeProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-5">
      {spinning && <LoaderCircle className="size-7 animate-spin text-ink-350" aria-hidden="true" />}
      <p className="text-center text-xs text-ink-350">{text}</p>
      {children}
    </div>
  );
}
