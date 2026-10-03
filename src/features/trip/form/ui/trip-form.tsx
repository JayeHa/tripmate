"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";

import { tripFormSchema, type TripFormValues } from "@/entities/trip";
import { CURRENCY_OPTIONS } from "@/shared/lib/money";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Props = {
  initial?: TripFormValues;
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: TripFormValues) => void;
};

const EMPTY: TripFormValues = {
  title: "",
  start_date: "",
  end_date: "",
  home_currency: "KRW",
  rates: [],
};

type RateDraft = { currency: string; unit: string; value: string };

export function TripForm({ initial, submitLabel, pending, onSubmit }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? EMPTY.title,
    start_date: initial?.start_date ?? "",
    end_date: initial?.end_date ?? "",
    home_currency: initial?.home_currency ?? "KRW",
  });
  const [rates, setRates] = useState<RateDraft[]>(
    (initial?.rates ?? []).map((r) => ({
      currency: r.currency,
      unit: String(r.unit),
      value: String(r.value),
    })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addRate() {
    const used = new Set([form.home_currency, ...rates.map((r) => r.currency)]);
    const next = CURRENCY_OPTIONS.find((c) => !used.has(c)) ?? "";
    setRates((r) => [...r, { currency: next, unit: next === "JPY" ? "100" : "1", value: "" }]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = tripFormSchema.safeParse({
      ...form,
      rates: rates.map((r) => ({
        currency: r.currency,
        unit: Number(r.unit),
        value: Number(r.value),
      })),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="여행 이름" error={errors.title}>
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="예: 도쿄 가을 여행"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="시작일" error={errors.start_date}>
          <Input
            type="date"
            value={form.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </Field>
        <Field label="종료일" error={errors.end_date}>
          <Input
            type="date"
            value={form.end_date}
            min={form.start_date || undefined}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </Field>
      </div>

      <Field label="기준 화폐 (정산에 사용)" error={errors.home_currency}>
        <select
          className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
          value={form.home_currency}
          onChange={(e) => set("home_currency", e.target.value)}
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>환율 (해외 여행이면 추가)</Label>
          <Button type="button" variant="ghost" size="sm" onClick={addRate}>
            <Plus /> 추가
          </Button>
        </div>
        {rates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            국내 여행이면 비워두세요. 지출은 {form.home_currency}로만 기록됩니다.
          </p>
        )}
        {rates.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              className="h-9 w-24 rounded-lg border border-input bg-transparent px-2 text-sm"
              value={r.currency}
              onChange={(e) =>
                setRates((rs) =>
                  rs.map((x, j) => (j === i ? { ...x, currency: e.target.value } : x)),
                )
              }
            >
              {CURRENCY_OPTIONS.filter((c) => c !== form.home_currency).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Input
              type="number"
              inputMode="decimal"
              className="w-20"
              value={r.unit}
              onChange={(e) =>
                setRates((rs) => rs.map((x, j) => (j === i ? { ...x, unit: e.target.value } : x)))
              }
            />
            <span className="text-sm">=</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="900"
              value={r.value}
              onChange={(e) =>
                setRates((rs) => rs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
              }
            />
            <span className="text-sm text-muted-foreground">{form.home_currency}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="삭제"
              onClick={() => setRates((rs) => rs.filter((_, j) => j !== i))}
            >
              <X />
            </Button>
          </div>
        ))}
        {errors.rates && <p className="text-sm text-destructive">{errors.rates}</p>}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="mt-2">
        {pending ? "저장 중..." : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
