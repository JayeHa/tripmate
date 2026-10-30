import { onlineManager, type QueryClient } from "@tanstack/react-query";

import { checklistQuery, checklistTargetsQuery } from "@/entities/checklist";
import { cityAreasQuery, cityCatalogQuery, tripCitiesQuery } from "@/entities/city";
import {
  expensesQuery,
  settlementsQuery,
  tripGuestsQuery,
  tripReceiptsQuery,
} from "@/entities/expense";
import { flightsQuery } from "@/entities/flight";
import { fetchPackPhotoUrls, packListsQuery } from "@/entities/pack";
import {
  alternativesQuery,
  guidePlacesQuery,
  memosQuery,
  movesQuery,
  scheduleItemsQuery,
} from "@/entities/schedule-item";
import { staysQuery } from "@/entities/stay";
import { type Trip, tripQuery } from "@/entities/trip";
import { tripMembersQuery } from "@/entities/trip-member";
import { fetchVoucherUrls, vouchersQuery } from "@/entities/voucher";
import { todayISO } from "@/shared/lib/days";

import { saveThroughWorker } from "../api/save-through-worker";
import {
  type FailedItem,
  keepUntilDate,
  type PhotoTarget,
  photoTargets,
  type SavedTrip,
  tripPagePaths,
} from "../lib/offline-plan";
import { markRunning, savedTripOf, setSavedTrip } from "./offline-store";

/** 한 번에 받는 화면 · 사진 수 — 무료 서버를 몰아치지 않게 */
const POOL = 4;

/** 받을 것 하나 — 실패하면 그 항목이 「받지 못한 것」 에 남는다 */
type Task = { item: FailedItem; run: () => Promise<boolean> };

/**
 * 여행 데이터를 모두 새로 읽어 캐시에 넣는다 — 캐시는 기기(IndexedDB)에 남아 오프라인에서 화면이 쓴다.
 * 하나라도 실패하면 false(읽은 것은 남는다)
 */
export async function loadTripData(qc: QueryClient, tripId: string): Promise<boolean> {
  const fresh = { staleTime: 0 };
  const loads: Promise<unknown>[] = [
    qc.fetchQuery({ ...tripQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...tripMembersQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...scheduleItemsQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...alternativesQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...guidePlacesQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...movesQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...memosQuery(tripId), ...fresh }),
    qc.fetchQuery(cityCatalogQuery()),
    qc.fetchQuery(cityAreasQuery()),
    qc.fetchQuery({ ...tripCitiesQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...staysQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...flightsQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...checklistQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...checklistTargetsQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...vouchersQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...packListsQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...expensesQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...tripReceiptsQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...tripGuestsQuery(tripId), ...fresh }),
    qc.fetchQuery({ ...settlementsQuery(tripId), ...fresh }),
  ];
  const results = await Promise.allSettled(loads);
  return results.every((r) => r.status === "fulfilled");
}

/** 받을 화면 · 사진 전부 — 캐시에 들어온 데이터(비용 · 바우처 · 쇼핑)로 정한다 */
function planAll(qc: QueryClient, tripId: string): FailedItem[] {
  const expenses = qc.getQueryData(expensesQuery(tripId).queryKey) ?? [];
  const vouchers = qc.getQueryData(vouchersQuery(tripId).queryKey) ?? [];
  const items = qc.getQueryData(packListsQuery(tripId).queryKey)?.items ?? [];
  const pages = tripPagePaths(
    tripId,
    expenses.map((e) => e.id),
  ).map((path): FailedItem => ({ kind: "page", path }));
  const photos = photoTargets(vouchers, items).map((t): FailedItem => ({ kind: "photo", ...t }));
  return [...pages, ...photos];
}

/** 사진을 받을 서명 주소 — 버킷마다 한 번에. 받지 못하면 빈 묶음(그 사진들은 실패로 남는다) */
async function signedUrls(tripId: string, photos: PhotoTarget[]): Promise<Record<string, string>> {
  const keysOf = (bucket: PhotoTarget["bucket"]) =>
    photos.filter((p) => p.bucket === bucket).flatMap((p) => p.keys);
  const [vouchers, pack] = await Promise.all([
    fetchVoucherUrls(tripId, keysOf("vouchers")).catch(() => ({})),
    fetchPackPhotoUrls(tripId, keysOf("pack-photos")).catch(() => ({})),
  ]);
  return { ...vouchers, ...pack };
}

/** 받을 것들을 서비스 워커에 맡길 일로 바꾼다 */
async function toTasks(tripId: string, items: FailedItem[]): Promise<Task[]> {
  const photos = items.flatMap((i) => (i.kind === "photo" ? [i] : []));
  const urls = photos.length > 0 ? await signedUrls(tripId, photos) : {};
  return items.flatMap((item): Task[] => {
    if (item.kind === "page") {
      return [{ item, run: () => saveThroughWorker({ tripId, kind: "page", url: item.path }) }];
    }
    if (item.kind !== "photo") return [];
    const run = async () => {
      const results = await Promise.all(
        item.keys.map((key) =>
          urls[key]
            ? saveThroughWorker({ tripId, kind: "file", url: urls[key] })
            : Promise.resolve(false),
        ),
      );
      return results.every(Boolean);
    };
    return [{ item, run }];
  });
}

/** 일을 POOL 개씩 돌린다 — 오프라인이 되면 남은 일은 시도하지 않고 실패로 센다 */
async function runPool(tasks: Task[], onDone: (task: Task, ok: boolean) => void): Promise<void> {
  const queue = [...tasks];
  const worker = async () => {
    for (let task = queue.shift(); task; task = queue.shift()) {
      const ok = onlineManager.isOnline() && (await task.run());
      onDone(task, ok);
    }
  };
  await Promise.all(Array.from({ length: POOL }, worker));
}

/**
 * 여행 하나를 오프라인용으로 받는다 — 데이터 → 화면 · 사진. 진행은 기록(offline-store)에 쓰고, 끝난 기록을 돌려준다.
 * scope "failed" 면 지난번에 받지 못한 것만 다시 받는다. 화면 · 사진은 서비스 워커가 받아 여행의 칸에 넣는다
 */
export async function runOfflineDownload(
  qc: QueryClient,
  trip: Pick<Trip, "id" | "end_date">,
  scope: "all" | "failed",
): Promise<SavedTrip> {
  const prev = savedTripOf(trip.id);
  const only = scope === "failed" && prev ? prev.failed : null;
  const wantData = !only || only.some((f) => f.kind === "data");
  let progress: SavedTrip = {
    status: "busy",
    done: 0,
    // 처음 받기는 목록을 데이터를 읽은 뒤에 알아서, 그 전에는 탭 화면 수로 어림한다(「1 / 1」 로 보이지 않게)
    total:
      (wantData ? 1 : 0) +
      (only?.filter((f) => f.kind !== "data").length ?? tripPagePaths(trip.id, []).length),
    failed: [],
    missing: 0,
    savedAt: prev?.savedAt ?? null,
    keepUntil: prev?.keepUntil ?? null,
  };
  const report = (patch: Partial<SavedTrip>) => {
    progress = { ...progress, ...patch };
    setSavedTrip(trip.id, progress);
  };
  markRunning(trip.id, true);
  report({});
  try {
    if (wantData) {
      const ok = await loadTripData(qc, trip.id);
      report({ done: 1, failed: ok ? [] : [{ kind: "data" }] });
    }
    const tasks = await toTasks(
      trip.id,
      only ? only.filter((f) => f.kind !== "data") : planAll(qc, trip.id),
    );
    report({ total: progress.done + tasks.length });
    await runPool(tasks, (task, ok) =>
      report({
        done: progress.done + 1,
        failed: ok ? progress.failed : [...progress.failed, task.item],
      }),
    );
  } finally {
    markRunning(trip.id, false);
  }
  const today = todayISO();
  report({
    status: progress.failed.length > 0 ? "partial" : "done",
    missing: progress.failed.length,
    savedAt: new Date().toISOString(),
    keepUntil: keepUntilDate(today, trip.end_date),
  });
  return progress;
}
