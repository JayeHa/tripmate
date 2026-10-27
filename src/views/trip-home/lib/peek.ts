import { type ChecklistItem, dueDateText, dueView } from "@/entities/checklist";
import type { Expense } from "@/entities/expense";
import { itemName, type ScheduleItem } from "@/entities/schedule-item";
import { type Voucher, voucherNumbers } from "@/entities/voucher";
import { dayLabel } from "@/shared/lib/days";
import { formatMoney } from "@/shared/lib/money";
import { OPEN_PARAM } from "@/shared/lib/use-open-param";

/** 미리 보기 창의 한 줄 — 「마감 · 10/27(화) · 오늘」 */
export type PeekFact = { label: string; value: string };

/**
 * 홈 카드의 줄을 눌렀을 때 홈 위에 띄우는 미리 보기 — 무엇인지(heading) · 제목 · 사실 몇 줄 · 글(메모 · 설명),
 * 아래 버튼은 그 항목이 사는 화면으로 가서 상세를 연다
 */
export type Peek = {
  heading: string;
  title: string;
  facts: PeekFact[];
  /** 메모 · 설명. 빈 문자열이면 칸을 그리지 않는다 */
  body: string;
  /** ★ 중요 메모 — 글 칸을 노란 메모 색으로 */
  important?: true;
  /** 「일정에서 보기」 — forward 면 한 단계 안으로(비용 상세), 아니면 옆 탭으로 가는 전환 */
  link: { label: string; href: string; forward?: true };
};

/** 미리 보기를 만들 때 쓰는 여행 정보 */
export type PeekContext = { tripId: string; startDate: string; today: string };

/** 그 일정의 상세를 열고 시작하는 일정 화면 주소 — 그 날로 스크롤한다 */
function scheduleHref(tripId: string, item: ScheduleItem): string {
  return `/trips/${tripId}/schedule?day=${item.day_index}&${OPEN_PARAM}=${item.id}`;
}

/** 「day 2 · 11.1 (일)」 */
function dayFact(startDate: string, item: ScheduleItem): PeekFact {
  return {
    label: "날짜",
    value: `day ${item.day_index + 1} · ${dayLabel(startDate, item.day_index)}`,
  };
}

/** 마감 임박의 체크리스트 할 일 — 마감 · 메모, 「노트에서 보기」 는 그 할 일의 상세를 연다 */
export function checklistPeek(item: ChecklistItem, ctx: PeekContext): Peek {
  return {
    heading: "체크리스트",
    title: item.title,
    facts: item.due_date ? [{ label: "마감", value: dueView(item.due_date, ctx.today).text }] : [],
    body: item.body?.trim() ?? "",
    link: {
      label: "노트에서 보기",
      href: `/trips/${ctx.tripId}/notes?tab=checklist&${OPEN_PARAM}=${item.id}`,
    },
  };
}

/** 고정한 바우처 — 번호(누구 것인지는 상세에서) · 사용일 · 메모, 「노트에서 보기」 는 그 바우처 상세 */
export function voucherPeek(voucher: Voucher, ctx: PeekContext): Peek {
  const facts: PeekFact[] = voucherNumbers(voucher).map((n) => ({
    label: n.label,
    value: n.value,
  }));
  if (voucher.use_date) facts.push({ label: "사용일", value: dueDateText(voucher.use_date) });
  return {
    heading: "바우처",
    title: voucher.title,
    facts,
    body: voucher.memo.trim(),
    link: {
      label: "노트에서 보기",
      href: `/trips/${ctx.tripId}/notes?tab=voucher&${OPEN_PARAM}=${voucher.id}`,
    },
  };
}

/** 마감 임박의 결제 예정 비용 — 금액 · 결제 예정일 · 메모, 「가계부에서 보기」 는 비용 상세 */
export function paymentPeek(expense: Expense, ctx: PeekContext): Peek {
  const facts: PeekFact[] = [
    { label: "금액", value: formatMoney(Number(expense.amount), expense.currency) },
  ];
  if (expense.due_date)
    facts.push({ label: "결제 예정", value: dueView(expense.due_date, ctx.today).text });
  return {
    heading: "결제 예정",
    title: expense.name,
    facts,
    body: expense.memo?.trim() ?? "",
    link: {
      label: "가계부에서 보기",
      href: `/trips/${ctx.tripId}/expenses/${expense.id}`,
      forward: true,
    },
  };
}

/** 예약 필요 일정 — 날짜 · 시간 · 설명, 「일정에서 보기」 는 그 날의 일정 상세 */
export function schedulePeek(item: ScheduleItem, ctx: PeekContext): Peek {
  const facts = [dayFact(ctx.startDate, item)];
  if (item.start_time) facts.push({ label: "시간", value: item.start_time.slice(0, 5) });
  return {
    heading: "예약 필요 일정",
    title: itemName(item),
    facts,
    body: item.description?.trim() ?? "",
    link: { label: "일정에서 보기", href: scheduleHref(ctx.tripId, item) },
  };
}

/**
 * 고정한 메모 — 어느 일정(날짜 메모면 그 날)의 메모인지와 글 전체. ★ 중요면 글 칸이 노랗다.
 * 「일정에서 보기」 는 장소 메모면 그 일정 상세, 날짜 메모면 날짜 메모 창을 연다
 */
export function memoPeek(
  item: ScheduleItem,
  memo: { body: string; starred: boolean },
  ctx: PeekContext,
): Peek {
  return {
    heading: "고정한 메모",
    title: item.kind === "note" ? `day ${item.day_index + 1} 메모` : itemName(item),
    facts: [dayFact(ctx.startDate, item)],
    body: memo.body,
    ...(memo.starred && { important: true as const }),
    link: { label: "일정에서 보기", href: scheduleHref(ctx.tripId, item) },
  };
}
