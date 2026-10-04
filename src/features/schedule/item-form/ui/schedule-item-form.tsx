"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";

import { itemName, type ScheduleItem, scheduleItemFormSchema } from "@/entities/schedule-item";
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
  /**
   * 이름을 고칠 수 있는지. place 의 이름은 장소 정보라 장소를 만든 사람만 바꾼다(0013).
   * false 면 이름 칸을 읽기 전용으로 두고 이유를 보인다.
   */
  canEditName: boolean;
  startDate: string;
  totalDays: number;
  pending?: boolean;
  onClose: () => void;
  onSave: (patch: Patch) => void;
  onMoveDay: (dayIndex: number) => void;
  /** 그날 안에서 한 칸 앞으로. 맨 앞이거나 이동 중이면 넘기지 않는다(버튼 비활성) */
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
};

export function ScheduleItemForm({ item, onClose, ...rest }: Props) {
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>일정 편집</SheetTitle>
          {item?.place?.address && <SheetDescription>{item.place.address}</SheetDescription>}
        </SheetHeader>
        {item && <Fields key={item.id} item={item} {...rest} />}
      </SheetContent>
    </Sheet>
  );
}

function Fields({
  item,
  canEditName,
  startDate,
  totalDays,
  pending,
  onSave,
  onMoveDay,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Omit<Props, "item" | "onClose"> & { item: ScheduleItem }) {
  const [name, setName] = useState(itemName(item));
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
        <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!canEditName} />
        {!canEditName && (
          <p className="text-xs text-muted-foreground">
            장소 이름은 장소를 만든 사람만 바꿀 수 있어요.
          </p>
        )}
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
      {/* 편집 모드(드래그)가 생기기 전까지 순서는 여기서 바꾼다 */}
      <div className="flex flex-col gap-1.5">
        <Label>순서</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" disabled={!onMoveUp} onClick={onMoveUp}>
            <ChevronUp /> 앞으로
          </Button>
          <Button type="button" variant="outline" disabled={!onMoveDown} onClick={onMoveDown}>
            <ChevronDown /> 뒤로
          </Button>
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
                “{itemName(item)}”이(가) 일정에서 사라져요.
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
