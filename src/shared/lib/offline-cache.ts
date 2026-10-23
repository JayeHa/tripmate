/** 「오프라인용으로 받기」 로 받은 여행의 기록(여행마다 상태 · 받은 날 · 보관 기한) — 기기별 저장값(localStorage) */
export const OFFLINE_TRIPS_KEY = "tm-offline-saved";

/**
 * 서비스 워커(`app/sw.ts`)가 기기에 저장한 화면 · 사진을 지운다 — 로그아웃 · 둘러보기에서 갈아탈 때.
 * 같은 기기를 다른 사람이 쓰면 앞 사람의 여행 화면 · 바우처가 남지 않게. 빌드 파일(미리 저장, precache)은 남긴다.
 * 받은 여행의 기록도 함께 지운다 — 칸이 없는데 「받음」 으로 보이지 않게.
 * Cache Storage 를 못 쓰는 환경(보안 연결이 아님 · 일부 사생활 보호 모드)에서는 조용히 넘어간다
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    localStorage.removeItem(OFFLINE_TRIPS_KEY);
  } catch {
    // 저장소가 막혀 있으면 남은 기록도 없다
  }
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !n.includes("precache")).map((n) => caches.delete(n)));
  } catch {
    // 저장소가 없으면 지울 것도 없다
  }
}
