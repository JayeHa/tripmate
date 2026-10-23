import { type Mutation, onlineManager, type QueryClient } from "@tanstack/react-query";

/**
 * 오프라인 편집 대기열 — 오프라인에서도 되는 저장(현장 동작: 체크 · 메모 · 비용 추가)만 이 키로 시작한다.
 * 이 키의 저장은 오프라인이면 멈춰(isPaused) 기기에 남고(새로고침 · 앱 종료 뒤에도), 연결되면 올라간다.
 * 요청 함수는 키마다 `queryClient.setMutationDefaults` 로 등록한다 — 기기에서 되살린 저장에는 함수가 없어서(#195)
 */
export const SYNC_KEY = "sync";

/** 대기열은 한 줄로 — 같은 항목을 오프라인에서 여러 번 바꿔도 누른 순서대로 올라간다 */
export const SYNC_SCOPE = { id: SYNC_KEY };

/** 대기열인지 볼 저장 — TanStack Mutation 의 필요한 칸만(오류 · 값 타입과 상관없이 받게) */
type SyncCandidate = {
  options: { mutationKey?: readonly unknown[] };
  state: { status: Mutation["state"]["status"] };
};

/** 대기열 저장인가 */
export function isSyncKey(mutationKey: readonly unknown[] | undefined): boolean {
  return mutationKey?.[0] === SYNC_KEY;
}

/** 오프라인이라 막은 저장 — 화면에 그대로 보여도 되는 문구 */
export class OfflineError extends Error {
  constructor() {
    super("오프라인이에요. 연결되면 다시 해 주세요");
    this.name = "OfflineError";
  }
}

/**
 * 오프라인이면 대기열 밖 저장을 막는다(MutationCache 의 onMutate, 저장 함수보다 먼저 돈다).
 * 막지 않으면 멈췄다가 새로고침 때 함수 없이 되살아나 사라지고, 여러 단계 저장(파일 · 연결)은 중간에서 끊긴다
 */
export function blockOfflineMutation(mutation: SyncCandidate): void {
  if (onlineManager.isOnline() || isSyncKey(mutation.options.mutationKey)) return;
  throw new OfflineError();
}

/**
 * 서버에 닿지 못한 실패인가 — supabase-js 는 fetch 가 거부되면 던지지 않고 이 문구를 담은 오류를 돌려준다.
 * Chrome 「Failed to fetch」 · Firefox 「NetworkError」 · Safari 「Load failed」
 */
export function isNetworkError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : (error as { message?: unknown })?.message;
  return typeof message === "string" && /Failed to fetch|NetworkError|Load failed/i.test(message);
}

/** 같은 줄을 다시 넣었다(unique 위반, 23505) — 화면에서 만든 id 로 넣는 저장이 두 번 올라간 것. 이미 들어갔으니 성공으로 본다 */
export function isDuplicateKey(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === "23505";
}

/**
 * 대기열 저장이 올라가는 중인가 — 그동안 실시간 알림으로 다시 읽으면 아직 올리지 않은 변경이 화면에서 잠깐 사라진다.
 * 마지막 저장이 끝나며 다시 읽으니 그때까지 미룬다
 */
export function isSyncing(client: QueryClient): boolean {
  return client.isMutating({ mutationKey: [SYNC_KEY] }) > 0;
}

/** 대기열 저장을 다시 해 볼까 — 서버에 닿지 못했을 때만 3번. 지워졌거나 권한이 없으면 다시 해도 같아서 바로 되돌린다 */
export function retrySync(failureCount: number, error: unknown): boolean {
  return failureCount < 3 && isNetworkError(error);
}

/** 대기열에 남겨 둘 실패인가 — 서버에 닿지 못한 것만(「다시 시도」 · 다음에 열 때 다시 올린다) */
export function isKeptFailure(state: { status: string; error: unknown }): boolean {
  return state.status === "error" && isNetworkError(state.error);
}

/**
 * 다시 올려도 안 되는 대기열 실패(지워짐 · 권한 없음)는 대기열에서 뺀다 — 화면은 그 항목만 되돌렸고(onError 가 먼저 돈다) 토스트로 알렸다.
 * 남기면 gcTime Infinity 라 「저장 실패 · 다시 시도」 가 영영 남고, 앱을 열 때마다 기기의 줄을 다시 올렸다 또 실패한다.
 * `updated` 에서만 뺀다 — `remove` 는 이미 뺀 저장에도 `removed` 를 다시 보내 그때 빼면 끝없이 돈다
 */
export function dropDeadEndFailures(client: QueryClient): void {
  const cache = client.getMutationCache();
  cache.subscribe(({ type, mutation: m }) => {
    if (type !== "updated" || !m || !isSyncKey(m.options.mutationKey)) return;
    if (m.state.status === "error" && !isKeptFailure(m.state)) cache.remove(m);
  });
}

// 내가 올린 수정으로 바뀐 버전 — 같은 항목을 오프라인에서 두 번 바꾸면 두 저장 모두 처음 본 버전을 들고 있어,
// 두 번째가 첫 번째(내 수정)를 일행의 수정으로 잘못 본다. 처음 본 버전 → 내가 만든 마지막 버전을 기억한다(이 탭에서만)
const ownWrites = new Map<string, { seen: string; latest: string }>();

/** 올릴 때 비교할 버전 — 처음 본 버전 뒤에 내 수정만 있었으면 그 마지막 버전 */
export function versionToCompare(rowId: string, seen: string): string {
  const own = ownWrites.get(rowId);
  return own?.seen === seen ? own.latest : seen;
}

/** 올리고 받은 새 버전을 기억한다 */
export function rememberOwnWrite(rowId: string, seen: string, latest: string): void {
  ownWrites.set(rowId, { seen, latest });
}

/** 대기열 저장이 일행의 수정을 덮었을 때 — 시안 「나중 수정이 우선이고 토스트로 알려요」 */
export const OVERWROTE_TEXT = "일행이 먼저 고친 항목을 내 수정으로 바꿨어요";
/** 대기열의 삭제가 일행이 그사이 고친 메모를 지웠을 때 */
export const DELETED_EDITED_TEXT = "일행이 먼저 고친 메모를 지웠어요";

type SyncNoticeListener = (text: string) => void;
const listeners = new Set<SyncNoticeListener>();

/** 대기열에서 알릴 것을 띄운다 — 화면 위 동기화 칩 옆(widgets/connection-status)이 받아 그린다 */
export function notifySync(text: string): void {
  listeners.forEach((l) => l(text));
}

/** 알림을 듣는다 — 그만 들을 함수를 돌려준다 */
export function subscribeSyncNotices(listener: SyncNoticeListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 대기열 저장의 결과 — 새 버전과, 일행의 수정을 덮었는가 */
export type SyncResult = { updatedAt: string; overwrote: boolean };

type VersionedUpdate = (
  onlyIfVersion: string | null,
) => PromiseLike<{ data: { updated_at: string }[] | null; error: Error | null }>;

/**
 * 나중 수정 우선으로 고친다 — 본 버전(updated_at)이면 그대로 고치고, 그사이 일행이 고쳤으면(0행) 조건 없이 내 것으로 덮고 알린다.
 * 그래도 0행이면 그사이 지워졌다(goneText 를 던진다). update 는 onlyIfVersion 이 있으면 `.eq("updated_at", …)` 를 건다
 */
export async function updateLatestWins(
  update: VersionedUpdate,
  version: string,
  goneText: string,
): Promise<SyncResult> {
  const first = await update(version);
  if (first.error) throw first.error;
  if (first.data?.[0]) return { updatedAt: first.data[0].updated_at, overwrote: false };
  const forced = await update(null);
  if (forced.error) throw forced.error;
  if (!forced.data?.[0]) throw new Error(goneText);
  return { updatedAt: forced.data[0].updated_at, overwrote: true };
}
