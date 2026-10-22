"use client";

import { Backpack, Plus, ShoppingBag } from "lucide-react";

import type { PackKind } from "@/entities/pack";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { GROUP_NAME_MAX, PACK_COPY } from "../lib/copy";
import { usePackBoard } from "../model/use-pack-board";
import { usePackItemActions } from "../model/use-pack-item-actions";
import { usePackPhotoActions } from "../model/use-pack-photo-actions";
import { PackConfirms } from "./pack-confirms";
import { PackGroupCard } from "./pack-group-card";
import { PackItemSheet } from "./pack-item-sheet";
import { PackPhotoViewer } from "./pack-photo-viewer";
import { PackTextInput } from "./pack-text-input";

type PackBoardProps = {
  tripId: string;
  kind: PackKind;
  onToast: (text: string) => void;
};

/**
 * 노트 › 준비물 · 쇼핑(같은 모양) — 진행률 카드(「N / M 챙김 · 구매」 + 막대), 그룹 카드(모바일 한 줄 · PC 300 이상 여러 열),
 * 맨 아래 점선 「그룹 추가」. 쇼핑은 줄마다 참고 사진(48 · 전체 화면). 그룹이 없으면 빈 상태(「기본 목록 · 그룹으로 시작」 · 「빈 목록으로 시작」)
 */
export function PackBoard({ tripId, kind, onToast }: PackBoardProps) {
  const state = usePackBoard(tripId, kind, onToast);
  const actions = usePackItemActions(tripId, state.board, onToast);
  const shopPhotos = usePackPhotoActions(
    tripId,
    state.board?.groups.flatMap((g) => g.items) ?? [],
    onToast,
  );
  // 사진은 쇼핑만
  const photos = kind === "shop" ? shopPhotos : null;
  const copy = PACK_COPY[kind];
  const EmptyIcon = kind === "shop" ? ShoppingBag : Backpack;
  if (state.isPending || !state.board) {
    return (
      <div className="flex flex-col gap-3.5 px-4 pt-4">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-40 rounded-card" />
      </div>
    );
  }
  if (state.showEmpty) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
        <span className="mb-2 flex size-16 items-center justify-center rounded-full bg-surface-selected">
          <EmptyIcon className="size-7 text-primary" aria-hidden="true" />
        </span>
        <p className="text-[17px] font-extrabold text-ink-900">{copy.emptyTitle}</p>
        <p className="text-sm text-ink-450">{copy.emptyText}</p>
        <div className="mt-4 flex w-full max-w-80 flex-col gap-2">
          <Button
            size="cta"
            className="h-12 w-full"
            disabled={state.presetsPending}
            onClick={state.startPresets}
          >
            {copy.presetLabel}
          </Button>
          <Button size="cta" variant="chip" className="h-12 w-full" onClick={state.startEmpty}>
            빈 목록으로 시작
          </Button>
        </div>
      </div>
    );
  }
  const { board } = state;
  const percent = Math.round((board.done / Math.max(1, board.total)) * 100);
  return (
    <div className="mx-auto flex w-full max-w-270 flex-col gap-3.5 px-4 pt-4 pb-7 lg:px-6">
      <div className="flex flex-col gap-2.5 rounded-card border border-surface-muted bg-white px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-extrabold whitespace-nowrap text-ink-900">
            {board.done} / {board.total} {copy.done}
          </span>
          <button
            type="button"
            onClick={actions.askReset}
            disabled={actions.checkedCount === 0}
            className="shrink-0 text-[13px] whitespace-nowrap text-ink-400 disabled:opacity-40"
          >
            모두 해제
          </button>
        </div>
        <span
          role="progressbar"
          aria-label={`${copy.listLabel} 진행률`}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-1.5 overflow-hidden rounded-full bg-divider"
        >
          <span className="block h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </span>
      </div>
      <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
        {board.groups.map((view) => (
          <PackGroupCard
            key={view.group.id}
            view={view}
            state={state}
            actions={actions}
            photos={photos}
          />
        ))}
      </div>
      <label className="flex h-12 items-center gap-2 rounded-card border-[1.5px] border-dashed border-line-dashed bg-white px-3.5">
        <Plus className="size-4.5 shrink-0 text-primary" strokeWidth={2.2} aria-hidden="true" />
        <PackTextInput
          onSubmit={state.addGroup}
          maxLength={GROUP_NAME_MAX}
          placeholder="그룹 추가 (예: 🎁 선물) 후 엔터"
          label="그룹 추가"
          showButton
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-bold text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-350"
        />
      </label>
      <PackItemSheet
        tripId={tripId}
        kind={kind}
        board={board}
        actions={actions}
        checkerOf={state.memberOf}
        me={state.me}
      />
      <PackConfirms actions={actions} checkedItems={copy.checkedItems} />
      {photos && <PackPhotoViewer tripId={tripId} photos={photos} />}
    </div>
  );
}
