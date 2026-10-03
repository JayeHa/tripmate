import { CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

/**
 * 예약 상태 칩. 장소 카드의 제목 위에 놓는다.
 * 상태는 세 가지뿐이고, 지정하지 않으면 「상태 없음」이라 칩을 그리지 않는다.
 * (design-system.md · 확정 이후 변경)
 */
export const STATUS_KINDS = ["ok", "wait", "opt"] as const;
export type StatusKind = (typeof STATUS_KINDS)[number];

const STATUS = {
  ok: { label: "예약 확정", icon: CircleCheck, className: "bg-status-ok-bg text-status-ok" },
  wait: { label: "예약 필요", icon: CircleAlert, className: "bg-status-wait-bg text-status-wait" },
  opt: { label: "임시", icon: CircleDashed, className: "bg-status-opt-bg text-status-opt" },
} satisfies Record<StatusKind, { label: string; icon: typeof CircleCheck; className: string }>;

type Props = Omit<ComponentProps<"span">, "children"> & {
  kind: StatusKind;
  /** 기본 라벨 대신 쓸 문구. 비우면 상태의 기본 라벨을 쓴다. */
  label?: string;
};

function StatusBadge({ className, kind, label, ...props }: Props) {
  const { label: defaultLabel, icon: Icon, className: tone } = STATUS[kind];
  return (
    <span
      data-slot="status-badge"
      className={cn(
        "inline-flex h-6 w-fit items-center gap-1 rounded-xl px-2 text-xs font-extrabold whitespace-nowrap",
        tone,
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      {label ?? defaultLabel}
    </span>
  );
}

export { StatusBadge, STATUS as STATUS_META };
