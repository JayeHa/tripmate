"use client";

import { X } from "lucide-react";
import { useState } from "react";

import type { Trip } from "@/entities/trip";
import { useOpenCount } from "@/shared/lib/use-dialog-state";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { IconButton } from "@/shared/ui/icon-button";

import {
  DEFAULT_WIDGET_PREFS,
  moveWidget,
  toggleWidget,
  visibleTiles,
  widgetEditRows,
} from "../../lib/widget-prefs";
import { saveWidgetPrefs, useWidgetPrefs } from "../../model/use-widget-prefs";
import { useWidgets } from "../../model/use-widgets";
import { MobileTiles } from "../summary/widget-row";
import { WidgetEditList } from "./widget-edit-list";

type WidgetEditorProps = { trip: Trip; open: boolean; onClose: () => void };

/**
 * 홈 위젯 편집(여행 홈 「편집」) — 모바일은 전체 화면, PC 는 가운데 440 창.
 * 보이기/숨기기 · 끌어서 순서. 「완료」 를 눌러야 저장하고, ✕ · 바깥 누르기는 바꾼 것을 버린다
 */
export function WidgetEditor({ trip, open, onClose }: WidgetEditorProps) {
  const openCount = useOpenCount(open);
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-full max-w-none translate-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-none lg:inset-auto lg:top-1/2 lg:left-1/2 lg:h-auto lg:max-h-[min(720px,calc(100dvh-2rem))] lg:w-110 lg:max-w-110 lg:-translate-1/2 lg:rounded-sheet"
      >
        <EditorBody key={openCount} trip={trip} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

type EditorBodyProps = { trip: Trip; onClose: () => void };

/** 창 안 — 열 때마다 저장된 설정에서 초안을 시작한다. 미리보기는 초안대로 그린 모바일 타일 */
function EditorBody({ trip, onClose }: EditorBodyProps) {
  const widgets = useWidgets(trip.id, trip);
  const saved = useWidgetPrefs();
  const [draft, setDraft] = useState(saved);
  const preview = widgets ? visibleTiles(widgets.slots, draft) : [];

  /** 완료 — 초안을 이 기기에 저장하고 닫는다 */
  function done() {
    saveWidgetPrefs(draft);
    onClose();
  }

  return (
    <>
      <div className="flex h-13 shrink-0 items-center gap-3 px-4.5 pt-[env(safe-area-inset-top)] lg:pt-0">
        <IconButton label="닫기" onClick={onClose} className="flex text-ink-900">
          <X className="size-6" strokeWidth={2} />
        </IconButton>
        <DialogTitle className="flex-1 text-[17px] font-extrabold text-ink-900">
          홈 위젯
        </DialogTitle>
        <button
          type="button"
          onClick={done}
          className="cursor-pointer text-[15px] font-bold text-brand-text"
        >
          완료
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        <DialogDescription className="px-5 pt-1 pb-3 text-[13px]/normal text-ink-400">
          보일 위젯을 고르고 끌어서 순서를 바꿔요. 이 기기에서만 적용돼요.
        </DialogDescription>
        {widgets && (
          <WidgetEditList
            rows={widgetEditRows(widgets.slots, draft, widgets.info)}
            onMove={(from, to) => setDraft((d) => moveWidget(d, from, to))}
            onToggle={(key) => setDraft((d) => toggleWidget(d, widgets.slots, key))}
          />
        )}
        <p className="px-5 pt-4.5 pb-2 text-[13px] font-bold text-ink-400">미리보기</p>
        <div className="px-5">
          {preview.length > 0 ? (
            <MobileTiles tiles={preview} />
          ) : (
            <p className="py-2.5 text-[13px] text-ink-350">위젯을 모두 끄면 위젯 줄이 사라져요.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDraft(DEFAULT_WIDGET_PREFS)}
          className="cursor-pointer p-5 text-[13px] font-bold text-ink-400"
        >
          기본값으로 되돌리기
        </button>
      </div>
    </>
  );
}
