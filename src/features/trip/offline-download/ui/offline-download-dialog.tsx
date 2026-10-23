"use client";

import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import { AlertDialog, AlertDialogContent } from "@/shared/ui/alert-dialog";

import type { OfflineDownloadDialogState } from "../model/use-offline-download";
import { BusyStep, ConfirmStep, DoneStep } from "./download-steps";
import { AgainStep, PartialStep } from "./retry-steps";

type OfflineDownloadDialogProps = { state: OfflineDownloadDialogState };

/**
 * 「오프라인용으로 받기」 창 — 처음 · 받는 중 · 다 받음 · 일부 실패 · 전에 받음 다섯 단계를 같은 창에서 바꿔 그린다.
 * 받는 중에도 닫을 수 있다(계속 받는다). 닫히는 동안에는 마지막 내용을 그대로 둔다
 */
export function OfflineDownloadDialog({ state }: OfflineDownloadDialogProps) {
  const open = state.trip !== null;
  const held = useHeldWhileClosing(open, open ? state : null);
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && state.onClose()}>
      <AlertDialogContent>{held && <StepBody state={held} />}</AlertDialogContent>
    </AlertDialog>
  );
}

type StepBodyProps = { state: OfflineDownloadDialogState };

/** 지금 단계의 내용 */
function StepBody({ state }: StepBodyProps) {
  const { trip, saved, step, onStart, onClose } = state;
  if (!trip) return null;
  if (step === "confirm") {
    return <ConfirmStep trip={trip} onCancel={onClose} onStart={() => onStart("all")} />;
  }
  if (step === "busy") return <BusyStep title={state.busyTitle} saved={saved} onClose={onClose} />;
  if (!saved) return null;
  if (step === "done") return <DoneStep saved={saved} onClose={onClose} />;
  if (step === "partial") {
    return <PartialStep saved={saved} onClose={onClose} onRetry={onStart} />;
  }
  return <AgainStep saved={saved} onCancel={onClose} onStart={() => onStart("all")} />;
}
