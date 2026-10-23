"use client";

import { CircleCheck, CloudDownload, Loader } from "lucide-react";

import { usePackLists } from "@/entities/pack";
import type { Trip } from "@/entities/trip";
import { useVouchers } from "@/entities/voucher";
import {
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { photoTargets, type SavedTrip } from "../lib/offline-plan";
import { shortDate, StatusIcon } from "./step-parts";

type ConfirmStepProps = { trip: Trip; onCancel: () => void; onStart: () => void };

/** 1 처음 — 무엇을 받는지와 사진 장수. 장수는 바우처 · 쇼핑 목록을 읽은 뒤에 붙는다 */
export function ConfirmStep({ trip, onCancel, onStart }: ConfirmStepProps) {
  const { data: vouchers } = useVouchers(trip.id);
  const { data: pack } = usePackLists(trip.id);
  const photos = vouchers && pack ? photoTargets(vouchers, pack.items).length : 0;
  const what = photos > 0 ? `일정 · 노트 · 가계부와 사진 ${photos}장을` : "일정 · 노트 · 가계부를";
  return (
    <>
      <StatusIcon icon={CloudDownload} tone="blue" />
      <AlertDialogTitle>오프라인용으로 받을까요?</AlertDialogTitle>
      <AlertDialogDescription>
        「{trip.title}」의 {what} 이 기기에 받아 둬요.
        <br />
        지도와 바우처 PDF 원본은 받지 않아요.
      </AlertDialogDescription>
      <AlertDialogFooter>
        <Button variant="chip" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={onStart}>받기</Button>
      </AlertDialogFooter>
    </>
  );
}

type BusyStepProps = { title: string; saved: SavedTrip | undefined; onClose: () => void };

/** 2 받는 중 — 진행 막대(받은 수 / 전체). 닫아도 계속 받는다 */
export function BusyStep({ title, saved, onClose }: BusyStepProps) {
  const done = saved?.done ?? 0;
  const total = saved?.total ?? 0;
  const ratio = total > 0 ? done / total : 0;
  return (
    <>
      <StatusIcon icon={Loader} tone="busy" spin />
      <AlertDialogTitle>{title}</AlertDialogTitle>
      <div className="flex flex-col gap-2 pt-1.5">
        <div className="flex justify-between text-[13px] font-bold text-sync-waiting">
          <span>받는 중</span>
          <span>
            {done} / {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label="받는 중"
          className="h-1.5 overflow-hidden rounded-[3px] bg-sync-waiting-soft"
        >
          <div
            className="h-full bg-sync-waiting transition-[width] duration-200 ease-out"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <AlertDialogDescription className="text-[13px] text-ink-400">
          창을 닫아도 계속 받아요
        </AlertDialogDescription>
      </div>
      <AlertDialogFooter>
        <Button variant="chip" onClick={onClose}>
          닫기
        </Button>
      </AlertDialogFooter>
    </>
  );
}

type DoneStepProps = { saved: SavedTrip; onClose: () => void };

/** 3 다 받음 — 보관 기한 */
export function DoneStep({ saved, onClose }: DoneStepProps) {
  return (
    <>
      <StatusIcon icon={CircleCheck} tone="done" />
      <AlertDialogTitle>다 받았어요</AlertDialogTitle>
      <AlertDialogDescription>
        인터넷 없이도 열 수 있어요
        {saved.keepUntil && ` · ${shortDate(saved.keepUntil)}까지 보관해요`}
      </AlertDialogDescription>
      <AlertDialogFooter>
        <Button onClick={onClose}>확인</Button>
      </AlertDialogFooter>
    </>
  );
}
