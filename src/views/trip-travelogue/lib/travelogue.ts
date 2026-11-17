import {
  type BoardPerson,
  type CrewMember,
  itemName,
  type PeopleStars,
  type PlaceCategory,
  placeKeyOf,
  type RouteStopData,
  segmentLabel,
  type VisitMarks,
  type VisitNotesByItem,
  type VisitPhoto,
  type VisitPhotosByItem,
  visitVideoOf,
} from "@/entities/schedule-item";

/** 장소 블록의 별점 줄 — 일행 평균 + 매긴 사람마다 별점. 같은 장소가 다시 나오면 없다 */
export type BlockRating = { average: number; people: BoardPerson[] };

/** 여행기 하루의 한 줄 */
export type Entry =
  /** 다녀온 곳 — 기록(글 · 사진 · 별점)이 하나라도 있으면 큰 블록, 없으면 한 줄(plain) */
  | {
      type: "place";
      id: string;
      time: string | null;
      emoji: string | null;
      name: string;
      category: PlaceCategory | null;
      plain: boolean;
      note: string | null;
      photos: readonly VisitPhoto[];
      rating: BlockRating | null;
    }
  /** 패스한 곳 — 회색 한 줄 */
  | { type: "pass"; id: string; time: string | null; emoji: string | null; name: string }
  /** 장소 사이 이동 「🚶 도보 11분」 */
  | { type: "move"; id: string; label: string };

/** 여행기의 하루 */
export type TravelogueDay = {
  day: number;
  /** 하루 요약. 비었으면 null — 제목 줄이 없다 */
  title: string | null;
  /** 오늘까지의 날(끝난 여행은 모든 날) — 아니면 「아직 다녀오지 않은 날이에요」 */
  open: boolean;
  entries: Entry[];
  /** 다녀온 곳 · 사진 · 영상 · 기록 글 수 */
  places: number;
  photos: number;
  videos: number;
  notes: number;
  /** 매긴 장소의 일행 평균을 다시 평균(소수 한 자리). 아무도 안 매겼으면 null */
  average: number | null;
  /** 그날 일행 평균이 가장 높은 장소 — 「베스트 ★4.5 이치란」 */
  best: { name: string; average: number } | null;
  /** 기록 글의 첫 줄, 앞의 두 개(일정 id 와 함께) */
  lines: { id: string; text: string }[];
  /** 하루 카드 콜라주 — 다녀온 곳 순서로 각 장소의 사진 · 영상(장소마다 대표가 먼저) */
  collage: VisitPhoto[];
  /** 여행 중 오늘이면 아직 표시 없는 첫 장소 이름 — 「지금 ○○에 있어요 · 이어서 쓰여요」 */
  here: string | null;
};

/** 여행기를 만들 기록 — 다녀감 · 글 · 사진 · 장소별 별점(일정 id → 사람별) · 멤버 · 나 */
export type TravelogueRecords = {
  marks: VisitMarks;
  notes: VisitNotesByItem;
  photos: VisitPhotosByItem;
  ratings: Readonly<Record<string, PeopleStars>>;
  members: readonly CrewMember[];
  me: string | null;
};

/** 하루를 만들 값 — 그날 노선도의 역(장소 · 항공편) · 하루 요약 · 열린 날인가 · 여행 중 오늘인가 */
export type DayInput = {
  day: number;
  stops: readonly RouteStopData[];
  summary: string | null;
  open: boolean;
  today: boolean;
};

const NO_PHOTOS: readonly VisitPhoto[] = [];

/** 평균 — 소수 한 자리. 비었으면 null */
function averageOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

/** 매긴 멤버(나 먼저, 그 뒤 멤버 순서)와 평균. 아무도 안 매겼으면 null. 멤버가 아닌 사람(나간 사람)은 세지 않는다 */
function ratingOf(r: TravelogueRecords, stars: PeopleStars | undefined): BlockRating | null {
  if (!stars) return null;
  const ordered = [
    ...r.members.filter((m) => m.id === r.me),
    ...r.members.filter((m) => m.id !== r.me),
  ];
  const people = ordered.flatMap((m): BoardPerson[] =>
    stars[m.id] === undefined ? [] : [{ ...m, stars: stars[m.id], me: m.id === r.me }],
  );
  const average = averageOf(people.map((p) => p.stars ?? 0));
  return average === null ? null : { average, people };
}

/** 다녀온 곳의 블록. 같은 장소가 앞에서 나왔으면(seen) 별점 줄은 없다 */
function placeEntry(stop: RouteStopData, r: TravelogueRecords, seen: Set<string>): Entry {
  const { item } = stop.row;
  const note = r.notes[item.id]?.body.trim() || null;
  const photos = r.photos[item.id] ?? NO_PHOTOS;
  const key = placeKeyOf(item);
  const repeat = key !== null && seen.has(key);
  if (key) seen.add(key);
  const rating = repeat ? null : ratingOf(r, r.ratings[item.id]);
  return {
    type: "place",
    id: item.id,
    time: stop.row.time,
    emoji: stop.row.emoji,
    name: itemName(item),
    category: stop.row.category,
    plain: note === null && photos.length === 0 && rating === null,
    note,
    photos,
    rating,
  };
}

/**
 * 그날 노선도 → 여행기 줄. 장소만 쓴다(항공편 · 메모는 없다). 다녀온 곳은 블록, 패스는 회색 한 줄, **표시 없는 곳은 없다**.
 * 이동은 노선도에서 바로 이어진 두 장소가 모두 보일 때만 그 사이에 둔다(가운데 숨은 곳이 있으면 거리를 모른다)
 */
function entriesOf(stops: readonly RouteStopData[], r: TravelogueRecords, seen: Set<string>) {
  const entries: Entry[] = [];
  let prev: RouteStopData | null = null;
  for (const stop of stops) {
    const mark = stop.row.kind === "place" ? r.marks[stop.row.item.id] : undefined;
    if (mark === undefined) {
      prev = null;
      continue;
    }
    const label = prev?.seg ? segmentLabel(prev.seg) : null;
    if (prev?.seg && label) {
      entries.push({
        type: "move",
        id: `${stop.row.item.id}-move`,
        label: `${prev.seg.icon} ${label}`,
      });
    }
    const { item } = stop.row;
    entries.push(
      mark === "visited"
        ? placeEntry(stop, r, seen)
        : {
            type: "pass",
            id: item.id,
            time: stop.row.time,
            emoji: stop.row.emoji,
            name: itemName(item),
          },
    );
    prev = stop;
  }
  return entries;
}

/** 여행기의 하루들 — 앞의 날부터. 별점 줄은 여행 전체에서 같은 장소가 처음 나올 때만 */
export function travelogueDays(days: readonly DayInput[], r: TravelogueRecords): TravelogueDay[] {
  const seen = new Set<string>();
  return days.map((d) => {
    const entries = d.open ? entriesOf(d.stops, r, seen) : [];
    const places = entries.flatMap((e) => (e.type === "place" ? [e] : []));
    const media = places.flatMap((p) => p.photos);
    const rated = places.flatMap((p) =>
      p.rating ? [{ name: p.name, average: p.rating.average }] : [],
    );
    const best = rated.reduce<TravelogueDay["best"]>(
      (b, p) => (!b || p.average > b.average ? p : b),
      null,
    );
    const next = d.today
      ? d.stops.find((s) => s.row.kind === "place" && !r.marks[s.row.item.id])
      : undefined;
    return {
      day: d.day,
      title: d.summary?.trim() || null,
      open: d.open,
      entries,
      places: places.length,
      photos: media.filter((p) => !visitVideoOf(p)).length,
      videos: media.filter((p) => visitVideoOf(p)).length,
      notes: places.filter((p) => p.note).length,
      average: averageOf(rated.map((p) => p.average)),
      best,
      lines: places
        .flatMap((p) => (p.note ? [{ id: p.id, text: p.note.split("\n")[0] }] : []))
        .slice(0, 2),
      collage: media,
      here: next ? itemName(next.row.item) : null,
    };
  });
}

/** 커버 숫자 줄 — 다녀온 곳 · 사진(영상 포함) · 기록 글 · 평균 별점(매긴 장소들의 일행 평균을 평균) */
export function travelogueTotals(days: readonly TravelogueDay[]) {
  const averages = days.flatMap((d) =>
    d.entries.flatMap((e) => (e.type === "place" && e.rating ? [e.rating.average] : [])),
  );
  return {
    places: days.reduce((n, d) => n + d.places, 0),
    media: days.reduce((n, d) => n + d.photos + d.videos, 0),
    notes: days.reduce((n, d) => n + d.notes, 0),
    average: averageOf(averages),
  };
}
