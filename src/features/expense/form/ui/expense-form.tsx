"use client";

import { useMemo, useState } from "react";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  expenseFormSchema,
  type ExpenseFormValues,
} from "@/entities/expense";
import type { ScheduleItem } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import type { TripMember } from "@/entities/trip-member";
import { dayCount, dayIndexToDate, dayLabel } from "@/shared/lib/days";
import { decimalsOf, formatMoney, splitEqual, validateCustomShares } from "@/shared/lib/money";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

type Props = {
  trip: Trip;
  members: TripMember[];
  items?: ScheduleItem[];
  currentUserId: string;
  initial?: ExpenseFormValues;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: ExpenseFormValues) => void;
};

export function ExpenseForm({
  trip,
  members,
  items = [],
  currentUserId,
  initial,
  submitLabel,
  pending,
  onSubmit,
}: Props) {
  const currencies = useMemo(
    () => [trip.home_currency, ...Object.keys(trip.exchange_rates)],
    [trip],
  );
  const memberIds = members.map((m) => m.user_id);

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [currency, setCurrency] = useState(initial?.currency ?? currencies[currencies.length - 1]);
  const [payerId, setPayerId] = useState(initial?.payer_id ?? currentUserId);
  const [participants, setParticipants] = useState<string[]>(initial?.participant_ids ?? memberIds);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">(initial?.split_mode ?? "equal");
  const [custom, setCustom] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.entries(initial?.custom_shares ?? {}).map(([k, v]) => [k, String(v)]),
    ),
  );
  const [category, setCategory] = useState<ExpenseFormValues["category"]>(
    initial?.category ?? "food",
  );
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [spentOn, setSpentOn] = useState(initial?.spent_on ?? trip.start_date);
  const [itemId, setItemId] = useState<string>(initial?.schedule_item_id ?? "");
  const [error, setError] = useState<string | null>(null);

  const numAmount = Number(amount) || 0;
  const decimals = decimalsOf(currency);

  const equalPreview = useMemo(() => {
    if (numAmount <= 0 || participants.length === 0) return null;
    return splitEqual(numAmount, currency, participants);
  }, [numAmount, currency, participants]);

  const customSum = participants.reduce((acc, id) => acc + (Number(custom[id]) || 0), 0);
  const customDiff = Math.round((numAmount - customSum) * 10 ** decimals) / 10 ** decimals;

  function toggleParticipant(id: string) {
    setParticipants((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const raw: ExpenseFormValues = {
      amount: numAmount,
      currency,
      payer_id: payerId,
      participant_ids: participants,
      split_mode: splitMode,
      custom_shares:
        splitMode === "custom"
          ? Object.fromEntries(participants.map((id) => [id, Number(custom[id]) || 0]))
          : undefined,
      category,
      memo: memo || undefined,
      spent_on: spentOn,
      schedule_item_id: itemId || null,
    };
    const parsed = expenseFormSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인하세요");
      return;
    }
    if (splitMode === "custom") {
      const r = validateCustomShares(
        numAmount,
        currency,
        participants.map((id) => ({ userId: id, share: Number(custom[id]) || 0 })),
      );
      if (!r.ok) {
        setError(r.error);
        return;
      }
    }
    setError(null);
    onSubmit(parsed.data);
  }

  const dayItems = items.filter((it) => dayIndexToDate(trip.start_date, it.day_index) === spentOn);

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>금액</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step={decimals === 0 ? 1 : 0.01}
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="h-12 flex-1 text-2xl font-semibold"
            autoFocus={!initial}
          />
          {currencies.length > 1 ? (
            <select
              className="h-12 w-24 rounded-lg border border-input bg-transparent px-2 text-base"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <span className="flex h-12 items-center px-2 text-base text-muted-foreground">
              {currency}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>카테고리</Label>
        <ToggleGroup
          value={[category]}
          onValueChange={(v) => v[0] && setCategory(v[0] as ExpenseFormValues["category"])}
          className="flex-wrap justify-start"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <ToggleGroupItem key={c} value={c} size="sm">
              {EXPENSE_CATEGORY_LABEL[c]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>결제한 사람</Label>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Chip
              key={m.user_id}
              active={payerId === m.user_id}
              onClick={() => setPayerId(m.user_id)}
            >
              {m.profile.display_name ?? "이름 없음"}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label>나눌 사람</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground underline"
            onClick={() =>
              setParticipants(participants.length === memberIds.length ? [] : memberIds)
            }
          >
            {participants.length === memberIds.length ? "모두 해제" : "모두 선택"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Chip
              key={m.user_id}
              active={participants.includes(m.user_id)}
              onClick={() => toggleParticipant(m.user_id)}
            >
              {m.profile.display_name ?? "이름 없음"}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>분배 방식</Label>
          <ToggleGroup
            value={[splitMode]}
            onValueChange={(v) => v[0] && setSplitMode(v[0] as "equal" | "custom")}
            size="sm"
          >
            <ToggleGroupItem value="equal">n빵</ToggleGroupItem>
            <ToggleGroupItem value="custom">직접 입력</ToggleGroupItem>
          </ToggleGroup>
        </div>
        {splitMode === "equal" && equalPreview && (
          <ul className="rounded-lg bg-muted px-3 py-2 text-sm">
            {equalPreview.map((s) => (
              <li key={s.userId} className="flex justify-between">
                <span>{members.find((m) => m.user_id === s.userId)?.profile.display_name}</span>
                <span>{formatMoney(s.share, currency)}</span>
              </li>
            ))}
          </ul>
        )}
        {splitMode === "custom" && (
          <div className="flex flex-col gap-2 rounded-lg bg-muted p-3">
            {participants.map((id) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">
                  {members.find((m) => m.user_id === id)?.profile.display_name}
                </span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step={decimals === 0 ? 1 : 0.01}
                  className="w-32 bg-background"
                  value={custom[id] ?? ""}
                  onChange={(e) => setCustom((c) => ({ ...c, [id]: e.target.value }))}
                />
              </div>
            ))}
            <p
              className={cn(
                "text-right text-xs",
                customDiff === 0 ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {splitDiffLabel(customDiff, currency)}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>날짜</Label>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={spentOn}
            onChange={(e) => {
              setSpentOn(e.target.value);
              setItemId("");
            }}
          >
            {Array.from(
              { length: Math.max(1, dayCount(trip.start_date, trip.end_date)) },
              (_, i) => (
                <option key={i} value={dayIndexToDate(trip.start_date, i)}>
                  Day {i + 1} · {dayLabel(trip.start_date, i)}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>연결 일정 (선택)</Label>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
          >
            <option value="">없음</option>
            {dayItems.map((it) => (
              <option key={it.id} value={it.id}>
                {it.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>메모 (선택)</Label>
        <Input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: 이치란 라멘 3인"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "저장 중..." : submitLabel}
      </Button>
    </form>
  );
}

type ChipProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** 직접 나누기 합계와 금액의 차이 안내 */
function splitDiffLabel(diff: number, currency: string) {
  if (diff === 0) return "합계가 맞아요";
  if (diff > 0) return `${formatMoney(diff, currency)} 부족`;
  return `${formatMoney(-diff, currency)} 초과`;
}
