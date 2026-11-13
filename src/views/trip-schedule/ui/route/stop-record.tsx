import {
  nextStars,
  RatingPicker,
  type RouteTone,
  type StopTone,
  type VisitMark,
} from "@/entities/schedule-item";

import type { CrewRating } from "../../lib/crew";
import { CrewRatingRow } from "./crew-rating-row";
import { type CardPhoto, RecordPhotoRow } from "./record-photo-row";

/** 역 하나의 방문 모양 — 계획 · 기록 모드 모두 노선도 카드가 받는다 */
export type StopVisit = {
  /** 기록 모드 — 고른 카드 테두리 초록, 다녀온 곳의 별점 · 기록 */
  record: boolean;
  tone: StopTone;
  /** 계획 모드 · 여행 중 오늘 다녀온 곳 — 흐리게 + 「✓ 다녀옴」 칩 */
  dim: boolean;
  /** 들어오는 · 나가는 구간 — 글자 · 선 색(계획 수단 색 · 기록 지나온 초록 / 남은 회색) */
  inTone: RouteTone;
  outTone: RouteTone;
  /** 들어오는 · 나가는 구간이 패스한 역에 닿는다 — 선을 회색 파선으로 */
  inPass: boolean;
  outPass: boolean;
  /** 다녀왔어요를 누른 시각(ISO) — 기록 모드의 「10:52 도착」 */
  markedAt: string | null;
  /** 펼친 카드의 방문 토글 — 누를 수 있는 날(여행 중 오늘까지)의 장소만 */
  toggle?: { value: VisitMark | null; onChange: (next: VisitMark | null) => void };
  /** 기록 모드 · 그날 표시 없는 첫 장소 — 큰 「패스」 · 「✓ 다녀왔어요」(펼쳐도 토글 줄은 없다) */
  onNow?: (mark: VisitMark) => void;
  /** 다녀온 장소(기록 모드) — 내 별점(0 = 안 매김) · 이 여행에서 그 장소를 들르는 횟수와 바꾸기 */
  rating?: RatingRowProps;
  /** 다녀온 장소(기록 모드) — 일행과 함께 쓰는 기록 글(없으면 "") · 사진과 기록 창 열기 */
  note?: RecordNoteProps;
};

/** 지금 여기 카드 첫 줄 오른쪽 칩 — 초록 · 흰 11/800 · r5 */
export function HereChip() {
  return (
    <span className="rounded-[5px] bg-visited px-1.5 py-0.5 text-[11px] font-extrabold text-white">
      지금 여기
    </span>
  );
}

type RatingRowProps = {
  stars: number;
  /** 이 여행에서 그 장소를 들르는 횟수 — 2 이상이면 아래에 반복 안내 */
  repeat: number;
  /** 「일행」 줄 — 혼자 여행이면 null */
  crew: CrewRating | null;
  onRate: (stars: number) => void;
};

/**
 * 다녀온 장소 카드 안 별점 줄 — 「내 별점」(안 매겼으면 「별점 남기기」) 12/700 + 별 24 + 점수 문구.
 * 별을 누르면 창 없이 바로 저장하고, 같은 점수를 다시 누르면 지운다.
 * 일행이 있으면 아래에 「일행」 줄(사람마다 별점 · 평균).
 * 별점은 여행의 장소마다 하나라 같은 장소를 여러 번 들르면 맨 아래에 「🔁 이 여행에서 3번 들러요 · 별점은 하나예요」
 */
export function RatingRow({ stars, repeat, crew, onRate }: RatingRowProps) {
  return (
    <>
      <RatingLine stars={stars} onRate={onRate} />
      {crew && <CrewRatingRow {...crew} />}
      {repeat > 1 && (
        <p className="truncate text-[11px] text-route-card-meta">
          🔁 이 여행에서 {repeat}번 들러요 · 별점은 하나예요
        </p>
      )}
    </>
  );
}

/** 「내 별점」 라벨 + 별 */
function RatingLine({ stars, onRate }: Pick<RatingRowProps, "stars" | "onRate">) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="w-15.5 shrink-0 text-xs font-bold text-route-walk-text">
        {stars > 0 ? "내 별점" : "별점 남기기"}
      </span>
      <RatingPicker
        value={stars}
        onPick={(n) => onRate(nextStars(stars, n))}
        size="card"
        label="내 별점"
      />
    </div>
  );
}

type RecordNoteProps = { body: string; photos: readonly CardPhoto[]; onWrite: () => void };

/**
 * 다녀온 장소 카드 안 기록 — 사진 줄 · 글(따옴표 · 3줄 말줄임) + 「✎ 기록 수정」, 둘 다 없으면 점선 「+ 기록 · 사진 남기기」.
 * 모두 기록 창을 연다
 */
export function RecordNote({ body, photos, onWrite }: RecordNoteProps) {
  if (!body && photos.length === 0) {
    return (
      <button
        type="button"
        onClick={onWrite}
        className="flex h-8.5 w-full items-center justify-center rounded-button border-[1.5px] border-dashed border-route-branch text-[13px] font-bold text-route-sub"
      >
        + 기록 · 사진 남기기
      </button>
    );
  }
  return (
    <>
      {photos.length > 0 && <RecordPhotoRow photos={photos} onOpen={onWrite} />}
      {body && (
        <p className="line-clamp-3 rounded-button bg-visit-note-bg px-2.5 py-2 text-[13px]/[1.45] wrap-break-word whitespace-pre-line text-ink-700">
          “{body}”
        </p>
      )}
      <button
        type="button"
        onClick={onWrite}
        className="self-start text-xs font-bold text-route-card-meta"
      >
        ✎ 기록 수정
      </button>
    </>
  );
}
