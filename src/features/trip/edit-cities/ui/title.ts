/** 감싸는 쪽이 넘기는 제목 컴포넌트 — 다이얼로그면 DialogTitle 로 접근성 이름을 잇는다 */
export type TitleComponent = React.ComponentType<{
  className?: string;
  children: React.ReactNode;
}>;
