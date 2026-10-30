/** 기기별 저장값(localStorage) 키 — 일행과 나누지 않는다 */
export const NUDGE_KEY = "tm-install-nudge";

/**
 * 안내 시트를 띄운 기록 — 앱을 연 횟수 · 닫은 횟수 · 이때까지 띄우지 않음(밀리초, 0 이면 없음)
 */
export type NudgeState = { visits: number; dismissed: number; until: number };

/** 닫으면 이만큼 띄우지 않는다 */
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;
/** 이만큼 닫으면 다시 띄우지 않는다(계정 메뉴에서는 언제든 열 수 있다) */
const MAX_DISMISS = 3;

const EMPTY: NudgeState = { visits: 0, dismissed: 0, until: 0 };

/** 0 이상의 정수만 — 손상된 값은 0 */
function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/** 저장값을 읽는다 — 없거나 깨졌으면 처음 상태 */
export function parseNudge(raw: string | null): NudgeState {
  if (!raw) return EMPTY;
  try {
    const v = JSON.parse(raw) as Partial<Record<keyof NudgeState, unknown>>;
    return { visits: count(v.visits), dismissed: count(v.dismissed), until: count(v.until) };
  } catch {
    return EMPTY;
  }
}

/** 앱을 한 번 더 열었다 */
export function countVisit(state: NudgeState): NudgeState {
  return { ...state, visits: state.visits + 1 };
}

/** 닫았다(「나중에」 · ✕ · 바깥 누르기) — 14일 쉬고, 세 번째면 그만 */
export function dismissNudge(state: NudgeState, now: number): NudgeState {
  return { ...state, dismissed: state.dismissed + 1, until: now + SNOOZE_MS };
}

/**
 * 띄울 때인가 — 세 번 닫았거나 쉬는 중이면 아니다. 화면을 가리므로 두 번째 방문부터,
 * 앱 안 브라우저는 링크로 처음 들어오는 경우가 많아 첫 방문에도(visits 는 이번 방문을 센 뒤의 값)
 */
export function shouldNudge(state: NudgeState, env: { now: number; inApp: boolean }): boolean {
  if (state.dismissed >= MAX_DISMISS || env.now < state.until) return false;
  return state.visits >= (env.inApp ? 1 : 2);
}
