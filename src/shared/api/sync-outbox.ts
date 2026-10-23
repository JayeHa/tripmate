import type { QueryClient } from "@tanstack/react-query";
import { createStore, del, entries, set, type UseStore } from "idb-keyval";

import { isKeptFailure, isSyncKey } from "./sync";

/** 기기에 남긴 대기열 저장 한 줄 — 어느 탭의 것인지(owner) · 누른 때 · 저장 종류 · 값 */
type OutboxEntry = {
  owner: string;
  at: number;
  mutationKey: readonly unknown[];
  variables: unknown;
};

/** 탭이 살아 있는 동안 쥐는 잠금의 이름 앞부분 */
const TAB_LOCK = "tm-sync-tab-";
/** 주인 없는 줄을 가져갈 때 한 탭씩만 — 두 탭이 함께 열려도 같은 저장을 두 번 올리지 않게 */
const CLAIM_LOCK = "tm-sync-claim";

/**
 * 오프라인 편집 대기열을 기기(IndexedDB `tripmate-sync`)에 남긴다 — 앱이 시작할 때 한 번.
 *
 * TanStack 의 캐시 저장(persist)은 탭마다 캐시 전체를 한 칸에 통째로 써서, 같은 앱이 열린 다른 탭이 나중에 쓰면
 * 이 탭의 대기열이 사라진다. 그래서 대기열은 저장 하나마다 한 줄로 따로 쓰고, 줄마다 주인 탭을 적는다.
 * 탭은 살아 있는 동안 잠금(Web Locks)을 쥐고, 시작할 때 주인 탭이 닫힌 줄만 가져와 다시 올린다(새로고침 · 앱 종료 뒤).
 * 끝난 저장은 줄을 지운다. 실패한 저장은 남겨 둔다 — 그 탭에서는 「다시 시도」, 닫히면 다음에 열 때 다시 올린다
 */
export function startSyncOutbox(client: QueryClient): void {
  if (typeof indexedDB === "undefined" || typeof navigator.locks === "undefined") return;
  const store = createStore("tripmate-sync", "outbox");
  const tab = crypto.randomUUID();
  // 이 탭이 닫힐 때까지 놓지 않는 잠금 — 다른 탭이 이 탭의 줄을 가져가지 않게
  void navigator.locks.request(TAB_LOCK + tab, () => new Promise<never>(() => undefined));
  const cache = client.getMutationCache();

  cache.subscribe((event) => {
    const m = event.mutation;
    if (!m || !isSyncKey(m.options.mutationKey)) return;
    // 줄 id 는 이 탭 + TanStack 의 저장 번호 — 메모리에 따로 기억하지 않아도 같은 저장은 늘 같은 줄
    const rowId = `${tab}:${m.mutationId}`;
    const { status, submittedAt } = m.state;
    const variables: unknown = m.state.variables;
    if (event.type === "removed" || status === "success") {
      void del(rowId, store).catch(() => undefined);
      // 이 탭의 다른 남은 줄도 정리한다 — 지금 대기열에 없는 저장의 줄(어떤 이유로 지우지 못한 것)을 다른 탭이 나중에 다시 올리지 않게
      void dropStaleRows(tab, store, () => activeRowIds(tab, cache));
      return;
    }
    // 다시 올려도 안 되는 실패는 남기지 않는다(dropDeadEndFailures 가 대기열에서 뺀다 — 그 `removed` 가 이 `updated` 보다 먼저 와서 여기서 다시 쓰지 않게)
    if (status !== "pending" && !isKeptFailure(m.state)) return;
    const row: OutboxEntry = {
      owner: tab,
      at: submittedAt || Date.now(),
      mutationKey: m.options.mutationKey ?? [],
      variables,
    };
    void set(rowId, row, store).catch(() => undefined);
  });

  void navigator.locks.request(CLAIM_LOCK, () => claimOrphans(client, store));
}

/** 지금 이 탭 대기열에 있는(끝나지 않았거나 실패한) 저장의 줄 id */
function activeRowIds(
  tab: string,
  cache: ReturnType<QueryClient["getMutationCache"]>,
): Set<string> {
  const active = cache.findAll({
    predicate: (m) =>
      isSyncKey(m.options.mutationKey) && (m.state.status === "pending" || isKeptFailure(m.state)),
  });
  return new Set(active.map((m) => `${tab}:${m.mutationId}`));
}

/** 이 탭의 줄 가운데 대기열에 없는 저장의 줄을 지운다 — 지울 때의 대기열로 다시 가려, 그사이 새로 쓴 줄은 남긴다 */
async function dropStaleRows(
  owner: string,
  store: UseStore,
  active: () => Set<string>,
): Promise<void> {
  const rows = await entries<string, OutboxEntry>(store).catch(() => []);
  const keep = active();
  await Promise.all(
    rows
      .filter(([rowId, row]) => row.owner === owner && !keep.has(rowId))
      .map(([rowId]) => del(rowId, store).catch(() => undefined)),
  );
}

/** 주인 탭이 닫힌 줄을 누른 순서대로 다시 올린다(등록한 함수 · 동작을 그대로 쓴다). 가져온 줄은 지운다 — 다시 올리는 저장이 새 줄을 쓴다 */
async function claimOrphans(client: QueryClient, store: UseStore): Promise<void> {
  const state = await navigator.locks.query();
  const alive = new Set(
    (state.held ?? []).flatMap((l) =>
      l.name?.startsWith(TAB_LOCK) ? [l.name.slice(TAB_LOCK.length)] : [],
    ),
  );
  const rows = await entries<string, OutboxEntry>(store);
  const orphans = rows.filter(([, row]) => !alive.has(row.owner)).sort((a, b) => a[1].at - b[1].at);
  for (const [rowId, row] of orphans) {
    await del(rowId, store);
    void client
      .getMutationCache()
      .build(client, { mutationKey: [...row.mutationKey] })
      .execute(row.variables)
      .catch(() => undefined);
  }
}
