/**
 * 여행 홈을 서버에서 받는 동안 — 빈 자리. 여행 목록 카드가 여는 첫 화면이라, 이 파일이 있어야 누르자마자
 * 여행 화면(PC 헤더 · 하단 탭)으로 넘어간다. 홈은 아직 자리만 잡아 둔 화면이라 뼈대는 홈을 만들 때 그린다
 */
export default function Loading() {
  return <main aria-busy="true" className="flex flex-1" />;
}
