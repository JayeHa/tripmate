"use client";

import { type QueryClient, useMutationState, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { isSyncKey, subscribeSyncNotices } from "@/shared/api/sync";

import { chipOf } from "../lib/chip";

/** 「모두 저장됨」 이 떠 있는 시간 */
const SAVED_MS = 2000;
/** 알림이 떠 있는 시간(안내형 토스트와 같다) */
const NOTICE_MS = 2600;

/**
 * 오프라인 편집 대기열의 상태 — 칩(저장 중… / 모두 저장됨 / 변경 N건 대기 / 저장 실패 · 다시 시도)과 알림(일행의 수정을 덮음).
 * 대기열 밖 저장(온라인에서만 되는 것)은 세지 않는다 — 평소 저장마다 칩이 깜빡이지 않게.
 * 「모두 저장됨」 은 기다리던 변경이 다 올라간 순간에만 잠깐 보인다
 */
export function useSyncStatus() {
  const qc = useQueryClient();
  const states = useMutationState({
    filters: { predicate: (m) => isSyncKey(m.options.mutationKey) },
    select: (m) => ({ status: m.state.status, paused: m.state.isPaused }),
  });
  const waiting = states.filter((s) => s.status === "pending" && s.paused).length;
  const saving = states.filter((s) => s.status === "pending" && !s.paused).length;
  const failed = states.filter((s) => s.status === "error").length;
  const [notice, setNotice] = useState<{ text: string; id: number } | null>(null);
  // 기다리던 변경이 있다(오프라인에서 쌓였거나 실패했거나 기기에서 되살아났다 — 되살아난 저장은 처음에 멈춘 채로 들어온다).
  // 다 올라가면 「모두 저장됨」 을 잠깐. 렌더 중에 맞춘다(지난 렌더와 비교하는 상태)
  const [backlog, setBacklog] = useState(false);
  // 「모두 저장됨」 을 띄운 횟수 — 띄울 때마다 바뀌어 시간을 다시 잰다. null 이면 숨김
  const [savedTurn, setSavedTurn] = useState<number | null>(null);
  if (!backlog && (waiting > 0 || failed > 0)) setBacklog(true);
  if (backlog && waiting + saving + failed === 0) {
    setBacklog(false);
    setSavedTurn((n) => (n ?? 0) + 1);
  }
  useEffect(() => {
    if (savedTurn === null) return;
    const t = setTimeout(() => setSavedTurn(null), SAVED_MS);
    return () => clearTimeout(t);
  }, [savedTurn]);

  useEffect(() => subscribeSyncNotices((text) => setNotice({ text, id: Date.now() })), []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(t);
  }, [notice]);

  return {
    chip: chipOf(waiting, saving, failed, savedTurn !== null, backlog),
    notice: notice?.text ?? null,
    /** 「다시 시도」 — 실패한 대기열 저장을 같은 값으로 다시 올린다 */
    retry: () => retryFailed(qc),
  };
}

/** 실패한 대기열 저장을 지우고 같은 값으로 새로 올린다(등록한 함수 · 동작을 그대로 쓴다) */
function retryFailed(qc: QueryClient) {
  const cache = qc.getMutationCache();
  const failed = cache.findAll({
    predicate: (m) => isSyncKey(m.options.mutationKey) && m.state.status === "error",
  });
  for (const m of failed) {
    const variables = m.state.variables;
    cache.remove(m);
    void cache
      .build(qc, { mutationKey: m.options.mutationKey })
      .execute(variables)
      .catch(() => undefined);
  }
}
