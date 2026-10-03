export type TitleComponent = React.ComponentType<{
  className?: string;
  children: React.ReactNode;
}>;

type DefaultTitleProps = {
  className?: string;
  children: React.ReactNode;
};

/** 감싸는 쪽이 제목 컴포넌트를 넘기지 않았을 때(전체 화면 페이지) */
export function DefaultTitle({ className, children }: DefaultTitleProps) {
  return <h1 className={className}>{children}</h1>;
}
