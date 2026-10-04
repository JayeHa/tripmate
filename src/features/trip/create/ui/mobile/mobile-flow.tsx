import type { TripCreateState } from "../../model/use-trip-create";
import type { TitleComponent } from "../parts/title";
import { MobileCityStep } from "./mobile-city-step";
import { MobileDateStep } from "./mobile-date-step";

type MobileFlowProps = {
  state: TripCreateState;
  onClose: () => void;
  Title: TitleComponent;
};

/** 모바일 전체 화면 */
export function MobileFlow({ state, onClose, Title }: MobileFlowProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {state.step === "city" ? (
        <MobileCityStep state={state} onClose={onClose} Title={Title} />
      ) : (
        <MobileDateStep state={state} Title={Title} />
      )}
    </div>
  );
}
