/** 우리 서버 라우트가 실패했다 — 화면에 그대로 보여도 되는 한국어 문구와 상태 코드(네트워크가 끊겼으면 0) */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 우리 서버 라우트(`/api/*`)에 JSON 을 POST 하고 JSON 응답을 받는다. 실패하면 ApiError 를 던진다.
 * 라우트는 실패할 때 `{ error: 한국어 문구 }` 를 보낸다(서버 쪽 `routeError`) — 그 문구가 없거나 응답이 깨졌으면 fallback.
 * Supabase 데이터는 이걸 쓰지 않는다(supabase-js 가 직접 부른다). 비밀 키가 필요한 일(서명 주소 · 구글 경로)만 라우트를 거친다
 */
export async function postJson<T>(path: string, body: unknown, fallback: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(fallback, 0);
  }
  const json = (await res.json().catch(() => null)) as (T & { error?: unknown }) | null;
  if (!res.ok) {
    throw new ApiError(typeof json?.error === "string" ? json.error : fallback, res.status);
  }
  if (json === null) throw new ApiError(fallback, res.status);
  return json;
}
