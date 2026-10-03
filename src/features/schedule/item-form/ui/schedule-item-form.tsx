"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

import { type ScheduleItem, scheduleItemFormSchema } from "@/entities/schedule-item";
import { dayLabel } from "@/shared/lib/days";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

type Patch = { name: string; start_time: string | null; memo: string | null };

type Props = {
  item: ScheduleItem | null;
  startDate: string;
  totalDays: number;
  pending?: boolean;
  onClose: () => void;
  onSave: (patch: Patch) => void;
  onMoveDay: (dayIndex: number) => void;
  onDelete: () => void;
};

export function ScheduleItemForm({ item, onClose, ...rest }: Props) {
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>일정 편집</SheetTitle>
          {item?.address && <SheetDescription>{item.address}</SheetDescription>}
        </SheetHeader>
        {item && <Fields key={item.id} item={item} {...rest} />}
      </SheetContent>
    </Sheet>
  );
}

function Fields({
  item,
  startDate,
  totalDays,
  pending,
  onSave,
  onMoveDay,
  onDelete,
}: Omit<Props, "item" | "onClose"> & { item: ScheduleItem }) {
  const [name, setName] = useState(item.name);
  const [time, setTime] = useState(item.start_time?.slice(0, 5) ?? "");
  const [memo, setMemo] = useState(item.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = scheduleItemFormSchema.safeParse({ name, start_time: time, memo });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력을 확인하세요");
      return;
    }
    onSave({
      name: parsed.data.name,
      start_time: parsed.data.start_time ? `${parsed.data.start_time}:00` : null,
      memo: parsed.data.memo || null,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex flex-col gap-1.5">
        <Label>이름</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>시간 (선택)</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>날짜 이동</Label>
          <select
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={item.day_index}
            onChange={(e) => onMoveDay(Number(e.target.value))}
          >
            {Array.from({ length: totalDays }, (_, i) => (
              <option key={i} value={i}>
                Day {i + 1} · {dayLabel(startDate, i)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>메모 (선택)</Label>
        <Textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예약 번호, 영업시간, 가는 방법..."
          rows={3}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button type="button" variant="outline" size="icon" aria-label="삭제" />}
          >
            <Trash2 />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이 일정을 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>
                “{item.name}”이(가) 일정에서 사라져요.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button type="submit" className="flex-1" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </Button>
      </div>
    </form>
  );
}
