/** 오프라인인데 저장해 둔 화면이 없을 때(서비스 워커의 대체 페이지) */
export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <p className="text-[17px] font-extrabold text-ink-900">오프라인이에요</p>
      <p className="text-sm text-ink-450">
        이 화면은 아직 저장해 두지 않았어요. 연결되면 다시 열어 주세요.
      </p>
    </main>
  );
}
