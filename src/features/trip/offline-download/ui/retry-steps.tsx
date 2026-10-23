"use client";

import { format, parseISO } from "date-fns";
import { CircleAlert, ImageOff, RefreshCw } from "lucide-react";

import {
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { failedPhotoLine, partialTitle, retryScope, type SavedTrip } from "../lib/offline-plan";
import { shortDate, StatusIcon } from "./step-parts";

type PartialStepProps = {
  saved: SavedTrip;
  onClose: () => void;
  onRetry: (scope: "all" | "failed") => void;
};

/** 4 일부 실패 — 못 받은 사진 줄, 「다시 받기」 는 못 받은 것만(도중에 끊겼으면 전부) */
export function PartialStep({ saved, onClose, onRetry }: PartialStepProps) {
  const photoLine = failedPhotoLine(saved.failed);
  const thumbs = saved.failed.filter((f) => f.kind === "photo").slice(0, 2);
  return (
    <>
      <StatusIcon icon={CircleAlert} tone="fail" />
      <AlertDialogTitle>{partialTitle(saved)}</AlertDialogTitle>
      <AlertDialogDescription>
        나머지는 다 받았어요. 연결이 좋은 곳에서 다시 받아 주세요.
      </AlertDialogDescription>
      {photoLine && (
        <div className="flex items-center gap-2 pt-1">
          {thumbs.map((t) => (
            <span
              key={t.keys[0]}
              className="flex size-12 shrink-0 items-center justify-center rounded-button bg-destructive-soft"
            >
              <ImageOff aria-hidden="true" className="size-4.5 text-destructive" />
            </span>
          ))}
          <div className="flex min-w-0 flex-col gap-0.5 pl-1">
            <span className="truncate text-[13px] font-bold text-ink-700">{photoLine}</span>
            <span className="text-xs text-ink-400">한 번 열어 보면 그때 저장돼요</span>
          </div>
        </div>
      )}
      <AlertDialogFooter>
        <Button variant="chip" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={() => onRetry(retryScope(saved))}>다시 받기</Button>
      </AlertDialogFooter>
    </>
  );
}

type AgainStepProps = { saved: SavedTrip; onCancel: () => void; onStart: () => void };

/** 5 전에 받음 — 받은 날 · 보관 기한, 바뀐 내용까지 전부 다시 받을지 */
export function AgainStep({ saved, onCancel, onStart }: AgainStepProps) {
  const when = saved.savedAt ? format(parseISO(saved.savedAt), "M월 d일") : null;
  return (
    <>
      <StatusIcon icon={RefreshCw} tone="blue" />
      <AlertDialogTitle>{when ? `${when}에 받았어요` : "받아 둔 여행이에요"}</AlertDialogTitle>
      <AlertDialogDescription>바뀐 내용까지 다시 받을까요?</AlertDialogDescription>
      {saved.keepUntil && (
        <p className="text-[13px] text-ink-400">
          지금 받아 둔 화면은 {shortDate(saved.keepUntil)}까지 보관돼요
        </p>
      )}
      <AlertDialogFooter>
        <Button variant="chip" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={onStart}>다시 받기</Button>
      </AlertDialogFooter>
    </>
  );
}
