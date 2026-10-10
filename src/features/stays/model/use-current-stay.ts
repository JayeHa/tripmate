"use client";

import { type Stay, useStays } from "@/entities/stay";

import type { StaysFlow } from "./use-stays-flow";

/**
 * 숙소 목록과 지금 보거나 고치는 숙소. 그 숙소가 지워졌으면(일행이) 목록으로 돌린다 — 고치던 값으로 「완료」 를 누르면
 * 새 숙소로 되살아나지 않게(고치는 중이었으면 알린다). 목록을 읽기 전에는 판단하지 않는다
 */
export function useCurrentStay(tripId: string, flow: StaysFlow, onToast?: (text: string) => void) {
  const { data } = useStays(tripId);
  const stays: Stay[] = data ?? [];
  const { step } = flow;
  const id = step.kind === "list" ? null : step.id;
  const current = id ? (stays.find((s) => s.id === id) ?? null) : null;
  if (data && id && !current) {
    if (step.kind === "form") onToast?.("일행이 이 숙소를 지웠어요");
    flow.toList();
  }
  return { stays, current };
}
