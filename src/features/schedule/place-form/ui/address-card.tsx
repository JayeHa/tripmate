import { MapPin } from "lucide-react";

import type { PlaceFormState } from "../model/use-place-form";

type AddressCardProps = {
  found: PlaceFormState["found"];
  /** 오른쪽 글자 버튼(②의 「위치 변경」). 없으면 주소만 */
  action?: { label: string; onClick: () => void };
};

/** 주소 줄 문구: 불러오는 중 · 실패 · 아직 없음 · 주소 */
function addressLine(found: PlaceFormState["found"]): string {
  if (found.busy) return "주소 확인 중…";
  if (found.failed) return "주소를 불러오지 못했어요. 지도를 조금 움직여 보세요.";
  return found.address ?? "지도를 움직이면 주소가 표시돼요";
}

/** 핀 위치 주소 카드: 한국어로 요청한 주소(일본은 로마자) + 현지어 작게 */
export function AddressCard({ found, action }: AddressCardProps) {
  const ready = !found.busy && !!found.address;
  return (
    <div className="flex items-start gap-2.5 rounded-card bg-surface-sunken px-3.5 py-3">
      <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`text-sm/normal font-semibold text-pretty ${ready ? "text-ink-900" : "text-ink-400"}`}
        >
          {addressLine(found)}
        </span>
        {ready && found.addressLocal && (
          <span className="text-xs/snug text-ink-400">{found.addressLocal}</span>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 text-[13px] font-bold text-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
