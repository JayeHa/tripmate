/**
 * 서비스 워커(`app/sw.ts`)가 기기에 저장한 화면 · 사진을 지운다 — 로그아웃 · 둘러보기에서 갈아탈 때.
 * 같은 기기를 다른 사람이 쓰면 앞 사람의 여행 화면 · 바우처가 남지 않게. 빌드 파일(미리 저장, precache)은 남긴다.
 * Cache Storage 를 못 쓰는 환경(보안 연결이 아님 · 일부 사생활 보호 모드)에서는 조용히 넘어간다
 */
export async function clearOfflineCache(): Promise<void> {
  try {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !n.includes("precache")).map((n) => caches.delete(n)));
  } catch {
    // 저장소가 없으면 지울 것도 없다
  }
}
