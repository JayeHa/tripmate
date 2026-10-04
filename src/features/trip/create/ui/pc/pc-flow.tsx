import type { TripCreateState } from "../../model/use-trip-create";
import type { TitleComponent } from "../parts/title";
import { PcCityStep } from "./pc-city-step";
import { PcDateStep } from "./pc-date-step";
import { PcFooter } from "./pc-footer";
import { PcHeader } from "./pc-header";

type PcFlowProps = {
  state: TripCreateState;
  onClose: () => void;
  Title: TitleComponent;
};

/** PC 760×660 모달 안. 크기는 감싸는 쪽이 정한다 */
export function PcFlow({ state, onClose, Title }: PcFlowProps) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <PcHeader state={state} onClose={onClose} Title={Title} />
      {state.step === "city" ? <PcCityStep state={state} /> : <PcDateStep state={state} />}
      <PcFooter state={state} />
    </div>
  );
}
