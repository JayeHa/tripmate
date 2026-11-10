"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { settledCardIndex } from "../lib/card-snap";

/** 고른 카드를 맞추는 왼쪽 자리(카드 줄의 왼쪽 여백과 같다) */
const CARD_LEFT = 20;
/** 스크롤이 이만큼(ms) 멈추면 넘기기가 끝난 것으로 본다. Safari 는 scrollend 가 없어 쉬는 시간으로 잰다 */
const SETTLE_MS = 150;

/**
 * 동선 지도의 카드 줄 — 카드마다 `data-card={id}` 를 단다.
 * - 고른 카드가 바뀌면(핀 · 카드 누르기) 그 카드를 왼쪽 20 에 맞춘다
 * - 손으로 넘겨서 멈추면 멈춘 자리의 카드를 고른다. 손을 대고 있는 동안은 고르지 않는다
 *
 * 누르기만 하고 줄이 움직이지 않았으면 고르지 않는다 — 끝에 멈춘 줄에서 고른 카드를 다시 누르면 「끝이면 마지막 카드」 로 넘어가지 않게.
 * 고른 카드에 맞추는 스크롤(코드가 움직인 것)로는 고르지 않는다 — 끝까지 가지 못하는 마지막 카드를 골랐을 때
 * 멈춘 자리가 앞 카드에 더 가까워 선택이 되돌아가지 않게
 */
export function useCardRow(selectedId: string | null, onSelect: (id: string) => void) {
  const rowRef = useRef<HTMLDivElement>(null);
  /** 사람이 움직인 스크롤인지 — 손 · 휠로 시작하면 켜고, 고르거나 선택이 바뀌면 끈다 */
  const swiping = useRef(false);
  const touching = useRef(false);
  /** 손 · 휠을 댄 순간의 scrollLeft — 멈춘 자리가 같으면 넘긴 게 아니다 */
  const startLeft = useRef(0);

  useEffect(() => {
    swiping.current = false;
    const row = rowRef.current;
    const card = row?.querySelector<HTMLElement>(`[data-card="${selectedId}"]`);
    if (!row || !card) return;
    row.scrollTo({ left: card.offsetLeft - CARD_LEFT, behavior: "smooth" });
  }, [selectedId]);

  const pickSettled = useEffectEvent((row: HTMLElement) => {
    if (!swiping.current || touching.current) return;
    swiping.current = false;
    if (Math.abs(row.scrollLeft - startLeft.current) < 1) return;
    const cards = [...row.querySelectorAll<HTMLElement>("[data-card]")];
    const snaps = cards.map((card) => card.offsetLeft - CARD_LEFT);
    const i = settledCardIndex(snaps, row.scrollLeft, row.scrollWidth - row.clientWidth);
    const id = cards[i]?.dataset.card;
    if (id && id !== selectedId) onSelect(id);
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => pickSettled(row), SETTLE_MS);
    };
    const start = () => {
      if (!swiping.current) startLeft.current = row.scrollLeft;
      swiping.current = true;
    };
    const onTouchStart = () => {
      start();
      touching.current = true;
    };
    const onTouchEnd = () => {
      touching.current = false;
      schedule();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") start();
    };
    const opts = { passive: true };
    row.addEventListener("touchstart", onTouchStart, opts);
    row.addEventListener("touchend", onTouchEnd, opts);
    row.addEventListener("touchcancel", onTouchEnd, opts);
    row.addEventListener("pointerdown", onPointerDown, opts);
    row.addEventListener("wheel", start, opts);
    row.addEventListener("scroll", schedule, opts);
    return () => {
      clearTimeout(timer);
      row.removeEventListener("touchstart", onTouchStart);
      row.removeEventListener("touchend", onTouchEnd);
      row.removeEventListener("touchcancel", onTouchEnd);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("wheel", start);
      row.removeEventListener("scroll", schedule);
    };
  }, []);

  return rowRef;
}
