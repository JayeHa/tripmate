"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import type { Trip } from "@/entities/trip";
import { todayISO } from "@/shared/lib/days";
import { eulReul } from "@/shared/lib/josa";
import { useOnline } from "@/shared/lib/use-online";
import type { ToastMessage } from "@/shared/ui/toast";

import {
  downloadStep,
  type MenuHint,
  menuHint,
  partialTitle,
  retryScope,
  type SavedTrip,
} from "../lib/offline-plan";
import { isRunning, useSavedTrips } from "./offline-store";
import { runOfflineDownload } from "./run-offline-download";

/** 화면에 띄울 토스트 — id 는 화면이 붙인다 */
export type DownloadToast = Omit<ToastMessage, "id">;

/** 받기 창 상태 — 창(OfflineDownloadDialog)에 그대로 넘긴다 */
export type OfflineDownloadDialogState = ReturnType<typeof useOfflineDownload>["dialog"];

/** 창을 닫은 뒤 끝났을 때의 토스트 — 「도쿄 여행 · 다 받았어요」, 실패면 「다시 받기」 버튼 */
function finishToast(trip: Trip, result: SavedTrip, retry: () => void): DownloadToast {
  if (result.status === "done") return { text: trip.title, detail: "다 받았어요" };
  return {
    text: trip.title,
    detail: partialTitle(result),
    action: { label: "다시 받기", onClick: retry },
  };
}

/**
 * 내 여행 ⋯ 메뉴의 「오프라인용으로 받기」 — 메뉴 힌트, 받기 창, 끝난 뒤 토스트.
 * 받기는 창을 닫아도 앱이 열려 있는 동안 계속된다. 창이 닫혀 있을 때 끝나면 onToast 로 알린다(토스트는 화면이 그린다)
 */
export function useOfflineDownload(onToast: (toast: DownloadToast) => void) {
  const qc = useQueryClient();
  const saved = useSavedTrips();
  const online = useOnline();
  const [trip, setTrip] = useState<Trip | null>(null);
  // 이 창에서 받기를 눌렀는가 — 다 받은 뒤 「다 받았어요」(방금) 와 「10월 23일에 받았어요」(전에) 를 가른다
  const [startedHere, setStartedHere] = useState(false);
  // 지금 창이 열린 여행 — 끝날 때 창이 그 여행을 보고 있으면 토스트를 띄우지 않는다
  const openId = useRef<string | null>(null);
  const today = todayISO();

  /** 받기를 시작한다 — 같은 여행을 이미 받고 있으면 그대로 둔다 */
  function start(target: Trip, scope: "all" | "failed") {
    if (isRunning(target.id)) return;
    void runOfflineDownload(qc, target, scope).then((result) => {
      if (openId.current === target.id) return;
      onToast(finishToast(target, result, () => start(target, retryScope(result))));
    });
  }

  const current = trip ? saved[trip.id] : undefined;
  return {
    /** 메뉴 줄 힌트 */
    hint: (t: Trip): MenuHint => menuHint(saved[t.id], online, today),
    /** 메뉴를 눌렀다 — 오프라인이면 창 없이 토스트만 */
    open: (t: Trip) => {
      if (!online) {
        onToast({ text: "연결되면 받을 수 있어요" });
        return;
      }
      openId.current = t.id;
      setStartedHere(false);
      setTrip(t);
    },
    dialog: {
      trip,
      saved: current,
      step: downloadStep(current, startedHere, today),
      /** 받는 중 창의 제목 — 「도쿄 여행을 받고 있어요」 */
      busyTitle: trip ? `${trip.title}${eulReul(trip.title)} 받고 있어요` : "",
      /** 받기 · 다시 받기 — 창은 받는 중으로 바뀐다 */
      onStart: (scope: "all" | "failed") => {
        if (!trip) return;
        setStartedHere(true);
        start(trip, scope);
      },
      onClose: () => {
        openId.current = null;
        setTrip(null);
      },
    },
  };
}
