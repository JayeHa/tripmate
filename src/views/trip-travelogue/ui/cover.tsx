import type { CrewMember } from "@/entities/schedule-item";
import type { Trip } from "@/entities/trip";
import { dateRangeLabel } from "@/shared/lib/days";

type CoverProps = {
  trip: Trip;
  totals: { places: number; media: number; notes: number; average: number | null };
  members: readonly CrewMember[];
  /** 여행 중 — 덧말에 「여행 중」 */
  traveling: boolean;
};

/**
 * 여행기 커버 — 여행 이름 26/800 · 「기간 · 일행 이름 · 여행 중」 13 회색 · 숫자 줄(다녀온 곳 · 사진 · 기록 · 평균 별점, 15/800 + 12).
 * 혼자 여행이면 이름을 적지 않는다. 별점은 매긴 장소들의 일행 평균, 없으면 「–」
 */
export function Cover({ trip, totals, members, traveling }: CoverProps) {
  const meta = [
    dateRangeLabel(trip.start_date, trip.end_date),
    members.length > 1 && members.map((m) => m.name).join(" · "),
    traveling && "여행 중",
  ].filter(Boolean);
  const stats = [
    { label: "다녀온 곳", value: String(totals.places) },
    { label: "사진", value: String(totals.media) },
    { label: "기록", value: String(totals.notes) },
    { label: "평균 별점", value: totals.average === null ? "–" : `★ ${totals.average}` },
  ];
  return (
    <section className="flex flex-col gap-4 pt-5 pb-2 lg:pt-7">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink-900">{trip.title}</h2>
        <p className="text-[13px] text-route-walk-text">{meta.join(" · ")}</p>
      </div>
      <dl className="grid grid-cols-4 rounded-card bg-white py-3.5 lg:bg-surface-sunken">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse items-center gap-0.5">
            <dt className="text-xs text-route-card-meta">{s.label}</dt>
            <dd className="text-[15px] font-extrabold text-ink-900 tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
