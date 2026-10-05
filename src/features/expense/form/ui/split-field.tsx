import type { TripMember } from "@/entities/trip-member";
import { formatMoney } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import type { SplitMode } from "../model/start-values";
import type { ExpenseFormState } from "../model/use-expense-form";

type SplitFieldProps = {
  members: TripMember[];
  form: ExpenseFormState;
};

/** 분배 방식 — n빵이면 나눈 몫 미리보기, 직접 입력이면 사람마다 금액 칸과 합계 차이 */
export function SplitField({ members, form }: SplitFieldProps) {
  const nameOf = (id: string) => members.find((m) => m.user_id === id)?.profile.display_name;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>분배 방식</Label>
        <ToggleGroup
          value={[form.splitMode]}
          onValueChange={(v) => v[0] && form.setSplitMode(v[0] as SplitMode)}
          size="sm"
        >
          <ToggleGroupItem value="equal">n빵</ToggleGroupItem>
          <ToggleGroupItem value="custom">직접 입력</ToggleGroupItem>
        </ToggleGroup>
      </div>
      {form.splitMode === "equal" && form.equalPreview && (
        <ul className="rounded-lg bg-muted px-3 py-2 text-sm">
          {form.equalPreview.map((s) => (
            <li key={s.userId} className="flex justify-between">
              <span>{nameOf(s.userId)}</span>
              <span>{formatMoney(s.share, form.currency)}</span>
            </li>
          ))}
        </ul>
      )}
      {form.splitMode === "custom" && <CustomShares nameOf={nameOf} form={form} />}
    </div>
  );
}

type CustomSharesProps = {
  nameOf: (id: string) => string | null | undefined;
  form: ExpenseFormState;
};

/** 직접 나누기 — 나눌 사람마다 금액 칸, 아래에 합계와 금액의 차이 */
function CustomShares({ nameOf, form }: CustomSharesProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
      {form.participants.map((id) => (
        <div key={id} className="flex items-center gap-2 text-sm">
          <span className="flex-1 truncate">{nameOf(id)}</span>
          <Input
            type="number"
            inputMode="decimal"
            step={form.decimals === 0 ? 1 : 0.01}
            className="w-32 bg-background"
            value={form.custom[id] ?? ""}
            onChange={(e) => form.setCustom((c) => ({ ...c, [id]: e.target.value }))}
          />
        </div>
      ))}
      <p
        className={cn(
          "text-right text-xs",
          form.customDiff === 0 ? "text-muted-foreground" : "text-destructive",
        )}
      >
        {splitDiffLabel(form.customDiff, form.currency)}
      </p>
    </div>
  );
}

/** 직접 나누기 합계와 금액의 차이 안내 */
function splitDiffLabel(diff: number, currency: string) {
  if (diff === 0) return "합계가 맞아요";
  if (diff > 0) return `${formatMoney(diff, currency)} 부족`;
  return `${formatMoney(-diff, currency)} 초과`;
}
