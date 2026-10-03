import type { TripCreateState } from "../model/use-trip-create";
import { MobileFlow } from "./mobile/mobile-flow";
import { DefaultTitle, type TitleComponent } from "./parts/title";
import { PcFlow } from "./pc/pc-flow";

type Props = {
  /** mobile = 전체 화면(5b·5c), pc = 760×660 모달 안(6b·6c). 크기는 감싸는 쪽이 정한다. */
  layout: "mobile" | "pc";
  /** useTripCreate 의 상태. 감싸는 화면이 들고 있어 레이아웃이 바뀌어도 이어진다. */
  state: TripCreateState;
  onClose: () => void;
  /** 감싸는 쪽의 제목 컴포넌트. 다이얼로그면 DialogTitle 을 넘겨 접근성 이름을 잇는다. */
  Title?: TitleComponent;
};

/** 새 여행 만들기: 도시 다중 선택 → 출발·도착일 → 생성. 레이아웃만 고른다 */
export function TripCreateFlow({ layout, state, onClose, Title = DefaultTitle }: Props) {
  const Flow = layout === "mobile" ? MobileFlow : PcFlow;
  return <Flow state={state} onClose={onClose} Title={Title} />;
}
