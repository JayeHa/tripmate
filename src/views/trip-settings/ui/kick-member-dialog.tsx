"use client";

import { useHeldWhileClosing } from "@/shared/lib/use-dialog-state";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import type { TripSettingsState } from "../model/use-trip-settings";

type KickMemberDialogProps = { kick: TripSettingsState["kick"] };

/** 멤버 내보내기 확인 — 방장만 연다. 그 사람이 남긴 기록은 그대로 둔다 */
export function KickMemberDialog({ kick }: KickMemberDialogProps) {
  const target = useHeldWhileClosing(kick.target !== null, kick.target);
  const name = target?.profile.display_name ?? "이 멤버";
  return (
    <AlertDialog
      open={kick.target !== null}
      locked={kick.locked}
      onOpenChange={(next) => !next && kick.cancel()}
    >
      <AlertDialogContent>
        <AlertDialogTitle>{name} 님을 내보낼까요?</AlertDialogTitle>
        <AlertDialogDescription>
          이 여행을 더 볼 수 없어요. 그동안 남긴 일정·가계부·노트는 그대로 남아요.
        </AlertDialogDescription>
        {kick.error && <p className="text-sm text-destructive">내보내지 못했어요: {kick.error}</p>}
        <AlertDialogFooter>
          <Button variant="chip" disabled={kick.locked} onClick={kick.cancel}>
            취소
          </Button>
          <Button variant="danger" disabled={kick.pending} onClick={kick.confirm}>
            {kick.pending ? "내보내는 중…" : "내보내기"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
