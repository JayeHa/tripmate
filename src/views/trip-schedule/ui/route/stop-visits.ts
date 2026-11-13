import type { DayMode, RouteDay, RouteTone } from "@/entities/schedule-item";

import { planOfRoute, recordOfRoute, type RecordStop } from "../../lib/record";
import type { ScheduleRecord } from "../../model/use-schedule-record";
import type { StopVisit } from "./stop-record";

/**
 * 하루 노선도의 역마다 방문 모양 — 계획 · 기록 모드 모두. tones 는 머리 개수 줄이 함께 쓴다.
 * - 구간 선: 패스한 역에 닿으면 회색 파선, 기록 모드는 도착 역을 다녀왔으면 초록 · 아니면 남은 회색
 * - 방문 토글은 누를 수 있는 날(여행 중 오늘까지)의 장소만. 기록 모드의 표시 없는 첫 장소는 큰 버튼
 * - 다녀온 장소(기록 모드)는 별점 줄 · 기록
 */
export function stopVisitsOf(
  route: RouteDay,
  mode: DayMode,
  record: ScheduleRecord,
  day: number,
): { visits: StopVisit[]; tones: RecordStop[] } {
  const when = record.dayOf(day);
  const rec = mode === "record";
  const tones = (rec ? recordOfRoute : planOfRoute)(route, record.marks, when);
  const pass = (i: number) => tones[i]?.tone === "pass";
  const lineTone = (i: number): RouteTone => {
    if (!rec) return "plan";
    return tones[i]?.reached ? "done" : "todo";
  };
  const visits = route.stops.map((stop, i): StopVisit => {
    const id = stop.row.item.id;
    const { tone, next, dim } = tones[i];
    const done = rec && tone === "done";
    const toggle = stop.row.kind === "place" && when !== "other";
    return {
      record: rec,
      tone,
      dim,
      inTone: lineTone(i),
      outTone: lineTone(i + 1),
      inPass: pass(i) || pass(i - 1),
      outPass: pass(i) || pass(i + 1),
      markedAt: record.markedAt(id),
      toggle: toggle
        ? { value: record.marks[id] ?? null, onChange: (m) => record.setMark(id, m) }
        : undefined,
      onNow: rec && next ? (m) => record.setMark(id, m) : undefined,
      rating: done
        ? {
            stars: record.stars[id] ?? 0,
            repeat: record.visits[id] ?? 1,
            crew: record.crew(id),
            onRate: (n) => record.rate(id, n),
          }
        : undefined,
      note: done ? noteOf(record, id) : undefined,
    };
  });
  return { visits, tones };
}

/** 다녀온 장소 카드의 기록 — 글 · 사진(썸네일 주소) · 기록 창 열기 */
function noteOf(record: ScheduleRecord, id: string): NonNullable<StopVisit["note"]> {
  return {
    body: record.notes[id] ?? "",
    photos: (record.photos[id] ?? []).map((p) => ({
      id: p.id,
      src: record.thumbUrls[p.thumb_key],
      caption: p.caption,
    })),
    onWrite: () => record.openWrite(id),
  };
}
