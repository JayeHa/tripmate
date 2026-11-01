import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * 마이그레이션을 실제 Postgres(PGlite, WASM)에 순서대로 적용하고 DB 함수·RLS 동작을 확인한다.
 * Supabase 가 주는 auth.uid() · 역할 · storage 는 최소 대역으로 흉내 낸다.
 * 원격과 다른 점: PostgREST 는 없다, 연결이 하나라 동시성은 못 본다.
 */
const DIR = path.resolve(__dirname, "migrations");
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";

let db: PGlite;

const STUBS = `
  create role anon; create role authenticated; create role service_role;
  create schema auth; create schema extensions; create schema storage;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as
    $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
  create function extensions.gen_random_bytes(int) returns bytea language sql as
    $$ select decode(md5(random()::text), 'hex') $$;
  create table storage.buckets (
    id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid
  );
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  create publication supabase_realtime;
`;

/**
 * Supabase 가 프로젝트에 미리 깔아 두는 기본 권한. `alter default privileges` 는 **이후에 만들어지는**
 * 객체에만 붙으므로 마이그레이션이 테이블·함수를 만들기 전에 깐다(원격과 같은 순서).
 * 이렇게 하면 마이그레이션 안의 revoke 가 마지막에 적용된다.
 * 주의: 함수 실행 권한은 role 마다 따로 붙는다. 그래서 마이그레이션의 `revoke ... from public` 은
 * anon 의 실행을 막지 못한다(원격도 같다, #49).
 */
const GRANTS = `
  grant usage on schema public, auth to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`;

/** 이후 쿼리를 그 사용자로 실행한다 (RLS 적용) */
async function as(uid: string) {
  await db.exec(
    `reset role; select set_config('test.uid', '${uid}', false); set role authenticated;`,
  );
}

async function rejects(sql: string) {
  try {
    await db.query(sql);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}

async function newTrip(start: string, end: string) {
  const { rows } = await db.query<{ id: string }>(
    `select public.create_trip('t', '${start}', '${end}', array['tokyo']) as id`,
  );
  return rows[0].id;
}

/** 마이그레이션 파일 이름(정렬 순) */
const MIGRATIONS = readdirSync(DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

/** 대역 · 기본 권한을 깔고 `files` 마이그레이션을 순서대로 적용한 새 DB */
async function migratedDb(files: string[]) {
  const pg = new PGlite();
  await pg.exec(STUBS);
  await pg.exec(GRANTS);
  for (const file of files) await applyMigration(pg, file);
  return pg;
}

/** 마이그레이션 하나를 적용한다. PGlite 에 없는 확장 설치 구문은 뺀다 */
async function applyMigration(pg: PGlite, file: string) {
  const sql = readFileSync(path.join(DIR, file), "utf8").replace(/create extension[^;]*;/gi, "");
  await pg.exec(sql);
}

beforeAll(async () => {
  db = await migratedDb(MIGRATIONS);
  await db.exec(`insert into auth.users (id, email) values ('${A}', 'a@x'), ('${B}', 'b@x');`);
}, 30_000);

/** 장소 검색에서 고른 것처럼 장소를 그날 끝에 담고 일정 id 를 돌려준다 (0013) */
async function addPlace(trip: string, day: number, place: Record<string, unknown>) {
  const { rows } = await db.query<{ id: string }>(
    `select public.add_schedule_place($1, $2, $3) as id`,
    [trip, day, JSON.stringify(place)],
  );
  return rows[0].id;
}

describe("create_trip", () => {
  it("여행 · 도시 순서 · 소유자 멤버를 한 번에 만든다", async () => {
    await as(A);
    const { rows } = await db.query<{ id: string }>(
      `select public.create_trip('도쿄·오사카 여행', '2026-11-01', '2026-11-03', array['tokyo','osaka']) id`,
    );
    const id = rows[0].id;
    const cities = await db.query(
      `select city_id from public.trip_cities where trip_id = '${id}' order by position`,
    );
    expect(cities.rows.map((r) => (r as { city_id: string }).city_id)).toEqual(["tokyo", "osaka"]);
    const member = await db.query(`select role from public.trip_members where trip_id = '${id}'`);
    expect(member.rows).toEqual([{ role: "owner" }]);
  });

  it("도시가 없거나 없는 도시면 거부하고 여행도 남기지 않는다", async () => {
    await as(A);
    const before = await db.query<{ n: number }>(`select count(*)::int n from public.trips`);
    expect(
      await rejects(`select public.create_trip('x', '2026-11-01', '2026-11-02', '{}')`),
    ).toMatch(/at least one city/);
    expect(
      await rejects(
        `select public.create_trip('x', '2026-11-01', '2026-11-02', array['atlantis'])`,
      ),
    ).toMatch(/foreign key/);
    const after = await db.query<{ n: number }>(`select count(*)::int n from public.trips`);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

describe("update_trip_dates", () => {
  it("줄이면 잘린 날의 일정은 마지막 날 끝으로(순서 유지), 지출은 같이 옮기고 도착일로 모은다 — 여행준비(날짜 없음)는 그대로", async () => {
    await as(A);
    const id = await newTrip("2026-11-01", "2026-11-05");
    await db.exec(`
      insert into public.schedule_items (trip_id, day_index, position, kind, name) values
        ('${id}',0,0,'note','a'),('${id}',2,0,'note','c'),('${id}',3,0,'note','d'),
        ('${id}',3,1,'note','e'),('${id}',4,0,'note','f');
      insert into public.expenses (trip_id, payer_id, amount, currency, spent_on, name) values
        ('${id}','${A}',1,'KRW','2026-11-02','a'),('${id}','${A}',2,'KRW','2026-11-04','b'),
        ('${id}','${A}',3,'KRW',null,'숙소');
      insert into public.day_routes (trip_id, day_index, items_hash, polyline, legs) values
        ('${id}',1,'h','p','[]'),('${id}',3,'h','p','[]');
    `);

    await db.query(`select public.update_trip_dates('${id}', '2026-11-10', '2026-11-12')`);

    const items = await db.query<{ v: string }>(
      `select day_index || ':' || position || ':' || name v from public.schedule_items
       where trip_id = '${id}' order by day_index, position`,
    );
    expect(items.rows.map((r) => r.v)).toEqual(["0:0:a", "2:0:c", "2:1:d", "2:2:e", "2:3:f"]);

    const expenses = await db.query<{ v: string }>(
      `select amount::int || '@' || coalesce(spent_on::text, '여행준비') v from public.expenses where trip_id = '${id}' order by amount`,
    );
    expect(expenses.rows.map((r) => r.v)).toEqual(["1@2026-11-11", "2@2026-11-12", "3@여행준비"]);

    const routes = await db.query<{ d: number }>(
      `select day_index d from public.day_routes where trip_id = '${id}'`,
    );
    expect(routes.rows.map((r) => r.d)).toEqual([1]);
  });

  it("거꾸로 된 기간과 멤버가 아닌 사람은 거부하고 아무것도 바꾸지 않는다", async () => {
    await as(A);
    const id = await newTrip("2026-12-01", "2026-12-03");
    expect(
      await rejects(`select public.update_trip_dates('${id}', '2026-12-05', '2026-12-01')`),
    ).toMatch(/end date/);

    await as(B);
    expect(
      await rejects(`select public.update_trip_dates('${id}', '2027-01-01', '2027-01-02')`),
    ).toMatch(/not a member/);

    await as(A);
    const trip = await db.query<{ s: string }>(
      `select start_date::text s from public.trips where id = '${id}'`,
    );
    expect(trip.rows[0].s).toBe("2026-12-01");
  });
});

describe("trips", () => {
  it("trips 를 직접 고쳐도 도착이 출발보다 앞서면 check 제약이 거부한다 (#47 의 우회 경로)", async () => {
    await as(A);
    const id = await newTrip("2027-01-10", "2027-01-12");
    expect(
      await rejects(`update public.trips set end_date = '2027-01-01' where id = '${id}'`),
    ).toMatch(/trips_dates_chk/);
  });
});

describe("schedule_items · places 칸 (0010 · 0013)", () => {
  it("note 는 장소 없이 제목만으로, 상태 없음 · 대체 장소 아님이 된다", async () => {
    await as(A);
    const id = await newTrip("2027-03-01", "2027-03-01");
    const { rows } = await db.query(
      `insert into public.schedule_items (trip_id, day_index, position, kind, name)
       values ('${id}', 0, 0, 'note', '공항 집합') returning status, alternative_of`,
    );
    expect(rows).toEqual([{ status: null, alternative_of: null }]);
  });

  it("place 는 장소가 있어야 하고, note · flight 는 장소 없이 제목이 있어야 한다", async () => {
    await as(A);
    const id = await newTrip("2027-03-03", "2027-03-03");
    const item = await addPlace(id, 0, { name: "도쿄역" });
    const place = await db.query<{ p: string }>(
      `select place_id p from public.schedule_items where id = '${item}'`,
    );
    const p = place.rows[0].p;
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, name) values ('${id}', 0, 1, '도쿄역')`,
      ),
    ).toMatch(/check constraint/);
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, name, place_id)
         values ('${id}', 0, 1, 'note', 'x', '${p}')`,
      ),
    ).toMatch(/check constraint/);
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind) values ('${id}', 0, 1, 'flight')`,
      ),
    ).toMatch(/check constraint/);
  });

  it.each([
    ["kind = hotel", "kind, name", "'hotel', 'x'"],
    ["status = done", "kind, name, status", "'note', 'x', 'done'"],
  ])("일정 %s 는 거부한다", async (_label, columns, values) => {
    await as(A);
    const id = await newTrip("2027-03-02", "2027-03-02");
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, ${columns})
         values ('${id}', 0, 0, ${values})`,
      ),
    ).toMatch(/check constraint/);
  });

  it.each([
    ["category", "'bar'"],
    ["rating", "5.5"],
    ["review_count", "-1"],
    ["links", `'{"url":"x"}'`],
    ["name", "''"],
  ])("장소 %s = %s 는 거부한다", async (column, value) => {
    await as(A);
    const cols = column === "name" ? "city_id, name" : `city_id, name, ${column}`;
    const vals = column === "name" ? `'tokyo', ${value}` : `'tokyo', 'x', ${value}`;
    expect(await rejects(`insert into public.places (${cols}) values (${vals})`)).toMatch(
      /check constraint/,
    );
  });
});

describe("places (0013)", () => {
  it("장소를 그날 끝에 담고, 같은 구글 장소를 다시 담으면 장소는 하나 · 일정은 둘이다", async () => {
    await as(A);
    const id = await newTrip("2027-05-01", "2027-05-02");
    await db.query(
      `insert into public.schedule_items (trip_id, day_index, position, kind, name) values ('${id}', 1, 0, 'note', 'n')`,
    );
    const first = await addPlace(id, 1, {
      name: "센소지",
      google_place_id: "g-sensoji",
      lat: 35.71,
      lng: 139.79,
    });
    const again = await addPlace(id, 1, { name: "센소지(다시)", google_place_id: "g-sensoji" });
    const rows = await db.query<{ position: number; place_id: string; name: string }>(
      `select si.position, si.place_id, p.name from public.schedule_items si
       join public.places p on p.id = si.place_id where si.id in ('${first}', '${again}') order by si.position`,
    );
    expect(rows.rows.map((r) => r.position)).toEqual([1, 2]);
    expect(rows.rows[0].place_id).toBe(rows.rows[1].place_id);
    expect(rows.rows.map((r) => r.name)).toEqual(["센소지", "센소지"]);
  });

  it("장소의 도시는 여행 도시 중 좌표가 가장 가까운 곳, 좌표가 없으면 첫 도시", async () => {
    await as(A);
    const { rows } = await db.query<{ id: string }>(
      `select public.create_trip('t', '2027-05-03', '2027-05-04', array['tokyo','osaka']) as id`,
    );
    const id = rows[0].id;
    const near = await addPlace(id, 0, { name: "도톤보리", lat: 34.6687, lng: 135.5013 });
    const none = await addPlace(id, 0, { name: "어딘가" });
    const cities = await db.query<{ city_id: string }>(
      `select p.city_id from public.schedule_items si join public.places p on p.id = si.place_id
       where si.id in ('${near}', '${none}') order by si.position`,
    );
    expect(cities.rows.map((r) => r.city_id)).toEqual(["osaka", "tokyo"]);
  });

  it("여행에 도시가 없으면 좌표가 가장 가까운 도시, 좌표도 없으면 거부한다", async () => {
    await as(A);
    const id = await newTrip("2027-05-11", "2027-05-11");
    await db.query(`delete from public.trip_cities where trip_id = '${id}'`);
    const item = await addPlace(id, 0, { name: "도톤보리", lat: 34.6687, lng: 135.5013 });
    const city = await db.query<{ city_id: string }>(
      `select p.city_id from public.schedule_items si join public.places p on p.id = si.place_id where si.id = '${item}'`,
    );
    expect(city.rows).toEqual([{ city_id: "osaka" }]);
    expect(
      await rejects(`select public.add_schedule_place('${id}', 0, '{"name":"이름만"}')`),
    ).toMatch(/has no city/);
  });

  it("이름은 앞뒤 공백을 떼고 100자로 자르고, 비면 거부한다", async () => {
    await as(A);
    const id = await newTrip("2027-05-12", "2027-05-12");
    const item = await addPlace(id, 0, { name: `  ${"가".repeat(120)}  ` });
    const name = await db.query<{ n: number }>(
      `select char_length(p.name)::int n from public.schedule_items si join public.places p on p.id = si.place_id where si.id = '${item}'`,
    );
    expect(name.rows).toEqual([{ n: 100 }]);
    expect(await rejects(`select public.add_schedule_place('${id}', 0, '{"name":"   "}')`)).toMatch(
      /name is required/,
    );
  });

  it("멤버가 아니면 담지 못하고, 먼저 만든 장소도 롤백돼 남지 않는다", async () => {
    await as(A);
    const id = await newTrip("2027-05-05", "2027-05-05");
    await as(B);
    const before = await db.query<{ n: number }>(
      `select count(*)::int n from public.places where created_by = '${B}'`,
    );
    // 좌표가 있으면 여행 도시를 못 읽어도 가장 가까운 도시를 찾아 장소를 먼저 넣는다. 일정 insert 가 RLS 에 막혀 함께 롤백돼야 한다
    expect(
      await rejects(
        `select public.add_schedule_place('${id}', 0, '{"name":"롤백","lat":35.7,"lng":139.7}')`,
      ),
    ).toMatch(/row-level security/);
    const after = await db.query<{ n: number }>(
      `select count(*)::int n from public.places where created_by = '${B}'`,
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it("장소는 만든 사람 + 그 장소를 쓰는 여행의 멤버만 읽고, 고치기 · 지우기는 만든 사람만", async () => {
    await as(A);
    const id = await newTrip("2027-05-06", "2027-05-06");
    const item = await addPlace(id, 0, { name: "츠키지" });
    const { rows } = await db.query<{ p: string }>(
      `select place_id p from public.schedule_items where id = '${item}'`,
    );
    const place = rows[0].p;

    await as(B);
    const hidden = await db.query(`select id from public.places where id = '${place}'`);
    expect(hidden.rows).toEqual([]);

    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${id}', '${B}', 'member');`,
    );
    await as(B);
    const shown = await db.query(`select name from public.places where id = '${place}'`);
    expect(shown.rows).toEqual([{ name: "츠키지" }]);
    await db.query(`update public.places set name = '바꿈' where id = '${place}'`);
    await db.query(`delete from public.places where id = '${place}'`);
    await as(A);
    const after = await db.query(`select name from public.places where id = '${place}'`);
    expect(after.rows).toEqual([{ name: "츠키지" }]);
  });

  it("일행은 이 여행이 쓰는 장소를 한 번 더 담을 수 있지만, 남의 보관함 장소를 내 여행에 끌어오지 못한다", async () => {
    await as(A);
    const shared = await newTrip("2027-05-07", "2027-05-07");
    const item = await addPlace(shared, 0, { name: "시부야 스카이" });
    const { rows } = await db.query<{ p: string }>(
      `select place_id p from public.schedule_items where id = '${item}'`,
    );
    const place = rows[0].p;
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${shared}', '${B}', 'member');`,
    );

    await as(B);
    await db.query(
      `insert into public.schedule_items (trip_id, day_index, position, kind, place_id)
       values ('${shared}', 0, 1, 'place', '${place}')`,
    );
    const own = await newTrip("2027-05-08", "2027-05-08");
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, place_id)
         values ('${own}', 0, 0, 'place', '${place}')`,
      ),
    ).toMatch(/row-level security/);
  });

  it("멤버가 나가면 그 사람이 만든 장소는 소유자 사본으로 바뀐다: 나간 사람이 고쳐도 이 여행엔 안 보이고, 소유자가 고친다", async () => {
    await as(A);
    const id = await newTrip("2027-05-10", "2027-05-10");
    // A 가 이미 가진 구글 장소는 사본을 만들지 않고 그 장소를 쓴다
    const mine = await addPlace(id, 0, { name: "츠키지(A)", google_place_id: "g-tsukiji" });
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${id}', '${B}', 'member');`,
    );
    await as(B);
    const fresh = await addPlace(id, 0, { name: "아사쿠사", lat: 35.71, lng: 139.79 });
    const same = await addPlace(id, 0, { name: "츠키지(B)", google_place_id: "g-tsukiji" });
    const placeOf = async (item: string) =>
      (
        await db.query<{ p: string }>(
          `select place_id p from public.schedule_items where id = '${item}'`,
        )
      ).rows[0].p;
    const original = await placeOf(fresh);

    await db.query(`delete from public.trip_members where trip_id = '${id}' and user_id = '${B}'`);
    await db.query(`update public.places set name = '바꿈' where id = '${original}'`);

    await as(A);
    const rows = await db.query<{ owner: string; name: string; place_id: string }>(
      `select p.created_by owner, p.name, si.place_id from public.schedule_items si
       join public.places p on p.id = si.place_id where si.id in ('${fresh}', '${same}') order by si.position`,
    );
    expect(rows.rows.map((r) => [r.owner, r.name])).toEqual([
      [A, "아사쿠사"],
      [A, "츠키지(A)"],
    ]);
    expect(rows.rows[0].place_id).not.toBe(original);
    expect(rows.rows[1].place_id).toBe(await placeOf(mine));
    await db.query(
      `update public.places set name = '아사쿠사 센소지' where id = '${rows.rows[0].place_id}'`,
    );
    const renamed = await db.query(
      `select name from public.places where id = '${rows.rows[0].place_id}'`,
    );
    expect(renamed.rows).toEqual([{ name: "아사쿠사 센소지" }]);
  });

  it("나간 사람의 다른 여행은 원본을 그대로 쓰고, 멤버가 있는 여행도 소유자가 지울 수 있다", async () => {
    await as(A);
    const shared = await newTrip("2027-05-13", "2027-05-13");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${shared}', '${B}', 'member');`,
    );
    await as(B);
    const own = await newTrip("2027-05-14", "2027-05-14");
    const inOwn = await addPlace(own, 0, { name: "요요기", google_place_id: "g-yoyogi" });
    const inShared = await addPlace(shared, 0, { name: "요요기", google_place_id: "g-yoyogi" });
    const original = (
      await db.query<{ p: string }>(
        `select place_id p from public.schedule_items where id = '${inOwn}'`,
      )
    ).rows[0].p;

    await db.query(
      `delete from public.trip_members where trip_id = '${shared}' and user_id = '${B}'`,
    );
    const still = await db.query<{ p: string }>(
      `select place_id p from public.schedule_items where id = '${inOwn}'`,
    );
    expect(still.rows[0].p).toBe(original);

    // 실제로 나갔고(0행 delete 가 아님), 공유 여행 일정은 A 소유 사본으로 바뀌었는지
    await as(A);
    const members = await db.query<{ user_id: string }>(
      `select user_id from public.trip_members where trip_id = '${shared}'`,
    );
    expect(members.rows.map((r) => r.user_id)).toEqual([A]);
    const copied = await db.query<{ p: string; owner: string }>(
      `select si.place_id p, pl.created_by owner from public.schedule_items si
       join public.places pl on pl.id = si.place_id where si.id = '${inShared}'`,
    );
    expect(copied.rows[0].p).not.toBe(original);
    expect(copied.rows[0].owner).toBe(A);

    // 여행을 지우면 trip_members 도 cascade 로 지워지며 트리거가 돈다. 멤버의 장소가 있어도 삭제가 끝나야 한다
    // (지금은 일정이 먼저 지워져 옮길 것이 없다. 트리거의 「소유자 없음」 가드는 순서가 바뀔 때를 위한 방어)
    await as(A);
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${shared}', '${B}', 'member');`,
    );
    await as(B);
    await addPlace(shared, 0, { name: "하라주쿠" });
    await as(A);
    await db.query(`delete from public.trips where id = '${shared}'`);
    const gone = await db.query(`select id from public.trips where id = '${shared}'`);
    expect(gone.rows).toEqual([]);
  });

  it("일정이 쓰는 장소는 지울 수 없다", async () => {
    await as(A);
    const id = await newTrip("2027-05-09", "2027-05-09");
    const item = await addPlace(id, 0, { name: "우에노" });
    const { rows } = await db.query<{ p: string }>(
      `select place_id p from public.schedule_items where id = '${item}'`,
    );
    expect(await rejects(`delete from public.places where id = '${rows[0].p}'`)).toMatch(
      /foreign key/,
    );
  });
});

describe("add_schedule_places (0016)", () => {
  /** 일정 id → 그 일정의 장소 id */
  async function placeOf(item: string) {
    const { rows } = await db.query<{ p: string }>(
      `select place_id p from public.schedule_items where id = '${item}'`,
    );
    return rows[0].p;
  }

  it("저장한 장소 · 구글 장소 · 이름만을 고른 순서대로 그날 끝에 담는다", async () => {
    await as(A);
    const id = await newTrip("2027-07-01", "2027-07-01");
    const saved = await placeOf(await addPlace(id, 0, { name: "긴자 센료" }));
    const { rows } = await db.query<{ ids: string[] }>(
      `select public.add_schedule_places($1, 0, $2) ids`,
      [
        id,
        JSON.stringify([
          { name: "센소지", google_place_id: "g-batch-sensoji", lat: 35.71, lng: 139.79 },
          { place_id: saved },
          { name: "이름만" },
        ]),
      ],
    );
    expect(rows[0].ids).toHaveLength(3);
    const order = await db.query<{ position: number; name: string }>(
      `select si.position, p.name from public.schedule_items si join public.places p on p.id = si.place_id
       where si.trip_id = '${id}' order by si.position`,
    );
    expect(order.rows.map((r) => `${r.position}:${r.name}`)).toEqual([
      "0:긴자 센료",
      "1:센소지",
      "2:긴자 센료",
      "3:이름만",
    ]);
  });

  it("붙일 수 없는 장소가 하나라도 있으면 거부하고 아무것도 남기지 않는다", async () => {
    await as(B);
    const theirs = await newTrip("2027-07-02", "2027-07-02");
    const foreign = await placeOf(await addPlace(theirs, 0, { name: "B 의 장소" }));
    await as(A);
    const id = await newTrip("2027-07-03", "2027-07-03");
    expect(
      await rejects(
        `select public.add_schedule_places('${id}', 0, '${JSON.stringify([{ name: "먼저 담길 곳" }, { place_id: foreign }])}')`,
      ),
    ).toMatch(/row-level security/);
    const left = await db.query<{ n: number }>(
      `select count(*)::int n from public.schedule_items where trip_id = '${id}'`,
    );
    expect(left.rows[0].n).toBe(0);
    expect(
      await rejects(`select public.add_schedule_places('${id}', 0, '{"place_id":"x"}')`),
    ).toMatch(/must be an array/);
  });
});

describe("create_place_schedule (0017)", () => {
  it("장소 정보 칸으로 새 장소, 일정 칸으로 그날 끝 일정을 만든다", async () => {
    await as(A);
    const id = await newTrip("2027-08-01", "2027-08-01");
    await addPlace(id, 0, { name: "먼저 있던 곳" });
    const { rows } = await db.query<{ id: string }>(
      `select public.create_place_schedule($1, 0, $2, $3) id`,
      [
        id,
        JSON.stringify({
          name: "  유야 온천  ",
          category: "rest",
          lat: 35.7,
          lng: 139.7,
          hours: "10:00–23:00",
          rating: 4.3,
          review_count: 812,
          wait: "20분",
          description: "노천탕",
          gmap_url: "https://maps.app.goo.gl/x",
          links: [{ title: "예약", url: "https://example.com" }],
        }),
        JSON.stringify({
          status: "wait",
          start_time: "19:30",
          links: [{ title: "티켓", url: "https://t.example.com" }],
        }),
      ],
    );
    const { rows: got } = await db.query<Record<string, unknown>>(
      `select si.position, si.status, si.start_time::text t, si.links item_links,
              p.name, p.category, p.wait, p.review_count, p.city_id, p.links place_links
       from public.schedule_items si join public.places p on p.id = si.place_id where si.id = '${rows[0].id}'`,
    );
    expect(got[0]).toMatchObject({
      position: 1,
      status: "wait",
      t: "19:30:00",
      name: "유야 온천",
      category: "rest",
      wait: "20분",
      review_count: 812,
      city_id: "tokyo",
      item_links: [{ title: "티켓", url: "https://t.example.com" }],
      place_links: [{ title: "예약", url: "https://example.com" }],
    });
  });

  it("이름이 비거나, 도시 · 위치가 없거나, 칸 값이 틀리면 거부하고 장소도 남기지 않는다", async () => {
    await as(A);
    const id = await newTrip("2027-08-02", "2027-08-02");
    const before = await db.query<{ n: number }>(`select count(*)::int n from public.places`);
    expect(
      await rejects(`select public.create_place_schedule('${id}', 0, '{"name":" "}', '{}')`),
    ).toMatch(/name is required/);
    expect(
      await rejects(
        `select public.create_place_schedule('${id}', 0, '{"name":"x","category":"bar"}', '{}')`,
      ),
    ).toMatch(/check constraint/);
    expect(
      await rejects(
        `select public.create_place_schedule('${id}', 0, '{"name":"x","wait":"${"가".repeat(31)}"}', '{}')`,
      ),
    ).toMatch(/check constraint/);
    expect(
      await rejects(
        `select public.create_place_schedule('${id}', 0, '{"name":"x"}', '{"status":"done"}')`,
      ),
    ).toMatch(/check constraint/);
    await db.query(`delete from public.trip_cities where trip_id = '${id}'`);
    expect(
      await rejects(`select public.create_place_schedule('${id}', 0, '{"name":"x"}', '{}')`),
    ).toMatch(/has no city/);
    const after = await db.query<{ n: number }>(`select count(*)::int n from public.places`);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });

  it("멤버가 아니면 거부하고, 먼저 만든 장소도 롤백된다", async () => {
    await as(A);
    const id = await newTrip("2027-08-03", "2027-08-03");
    await as(B);
    const before = await db.query<{ n: number }>(
      `select count(*)::int n from public.places where created_by = '${B}'`,
    );
    expect(
      await rejects(
        `select public.create_place_schedule('${id}', 0, '{"name":"x","lat":35.7,"lng":139.7}', '{}')`,
      ),
    ).toMatch(/row-level security/);
    const after = await db.query<{ n: number }>(
      `select count(*)::int n from public.places where created_by = '${B}'`,
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
});

describe("create_place_schedule — 이미 가진 구글 장소 (0018)", () => {
  it("같은 구글 장소를 직접 추가로 다시 담으면 그 장소를 쓰고, 적은 칸만 덮어쓴다", async () => {
    await as(A);
    const id = await newTrip("2027-08-04", "2027-08-04");
    const first = await addPlace(id, 0, {
      name: "이치란 시부야",
      google_place_id: "g-ichiran",
      lat: 35.66,
      lng: 139.7,
      address: "시부야구",
    });
    const { rows } = await db.query<{ id: string }>(
      `select public.create_place_schedule($1, 0, $2, $3) id`,
      [
        id,
        JSON.stringify({
          name: "이치란",
          category: "food",
          google_place_id: "g-ichiran",
          wait: "30분",
          links: [],
        }),
        JSON.stringify({ status: "ok" }),
      ],
    );
    const { rows: got } = await db.query<Record<string, unknown>>(
      `select si.place_id = (select place_id from public.schedule_items where id = '${first}') same,
              si.status, p.name, p.category, p.wait, p.address, p.lat
       from public.schedule_items si join public.places p on p.id = si.place_id where si.id = '${rows[0].id}'`,
    );
    expect(got[0]).toMatchObject({
      same: true,
      status: "ok",
      name: "이치란",
      category: "food",
      wait: "30분",
      address: "시부야구",
      lat: 35.66,
    });
    const count = await db.query<{ n: number }>(
      `select count(*)::int n from public.places where created_by = '${A}' and google_place_id = 'g-ichiran'`,
    );
    expect(count.rows[0].n).toBe(1);

    // 카테고리를 고르지 않고 다시 담으면(폼 기본값 null) 기존 카테고리를 둔다
    await db.query(`select public.create_place_schedule($1, 0, $2, '{}')`, [
      id,
      JSON.stringify({ name: "이치란", category: null, google_place_id: "g-ichiran" }),
    ]);
    const kept = await db.query<{ category: string }>(
      `select category from public.places where created_by = '${A}' and google_place_id = 'g-ichiran'`,
    );
    expect(kept.rows[0].category).toBe("food");
  });
});

describe("create_place_schedule — 재사용 경로 롤백 (0018)", () => {
  it("멤버가 아닌 여행에 이미 가진 구글 장소로 담으면 거부하고, 내 장소도 고쳐지지 않는다", async () => {
    await as(A);
    const mine = await newTrip("2027-08-06", "2027-08-06");
    await addPlace(mine, 0, {
      name: "A 의 장소",
      google_place_id: "g-rollback",
      lat: 35.7,
      lng: 139.7,
    });
    await as(B);
    const theirs = await newTrip("2027-08-07", "2027-08-07");
    await as(A);
    expect(
      await rejects(
        `select public.create_place_schedule('${theirs}', 0, '${JSON.stringify({
          name: "바뀐 이름",
          google_place_id: "g-rollback",
          wait: "10분",
        })}', '{}')`,
      ),
    ).toMatch(/row-level security/);
    const { rows } = await db.query<{ name: string; wait: string | null }>(
      `select name, wait from public.places where created_by = '${A}' and google_place_id = 'g-rollback'`,
    );
    expect(rows).toEqual([{ name: "A 의 장소", wait: null }]);
  });
});

describe("copy_places_on_leave — 예상 대기 (0019)", () => {
  it("나간 멤버의 장소 사본에 예상 대기도 옮긴다", async () => {
    await as(A);
    const id = await newTrip("2027-08-05", "2027-08-05");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${id}', '${B}', 'member');`,
    );
    await as(B);
    const { rows } = await db.query<{ id: string }>(
      `select public.create_place_schedule($1, 0, $2, '{}') id`,
      [id, JSON.stringify({ name: "줄 서는 곳", wait: "40분" })],
    );
    await db.query(`delete from public.trip_members where trip_id = '${id}' and user_id = '${B}'`);
    await as(A);
    const { rows: got } = await db.query<{ owner: string; wait: string }>(
      `select p.created_by owner, p.wait from public.schedule_items si
       join public.places p on p.id = si.place_id where si.id = '${rows[0].id}'`,
    );
    expect(got[0]).toEqual({ owner: A, wait: "40분" });
  });
});

describe("장소 주소 칸 (0020 · 0021)", () => {
  it("현지어 주소 · 상세 위치를 저장하고, 이미 가진 장소를 다시 담을 때 빈 칸은 기존 값을 둔다", async () => {
    await as(A);
    const id = await newTrip("2027-08-08", "2027-08-08");
    const place = {
      name: "블루보틀 시부야",
      google_place_id: "g-addr",
      lat: 35.664,
      lng: 139.6995,
      address: "1-chōme-7-3 Jinnan, Shibuya, Tokyo",
      address_local: "東京都渋谷区神南１丁目７−３",
      address_ko: "도쿄도 시부야구 진난 1 조메 7-3",
      address_detail: "공원 안 1층",
    };
    await db.query(`select public.create_place_schedule($1, 0, $2, '{}')`, [
      id,
      JSON.stringify(place),
    ]);
    await db.query(`select public.create_place_schedule($1, 0, $2, '{}')`, [
      id,
      JSON.stringify({ name: "블루보틀 시부야", google_place_id: "g-addr", address_detail: "" }),
    ]);
    const { rows } = await db.query<{
      address_local: string;
      address_ko: string;
      address_detail: string;
    }>(
      `select address_local, address_ko, address_detail from public.places where created_by = '${A}' and google_place_id = 'g-addr'`,
    );
    expect(rows).toEqual([
      {
        address_local: "東京都渋谷区神南１丁目７−３",
        address_ko: "도쿄도 시부야구 진난 1 조메 7-3",
        address_detail: "공원 안 1층",
      },
    ]);
  });

  it("나간 멤버의 장소를 소유자 사본으로 옮기는 함수가 places 의 칸을 모두 옮긴다", async () => {
    // copy_places_on_leave 는 칸을 하나씩 나열한다. places 에 칸을 더하고 이 함수를 빠뜨리면 사본에서 값이 조용히 빠진다(0019)
    const { rows: cols } = await db.query<{ column_name: string }>(
      `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'places'`,
    );
    const { rows: def } = await db.query<{ body: string }>(
      `select pg_get_functiondef('public.copy_places_on_leave'::regproc) body`,
    );
    const generated = new Set(["id", "created_by", "created_at", "updated_at"]);
    const missing = cols
      .map((c) => c.column_name)
      // 단어 경계까지 본다 — 그냥 포함이면 r.address 가 빠져도 r.address_local 에 걸려 통과한다
      .filter((c) => !generated.has(c) && !new RegExp(`\\br\\.${c}\\b`).test(def[0].body));
    expect(missing).toEqual([]);
  });
});

describe("요일별 운영시간 (0022)", () => {
  it("요일별을 저장하고, 다시 담을 때 보내지 않으면 두고 {} 를 보내면 비운다", async () => {
    await as(A);
    const id = await newTrip("2027-08-09", "2027-08-09");
    const week = { mon: "11:00–22:00", sat: "10:00–23:00", sun: null };
    const put = (place: Record<string, unknown>) =>
      db.query(`select public.create_place_schedule($1, 0, $2, '{}')`, [
        id,
        JSON.stringify({ name: "히로키야", google_place_id: "g-week", ...place }),
      ]);
    const read = async () =>
      (
        await db.query<{ hours: string | null; hours_week: unknown }>(
          `select hours, hours_week from public.places where created_by = '${A}' and google_place_id = 'g-week'`,
        )
      ).rows[0];

    await put({ hours_week: week });
    expect(await read()).toEqual({ hours: null, hours_week: week });
    await put({ hours_week: null });
    expect((await read()).hours_week).toEqual(week);
    await put({ hours: "10:00–20:00", hours_week: {} });
    expect(await read()).toEqual({ hours: "10:00–20:00", hours_week: {} });
    expect(
      await rejects(
        `select public.create_place_schedule('${id}', 0, '{"name":"x","hours_week":[]}', '{}')`,
      ),
    ).toMatch(/check constraint/);
  });
});

describe("아이콘은 일정에 (0023)", () => {
  it("p_item.emoji 를 일정에 넣고 장소 아이콘은 쓰지 않는다 — 다시 담아도 기존 장소 아이콘을 두고 일정마다 따로", async () => {
    await as(A);
    const id = await newTrip("2027-08-10", "2027-08-10");
    const put = (place: Record<string, unknown>, item: Record<string, unknown>) =>
      db.query<{ id: string }>(`select public.create_place_schedule($1, 0, $2, $3) id`, [
        id,
        JSON.stringify({ name: "유야 온천", google_place_id: "g-emoji", ...place }),
        JSON.stringify(item),
      ]);
    const read = async (itemId: string) =>
      (
        await db.query<{ item: string | null; place: string | null }>(
          `select si.emoji item, p.emoji place
           from public.schedule_items si join public.places p on p.id = si.place_id where si.id = '${itemId}'`,
        )
      ).rows[0];

    const first = await put({ emoji: "🏯" }, { emoji: " ♨️ " });
    expect(await read(first.rows[0].id)).toEqual({ item: "♨️", place: null });
    await db.query(`update public.places set emoji = '🛁' where google_place_id = 'g-emoji'`);
    const second = await put({ emoji: "🏯" }, { emoji: "" });
    expect(await read(second.rows[0].id)).toEqual({ item: null, place: "🛁" });
    expect((await read(first.rows[0].id)).item).toBe("♨️");
  });
});

describe("대체 장소는 일정 줄 (0024)", () => {
  /** 그날 끝에 장소 일정을 담고, 대체 장소 둘(직접 추가 · 저장한 장소)을 붙인다 */
  async function setup(start: string, end: string) {
    await as(A);
    const trip = await newTrip(start, end);
    const main = await addPlace(trip, 0, { name: "머메이드 커피", lat: 35.73, lng: 139.71 });
    const next = await addPlace(trip, 0, { name: "선샤인시티", lat: 35.729, lng: 139.719 });
    await db.query(
      `update public.schedule_items set start_time = '13:00', status = 'ok' where id = '${main}'`,
    );
    await db.query(
      `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${main}', '창가 자리')`,
    );
    const { rows } = await db.query<{ id: string }>(
      `select public.create_place_schedule($1, 1, $2, $3) id`,
      [
        trip,
        JSON.stringify({ name: "아시츠보", lat: 35.728, lng: 139.716 }),
        JSON.stringify({ alternative_of: main, start_time: "09:00" }),
      ],
    );
    const alt = rows[0].id;
    const second = await db.query<{ id: string }>(
      `insert into public.schedule_items (trip_id, day_index, position, kind, place_id, alternative_of)
       select trip_id, 1, 9, 'place', place_id, '${main}' from public.schedule_items where id = '${next}'
       returning id`,
    );
    await db.query(
      `insert into public.moves (trip_id, from_item_id, to_item_id, mode) values ('${trip}', '${main}', '${next}', 'walk')`,
    );
    return { trip, main, next, alt, other: second.rows[0].id };
  }

  /** 일정 한 줄의 비교할 칸 */
  async function row(id: string) {
    return (
      await db.query<Record<string, unknown>>(
        `select si.day_index, si.position, si.start_time::text t, si.status, si.alternative_of,
                (select string_agg(body, ',') from public.memos m where m.schedule_item_id = si.id) memo
         from public.schedule_items si where si.id = '${id}'`,
      )
    ).rows[0];
  }

  it("대체 장소는 붙은 일정과 같은 날 · 시간 없이 들어가고, 붙은 일정을 옮기면 따라가고 지우면 함께 지워진다", async () => {
    const { main, alt, other } = await setup("2027-09-01", "2027-09-02");
    expect(await row(alt)).toMatchObject({ day_index: 0, t: null, alternative_of: main });
    expect((await row(other)).day_index).toBe(0);
    await db.query(`update public.schedule_items set day_index = 1 where id = '${main}'`);
    expect((await row(alt)).day_index).toBe(1);
    expect(
      await rejects(`update public.schedule_items set start_time = '10:00' where id = '${alt}'`),
    ).toMatch(/check constraint/);
    await db.query(`delete from public.schedule_items where id = '${main}'`);
    const left = await db.query(
      `select id from public.schedule_items where id in ('${alt}', '${other}')`,
    );
    expect(left.rows).toEqual([]);
  });

  it("대체 장소의 대체 장소 · note 에 붙이기 · 대체 장소가 있는 줄을 대체 장소로 만들기는 거부한다", async () => {
    const { trip, main, next, alt } = await setup("2027-09-04", "2027-09-05");
    const placeOf = `(select place_id from public.schedule_items where id = '${main}')`;
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, place_id, alternative_of)
         values ('${trip}', 0, 0, 'place', ${placeOf}, '${alt}')`,
      ),
    ).toMatch(/cannot have alternatives/);
    const note = await db.query<{ id: string }>(
      `insert into public.schedule_items (trip_id, day_index, position, kind, name) values ('${trip}', 0, 5, 'note', '집합') returning id`,
    );
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, place_id, alternative_of)
         values ('${trip}', 0, 0, 'place', ${placeOf}, '${note.rows[0].id}')`,
      ),
    ).toMatch(/belong to a place item/);
    expect(
      await rejects(
        `update public.schedule_items set alternative_of = '${next}' where id = '${main}'`,
      ),
    ).toMatch(/cannot become an alternative/);
  });

  it("바꾸기: 대체 장소가 자리(날짜 · 순서 · 시간 · 이동 기록)에 들어가고, 상태 · 메모는 각자 줄에 남는다", async () => {
    const { main, next, alt, other } = await setup("2027-09-07", "2027-09-08");
    const before = await row(main);
    await db.query(`select public.swap_alternative($1)`, [alt]);
    expect(await row(alt)).toMatchObject({
      day_index: before.day_index,
      position: before.position,
      t: "13:00:00",
      status: null,
      memo: null,
      alternative_of: null,
    });
    expect(await row(main)).toMatchObject({
      t: null,
      status: "ok",
      memo: "창가 자리",
      alternative_of: alt,
    });
    expect((await row(other)).alternative_of).toBe(alt);
    const moves = await db.query(
      `select from_item_id f from public.moves where to_item_id = '${next}'`,
    );
    expect(moves.rows).toEqual([{ f: alt }]);
    expect(await rejects(`select public.swap_alternative('${next}')`)).toMatch(
      /not an alternative/,
    );
  });

  it("바꾸기: 대체 장소가 된 일정의 지출은 합계에서 빠지고, 올라온 일정의 지출은 다시 들어간다 — 다시 바꾸면 원래대로", async () => {
    const { trip, main, alt, other } = await setup("2027-09-13", "2027-09-14");
    await db.exec(`
      insert into public.expenses (trip_id, payer_id, amount, currency, name, schedule_item_id, counted) values
        ('${trip}','${A}',1,'KRW','원래 일정','${main}',true),
        ('${trip}','${A}',2,'KRW','대체 장소','${alt}',false),
        ('${trip}','${A}',3,'KRW','다른 대체 장소','${other}',false),
        ('${trip}','${A}',4,'KRW','연결 없음',null,true);
    `);
    /** 금액 순서대로 합계 포함 여부 */
    const counted = async () =>
      (
        await db.query<{ counted: boolean }>(
          `select counted from public.expenses where trip_id = '${trip}' order by amount`,
        )
      ).rows.map((r) => r.counted);

    await db.query(`select public.swap_alternative($1)`, [alt]);
    expect(await counted()).toEqual([false, true, false, true]);

    await db.query(`select public.swap_alternative($1)`, [main]);
    expect(await counted()).toEqual([true, false, false, true]);
  });

  it("멤버가 아니면 바꾸지 못한다", async () => {
    const { alt } = await setup("2027-09-10", "2027-09-11");
    await as(B);
    expect(await rejects(`select public.swap_alternative('${alt}')`)).toMatch(/not an alternative/);
  });
});

describe("메모 목록 (0027)", () => {
  it("일정에 메모를 붙이고, 작성자는 넣은 사람으로 고정 · 멤버 누구나 고치고 지운다 · 일정을 지우면 함께", async () => {
    await as(A);
    const trip = await newTrip("2027-10-01", "2027-10-01");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const item = await addPlace(trip, 0, { name: "이치란", lat: 35.66, lng: 139.7 });
    const { rows } = await db.query<{ id: string; author_id: string }>(
      `insert into public.memos (trip_id, schedule_item_id, author_id, body, starred, links)
       values ('${trip}', '${item}', '${B}', '카운터석', true, '[{"title":"메뉴","url":"https://m"}]')
       returning id, author_id`,
    );
    expect(rows[0].author_id).toBe(A);
    await as(B);
    await db.query(
      `update public.memos set body = '창가석', author_id = '${B}' where id = '${rows[0].id}'`,
    );
    const after = await db.query<{ body: string; author_id: string }>(
      `select body, author_id from public.memos where id = '${rows[0].id}'`,
    );
    expect(after.rows[0]).toEqual({ body: "창가석", author_id: A });
    expect(
      await rejects(
        `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${item}', '  ')`,
      ),
    ).toMatch(/check constraint/);
    await as(A);
    await db.query(`delete from public.schedule_items where id = '${item}'`);
    const left = await db.query(`select id from public.memos where id = '${rows[0].id}'`);
    expect(left.rows).toEqual([]);
  });

  it("작성자 계정을 지우면 작성자만 비고 메모는 남는다 (0028)", async () => {
    const C = "33333333-3333-3333-3333-333333333333";
    await db.exec(`reset role; insert into auth.users (id, email) values ('${C}', 'c@x');`);
    await as(A);
    const trip = await newTrip("2027-10-05", "2027-10-05");
    const item = await addPlace(trip, 0, { name: "이치란", lat: 35.66, lng: 139.7 });
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${C}', 'member');`,
    );
    await as(C);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${item}', '메모') returning id`,
    );
    await db.exec(`reset role; delete from public.profiles where id = '${C}';`);
    const left = await db.query<{ author_id: string | null }>(
      `select author_id from public.memos where id = '${rows[0].id}'`,
    );
    expect(left.rows).toEqual([{ author_id: null }]);
  });

  it("멤버가 아니면 읽지도 쓰지도 못한다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-03", "2027-10-03");
    const item = await addPlace(trip, 0, { name: "이치란", lat: 35.66, lng: 139.7 });
    await db.query(
      `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${item}', '메모')`,
    );
    await as(B);
    const seen = await db.query(`select id from public.memos where trip_id = '${trip}'`);
    expect(seen.rows).toEqual([]);
    expect(
      await rejects(
        `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${item}', '메모')`,
      ),
    ).toMatch(/row-level security/);
  });
});

describe("0027 데이터 이전", () => {
  it("일정 메모 한 줄 = 메모 하나, 「★ 」 줄은 중요, 작성자는 일정을 만든 사람, 줄 순서 유지", async () => {
    const pg = await migratedDb(MIGRATIONS.filter((f) => f < "0027"));
    await pg.exec(`
      insert into auth.users (id, email) values ('${A}', 'a@x');
      insert into public.trips (id, owner_id, title, start_date, end_date)
        values ('44444444-4444-4444-4444-444444444444', '${A}', 't', '2027-06-01', '2027-06-01');
      insert into public.schedule_items (id, trip_id, day_index, position, kind, name, memo, created_by)
        values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 0, 0, 'note', '집합',
                E'첫 줄\n\n★ 7층 집합\n  셋째 줄  ', '${A}');
    `);
    await applyMigration(pg, "0027_memos.sql");
    const { rows } = await pg.query<{ body: string; starred: boolean; author_id: string }>(
      `select body, starred, author_id from public.memos order by created_at`,
    );
    expect(rows).toEqual([
      { body: "첫 줄", starred: false, author_id: A },
      { body: "7층 집합", starred: true, author_id: A },
      { body: "셋째 줄", starred: false, author_id: A },
    ]);
  });
});

describe("날짜 메모에는 메모 목록이 없다 (0029)", () => {
  it("note 에 메모를 붙이면 거부한다 — 장소에는 붙는다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-07", "2027-10-07");
    const note = await db.query<{ id: string }>(
      `insert into public.schedule_items (trip_id, day_index, position, kind, name) values ('${trip}', 0, 0, 'note', '집합') returning id`,
    );
    expect(
      await rejects(
        `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${note.rows[0].id}', '메모')`,
      ),
    ).toMatch(/has no memos/);
  });

  it("이전: note 에 붙은 메모를 글 아래에 줄바꿈으로 합치고(★ 유지) 메모는 지운다", async () => {
    const pg = await migratedDb(MIGRATIONS.filter((f) => f < "0029"));
    await pg.exec(`
      insert into auth.users (id, email) values ('${A}', 'a@x');
      insert into public.trips (id, owner_id, title, start_date, end_date)
        values ('66666666-6666-6666-6666-666666666666', '${A}', 't', '2027-06-01', '2027-06-01');
      insert into public.schedule_items (id, trip_id, day_index, position, kind, name)
        values ('77777777-7777-7777-7777-777777777777', '66666666-6666-6666-6666-666666666666', 0, 0, 'note', '스파앳홈');
      alter table public.memos disable trigger memos_author;
      insert into public.memos (trip_id, schedule_item_id, body, starred, created_at) values
        ('66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '둘째', true, '2027-01-02'),
        ('66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '첫째', false, '2027-01-01');
    `);
    await applyMigration(pg, "0029_note_memos_into_text.sql");
    const item = await pg.query<{ name: string }>(
      `select name from public.schedule_items where id = '77777777-7777-7777-7777-777777777777'`,
    );
    expect(item.rows[0].name).toBe("스파앳홈\n첫째\n★ 둘째");
    const left = await pg.query(`select id from public.memos`);
    expect(left.rows).toEqual([]);
  });
});

describe("일정 편집 저장 (0030)", () => {
  /** 이틀짜리 여행에 첫날 세 곳 · 둘째 날 한 곳 */
  async function setup(start: string, end: string) {
    await as(A);
    const trip = await newTrip(start, end);
    const a = await addPlace(trip, 0, { name: "A", lat: 35.7, lng: 139.7 });
    const b = await addPlace(trip, 0, { name: "B", lat: 35.71, lng: 139.7 });
    const c = await addPlace(trip, 0, { name: "C", lat: 35.72, lng: 139.7 });
    const d = await addPlace(trip, 1, { name: "D", lat: 35.73, lng: 139.7 });
    return { trip, a, b, c, d };
  }

  /** 그날 일정 이름을 순서대로 */
  async function day(trip: string, dayIndex: number) {
    const { rows } = await db.query<{ name: string }>(
      `select p.name from public.schedule_items si join public.places p on p.id = si.place_id
       where si.trip_id = '${trip}' and si.day_index = ${dayIndex} and si.alternative_of is null
       order by si.position`,
    );
    return rows.map((r) => r.name);
  }

  it("순서 바꾸기 · 다른 날로 옮기기 · 지우기를 한 번에, 목록에 없는 그날 일정은 뒤에", async () => {
    const { trip, a, b, c, d } = await setup("2027-11-01", "2027-11-02");
    // 편집하는 동안 일행이 둘째 날에 넣은 곳
    await addPlace(trip, 1, { name: "E", lat: 35.74, lng: 139.7 });
    await db.query(`select public.apply_schedule_edit($1, $2, $3, null)`, [
      trip,
      JSON.stringify({ 0: [c, a], 1: [d, b] }),
      [],
    ]);
    expect(await day(trip, 0)).toEqual(["C", "A"]);
    expect(await day(trip, 1)).toEqual(["D", "B", "E"]);
    await db.query(`select public.apply_schedule_edit($1, $2, $3, null)`, [
      trip,
      JSON.stringify({ 0: [a] }),
      [c],
    ]);
    expect(await day(trip, 0)).toEqual(["A"]);
  });

  it("다른 여행 일정이 섞이면 거부하고 아무것도 바꾸지 않는다", async () => {
    const { trip, a, b } = await setup("2027-11-03", "2027-11-04");
    const other = await setup("2027-11-05", "2027-11-06");
    expect(
      await rejects(
        `select public.apply_schedule_edit('${trip}', '${JSON.stringify({ 0: [b, a, other.a] })}', '{}', null)`,
      ),
    ).toMatch(/timeline items of this trip/);
    expect(await day(trip, 0)).toEqual(["A", "B", "C"]);
  });
});

describe("하루 요약 (0031)", () => {
  /** 저장된 요약 배열(JSON 으로 읽은 그대로) */
  async function summaries(trip: string) {
    const { rows } = await db.query<{ s: (string | null)[] }>(
      `select to_json(day_summaries) s from public.trips where id = '${trip}'`,
    );
    return rows[0].s;
  }

  /** 요약만 저장한다 */
  function save(trip: string, sums: Record<number, string>) {
    return db.query(`select public.apply_schedule_edit($1, '{}', '{}', $2)`, [
      trip,
      JSON.stringify(sums),
    ]);
  }

  it("바꾼 날만 그 자리에 — 앞의 빈 날은 null, 빈 글은 지운다", async () => {
    await as(A);
    const trip = await newTrip("2027-12-01", "2027-12-04");
    await save(trip, { 2: " 라멘 → 파크 " });
    expect(await summaries(trip)).toEqual([null, null, "라멘 → 파크"]);
    await save(trip, { 0: "도착", 2: "" });
    expect(await summaries(trip)).toEqual(["도착", null, null]);
  });

  it("100자를 넘거나 멤버가 아니면 거부한다", async () => {
    await as(A);
    const trip = await newTrip("2027-12-05", "2027-12-06");
    expect(
      await rejects(
        `select public.apply_schedule_edit('${trip}', '{}', '{}', '${JSON.stringify({ 0: "가".repeat(101) })}')`,
      ),
    ).toMatch(/at most 100/);
    await as(B);
    expect(
      await rejects(
        `select public.apply_schedule_edit('${trip}', '{}', '{}', '${JSON.stringify({ 0: "남의 여행" })}')`,
      ),
    ).toMatch(/not a member/);
    await as(A);
    expect(await summaries(trip)).toEqual([]);
  });
});

describe("편집 저장의 날 범위 (0032)", () => {
  it("여행 일수 밖의 날은 순서 · 요약 모두 거부하고 아무것도 바꾸지 않는다", async () => {
    await as(A);
    const trip = await newTrip("2027-12-10", "2027-12-11");
    const a = await addPlace(trip, 0, { name: "A", lat: 35.7, lng: 139.7 });
    expect(
      await rejects(
        `select public.apply_schedule_edit('${trip}', '${JSON.stringify({ 2: [a] })}', '{}', null)`,
      ),
    ).toMatch(/out of trip range/);
    expect(
      await rejects(
        `select public.apply_schedule_edit('${trip}', '{}', '{}', '${JSON.stringify({ 2000000000: "x" })}')`,
      ),
    ).toMatch(/out of trip range/);
    const { rows } = await db.query<{ day_index: number; s: unknown }>(
      `select si.day_index, to_json(t.day_summaries) s from public.schedule_items si
       join public.trips t on t.id = si.trip_id where si.id = '${a}'`,
    );
    expect(rows).toEqual([{ day_index: 0, s: [] }]);
  });
});

describe("0033 데이터 이전", () => {
  it("옛 지출의 항목명은 메모로, 메모가 없으면 「지출」 로 채운다", async () => {
    const pg = await migratedDb(MIGRATIONS.filter((f) => f < "0033"));
    await pg.exec(`
      insert into auth.users (id, email) values ('${A}', 'a@x');
      insert into public.trips (id, owner_id, title, start_date, end_date)
        values ('66666666-6666-4666-8666-666666666666', '${A}', 't', '2027-06-01', '2027-06-01');
      insert into public.expenses (trip_id, payer_id, amount, currency, spent_on, memo) values
        ('66666666-6666-4666-8666-666666666666', '${A}', 1, 'KRW', '2027-06-01', '  텐동  '),
        ('66666666-6666-4666-8666-666666666666', '${A}', 2, 'KRW', '2027-06-01', null),
        ('66666666-6666-4666-8666-666666666666', '${A}', 3, 'KRW', '2027-06-01', '   ');
    `);
    await applyMigration(pg, "0033_expense_fields.sql");
    const { rows } = await pg.query<{ name: string }>(
      `select name from public.expenses order by amount`,
    );
    expect(rows.map((r) => r.name)).toEqual(["텐동", "지출", "지출"]);
  });
});

describe("지출 칸 (0033)", () => {
  /** 지출 한 줄을 넣는다. 칸은 `칸 = 값` 목록으로 */
  function insertExpense(trip: string, fields: Record<string, string>) {
    const all = {
      trip_id: `'${trip}'`,
      payer_id: `'${A}'`,
      amount: "1",
      currency: "'JPY'",
      name: "'라멘'",
      ...fields,
    };
    return `insert into public.expenses (${Object.keys(all).join(", ")}) values (${Object.values(all).join(", ")})`;
  }

  it("기본값 — 현금 · 합계 포함 · 결제 완료 · 여행 기본 환율, 날짜가 없으면 여행준비", async () => {
    await as(A);
    const trip = await newTrip("2027-10-01", "2027-10-02");
    await db.query(insertExpense(trip, {}));
    const { rows } = await db.query(
      `select payment_method, counted, paid, due_date, rate, spent_on, category from public.expenses where trip_id = '${trip}'`,
    );
    expect(rows).toEqual([
      {
        payment_method: "cash",
        counted: true,
        paid: true,
        due_date: null,
        rate: null,
        spent_on: null,
        category: "other",
      },
    ]);
  });

  it("항공 카테고리 · 결제 예정 + 예정일 · 지출별 환율을 받는다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-04", "2027-10-05");
    await db.query(
      insertExpense(trip, {
        category: "'flight'",
        payment_method: "'card'",
        paid: "false",
        due_date: "'2027-09-20'",
        rate: "8.883",
      }),
    );
    const { rows } = await db.query<{ rate: string }>(
      `select rate from public.expenses where trip_id = '${trip}'`,
    );
    expect(Number(rows[0].rate)).toBe(8.883);
  });

  it("빈 항목명 · 모르는 결제수단 · 0 이하 환율 · 결제 완료인데 예정일은 거부한다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-07", "2027-10-08");
    expect(await rejects(insertExpense(trip, { name: "'  '" }))).toMatch(/expenses_name_chk/);
    expect(await rejects(insertExpense(trip, { payment_method: "'coin'" }))).toMatch(
      /expenses_payment_method_chk/,
    );
    expect(await rejects(insertExpense(trip, { rate: "0" }))).toMatch(/expenses_rate_chk/);
    expect(await rejects(insertExpense(trip, { due_date: "'2027-09-20'" }))).toMatch(
      /expenses_due_date_chk/,
    );
  });
});

describe("정산 인원 · 각자 냄 · 송금 기록 (0034)", () => {
  /** 여행 하나와 guest 한 명 */
  async function setup(start: string, end: string, name = "서연") {
    await as(A);
    const trip = await newTrip(start, end);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.trip_guests (trip_id, name) values ('${trip}', '${name}') returning id`,
    );
    return { trip, guest: rows[0].id };
  }

  it("결제자는 멤버거나 guest 거나 — 둘 다거나 둘 다 없으면 거부한다", async () => {
    const { trip, guest } = await setup("2027-11-01", "2027-11-02");
    const values = (payer: string) =>
      `insert into public.expenses (trip_id, amount, currency, name, ${payer}) values ('${trip}', 1, 'KRW', '라멘', ${payer === "payer_id" ? `'${A}'` : `'${guest}'`})`;
    await db.query(values("payer_id"));
    await db.query(values("payer_guest_id"));
    expect(
      await rejects(
        `insert into public.expenses (trip_id, amount, currency, name, payer_id, payer_guest_id)
         values ('${trip}', 1, 'KRW', 'x', '${A}', '${guest}')`,
      ),
    ).toMatch(/expenses_payer_chk/);
    expect(
      await rejects(
        `insert into public.expenses (trip_id, amount, currency, name) values ('${trip}', 1, 'KRW', 'x')`,
      ),
    ).toMatch(/expenses_payer_chk/);
  });

  it("「각자 냄」 은 결제자가 없어야 한다", async () => {
    const { trip } = await setup("2027-11-04", "2027-11-05");
    await db.query(
      `insert into public.expenses (trip_id, amount, currency, name, split_each) values ('${trip}', 1, 'KRW', '각자', true)`,
    );
    expect(
      await rejects(
        `insert into public.expenses (trip_id, amount, currency, name, split_each, payer_id)
         values ('${trip}', 1, 'KRW', 'x', true, '${A}')`,
      ),
    ).toMatch(/expenses_payer_chk/);
  });

  it("나눌 사람도 멤버 또는 guest 하나, 같은 비용에 같은 사람은 한 줄", async () => {
    const { trip, guest } = await setup("2027-11-07", "2027-11-08");
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, amount, currency, name, payer_id) values ('${trip}', 2, 'KRW', '저녁', '${A}') returning id`,
    );
    const expense = rows[0].id;
    await db.exec(`
      insert into public.expense_splits (expense_id, user_id, share) values ('${expense}', '${A}', 1);
      insert into public.expense_splits (expense_id, guest_id, share) values ('${expense}', '${guest}', 1);
    `);
    expect(
      await rejects(
        `insert into public.expense_splits (expense_id, user_id, guest_id, share) values ('${expense}', '${A}', '${guest}', 1)`,
      ),
    ).toMatch(/expense_splits_person_chk/);
    expect(
      await rejects(
        `insert into public.expense_splits (expense_id, user_id, share) values ('${expense}', '${A}', 1)`,
      ),
    ).toMatch(/expense_splits_member_idx/);
    expect(
      await rejects(
        `insert into public.expense_splits (expense_id, guest_id, share) values ('${expense}', '${guest}', 1)`,
      ),
    ).toMatch(/expense_splits_guest_idx/);
  });

  it("쓰고 있는 guest 는 지울 수 없다 — 비용에서 뺀 뒤에 지운다", async () => {
    const { trip, guest } = await setup("2027-11-10", "2027-11-11");
    await db.query(
      `insert into public.expenses (trip_id, amount, currency, name, payer_guest_id) values ('${trip}', 1, 'KRW', '택시', '${guest}')`,
    );
    expect(await rejects(`delete from public.trip_guests where id = '${guest}'`)).toMatch(
      /foreign key/,
    );
  });

  it("송금 기록은 보내는 쪽 · 받는 쪽이 각각 멤버 또는 guest 하나", async () => {
    const { trip, guest } = await setup("2027-11-13", "2027-11-14");
    await db.query(
      `insert into public.settlements (trip_id, from_guest_id, to_user_id, amount) values ('${trip}', '${guest}', '${A}', 5000)`,
    );
    expect(
      await rejects(
        `insert into public.settlements (trip_id, from_user_id, from_guest_id, to_user_id, amount)
         values ('${trip}', '${A}', '${guest}', '${A}', 1)`,
      ),
    ).toMatch(/settlements_from_chk/);
    expect(
      await rejects(
        `insert into public.settlements (trip_id, from_user_id, to_user_id, amount) values ('${trip}', '${A}', '${A}', 1)`,
      ),
    ).toMatch(/settlements_self_chk/);
    expect(
      await rejects(
        `insert into public.settlements (trip_id, from_user_id, to_user_id, amount) values ('${trip}', '${A}', '${A}', 0)`,
      ),
    ).toMatch(/settlements_amount_check|violates check/);
  });

  it("송금 기록에만 있는 정산 인원도 뺄 수 없다 (0035)", async () => {
    const { trip, guest } = await setup("2027-11-22", "2027-11-23");
    await db.query(
      `insert into public.settlements (trip_id, from_guest_id, to_user_id, amount) values ('${trip}', '${guest}', '${A}', 100)`,
    );
    expect(await rejects(`delete from public.trip_guests where id = '${guest}'`)).toMatch(
      /foreign key/,
    );
  });

  it("다른 여행의 정산 인원은 결제자 · 나눌 사람 · 송금에 쓸 수 없다 (0036)", async () => {
    const other = await setup("2027-12-01", "2027-12-02", "다른 여행 인원");
    const { trip } = await setup("2027-12-04", "2027-12-05");
    expect(
      await rejects(
        `insert into public.expenses (trip_id, amount, currency, name, payer_guest_id)
         values ('${trip}', 1, 'KRW', 'x', '${other.guest}')`,
      ),
    ).toMatch(/foreign key/);

    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, amount, currency, name, payer_id) values ('${trip}', 1, 'KRW', '저녁', '${A}') returning id`,
    );
    expect(
      await rejects(
        `insert into public.expense_splits (expense_id, guest_id, share) values ('${rows[0].id}', '${other.guest}', 1)`,
      ),
    ).toMatch(/foreign key/);
    expect(
      await rejects(
        `insert into public.settlements (trip_id, from_guest_id, to_user_id, amount) values ('${trip}', '${other.guest}', '${A}', 1)`,
      ),
    ).toMatch(/foreign key/);
  });

  it("나눔 줄의 여행은 비용에서 채운다 (0036)", async () => {
    const { trip, guest } = await setup("2027-12-07", "2027-12-08");
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, amount, currency, name, payer_id) values ('${trip}', 2, 'KRW', '점심', '${A}') returning id`,
    );
    await db.query(
      `insert into public.expense_splits (expense_id, guest_id, share) values ('${rows[0].id}', '${guest}', 2)`,
    );
    const { rows: splits } = await db.query<{ trip_id: string }>(
      `select trip_id from public.expense_splits where expense_id = '${rows[0].id}'`,
    );
    expect(splits[0].trip_id).toBe(trip);
  });

  it("merge_trip_guest: 기록을 멤버로 옮기고 인원을 지운다 — 몫은 더하고, 그 멤버와 주고받은 송금은 지운다 (0035)", async () => {
    const { trip, guest } = await setup("2027-11-16", "2027-11-17");
    // 멤버 추가는 초대로만 되므로(RLS) 테스트에서는 역할을 풀고 직접 넣는다
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, amount, currency, name, payer_guest_id) values ('${trip}', 2, 'KRW', '저녁', '${guest}') returning id`,
    );
    const expense = rows[0].id;
    await db.exec(`
      insert into public.expense_splits (expense_id, guest_id, share) values ('${expense}', '${guest}', 1);
      insert into public.expense_splits (expense_id, user_id, share) values ('${expense}', '${B}', 1);
      insert into public.settlements (trip_id, from_guest_id, to_user_id, amount) values ('${trip}', '${guest}', '${A}', 100);
      insert into public.settlements (trip_id, from_guest_id, to_user_id, amount) values ('${trip}', '${guest}', '${B}', 50);
    `);

    await db.query(`select public.merge_trip_guest('${guest}', '${B}')`);

    const after = await db.query<{
      payer: string;
      splits: number;
      share: string;
      from_user: string;
      settlements: number;
      guests: number;
    }>(
      `select (select payer_id from public.expenses where id = '${expense}') payer,
              (select count(*)::int from public.expense_splits where expense_id = '${expense}') splits,
              (select share::text from public.expense_splits where expense_id = '${expense}') share,
              (select from_user_id from public.settlements where trip_id = '${trip}') from_user,
              (select count(*)::int from public.settlements where trip_id = '${trip}') settlements,
              (select count(*)::int from public.trip_guests where trip_id = '${trip}') guests`,
    );
    // 인원의 몫 1 이 멤버 줄(1)에 더해져 한 줄 2 가 된다. B 에게 보낸 기록은 한 사람이 되어 지워지고 A 에게 보낸 것만 남는다
    expect(after.rows[0]).toEqual({
      payer: B,
      splits: 1,
      share: "2.00",
      from_user: B,
      settlements: 1,
      guests: 0,
    });
  });

  it("merge_trip_guest: 그 여행 멤버가 아니면 거부한다", async () => {
    const { guest } = await setup("2027-11-19", "2027-11-20");
    expect(await rejects(`select public.merge_trip_guest('${guest}', '${B}')`)).toMatch(
      /not a trip member/,
    );
  });
});

describe("기준 화폐 바꾸기 (0037 · 0038)", () => {
  /** 기준 KRW · 100엔 = 855원 · 1달러 = 1,400원 여행과 지출 · 송금 기록 */
  async function setup(start: string) {
    await as(A);
    const trip = await newTrip(start, start);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.trip_guests (trip_id, name) values ('${trip}', '서연') returning id`,
    );
    const guest = rows[0].id;
    await db.exec(`
      update public.trips set exchange_rates = '{"JPY":{"unit":100,"value":855},"USD":{"unit":1,"value":1400}}'
      where id = '${trip}';
      insert into public.expenses (trip_id, payer_id, amount, currency, name, rate) values
        ('${trip}','${A}',10000,'KRW','원',null),
        ('${trip}','${A}',1000,'JPY','엔',9.05),
        ('${trip}','${A}',10,'USD','달러',1368),
        ('${trip}','${A}',20,'USD','달러 기본',null);
      insert into public.settlements (trip_id, from_guest_id, to_user_id, amount) values
        ('${trip}','${guest}','${A}',13148);
    `);
    return trip;
  }

  /** 엔 기준으로 다시 계산한 여행 환율 — 화면이 넘기는 값 */
  const JPY_RATES = JSON.stringify({
    KRW: { unit: 100, value: 11.7 },
    USD: { unit: 1, value: 163.74 },
  });

  it("여행 환율 · 지출별 환율 · 송금 기록을 새 기준으로, 새 기준으로 쓴 지출은 환율을 비운다", async () => {
    const trip = await setup("2028-01-01");
    await db.query(`select public.change_home_currency($1, 'KRW', 'JPY', $2, 8.55)`, [
      trip,
      JPY_RATES,
    ]);

    const t = await db.query<{ home: string; rates: unknown }>(
      `select home_currency home, exchange_rates rates from public.trips where id = '${trip}'`,
    );
    expect(t.rows[0].home).toBe("JPY");
    expect(t.rows[0].rates).toEqual(JSON.parse(JPY_RATES));

    const e = await db.query<{ v: string }>(
      `select name || '=' || coalesce(rate::text, 'null') v from public.expenses
       where trip_id = '${trip}' order by name`,
    );
    // 1368 원/달러 ÷ 8.55 = 160 엔/달러 · 금액은 그대로
    expect(e.rows.map((r) => r.v)).toEqual([
      "달러=160.00000000",
      "달러 기본=null",
      "엔=null",
      "원=null",
    ]);

    const s = await db.query<{ a: string }>(
      `select amount::text a from public.settlements where trip_id = '${trip}'`,
    );
    // ₩13,148 ÷ 8.55 = ¥1,537.78
    expect(s.rows[0].a).toBe("1537.78");
  });

  it("같은 화폐 · 새 기준이 든 환율 · 옛 기준이 빠진 환율 · 0 이하 값 · 화면이 알던 기준이 다름 · 멤버가 아닌 사람은 거부하고 아무것도 바꾸지 않는다", async () => {
    const trip = await setup("2028-01-03");
    const call = (currency: string, rates: string, factor: number) =>
      rejects(
        `select public.change_home_currency('${trip}', 'KRW', '${currency}', '${rates}'::jsonb, ${factor})`,
      );
    expect(await call("KRW", JPY_RATES, 8.55)).toMatch(/already the home currency/);
    expect(
      await call(
        "JPY",
        JSON.stringify({ JPY: { unit: 100, value: 1 }, KRW: { unit: 100, value: 11.7 } }),
        8.55,
      ),
    ).toMatch(/must not include the new home/);
    expect(await call("JPY", JSON.stringify({ USD: { unit: 1, value: 163.74 } }), 8.55)).toMatch(
      /must include the old home/,
    );
    expect(await call("JPY", JPY_RATES, 0)).toMatch(/factor must be positive/);
    // 화면이 알던 기준(USD)이 지금 기준(KRW)과 다르면 — 다른 멤버가 먼저 바꾼 경우
    expect(
      await rejects(
        `select public.change_home_currency('${trip}', 'USD', 'JPY', '${JPY_RATES}'::jsonb, 8.55)`,
      ),
    ).toMatch(/changed by someone else/);

    await as(B);
    expect(await call("JPY", JPY_RATES, 8.55)).toMatch(/not a member/);

    await as(A);
    const t = await db.query<{ home: string }>(
      `select home_currency home from public.trips where id = '${trip}'`,
    );
    expect(t.rows[0].home).toBe("KRW");
    const s = await db.query<{ a: string }>(
      `select amount::text a from public.settlements where trip_id = '${trip}'`,
    );
    expect(s.rows[0].a).toBe("13148.00");
  });

  it("중간에 실패하면 여행 · 지출도 되돌린다(한 트랜잭션)", async () => {
    const trip = await setup("2028-01-05");
    // 송금 기록 금액을 바꾸는 단계에서 실패하게 한다
    await db.exec(`
      reset role;
      create function public.fail_settlement_update() returns trigger language plpgsql as
        $$ begin raise exception 'boom'; end $$;
      create trigger fail_settlement_update before update on public.settlements
        for each row execute function public.fail_settlement_update();
    `);
    await as(A);
    expect(
      await rejects(
        `select public.change_home_currency('${trip}', 'KRW', 'JPY', '${JPY_RATES}'::jsonb, 8.55)`,
      ),
    ).toMatch(/boom/);
    await db.exec(`
      reset role;
      drop trigger fail_settlement_update on public.settlements;
      drop function public.fail_settlement_update();
    `);
    await as(A);
    const t = await db.query<{ home: string }>(
      `select home_currency home from public.trips where id = '${trip}'`,
    );
    expect(t.rows[0].home).toBe("KRW");
    const e = await db.query<{ r: string }>(
      `select rate::text r from public.expenses where trip_id = '${trip}' and name = '달러'`,
    );
    expect(e.rows[0].r).toBe("1368.00000000");
  });
});

describe("여행에 통화 더하기 (0039 · 0040)", () => {
  it("없는 통화만 더하고, 이미 있는 통화 · 다른 통화의 환율은 그대로 둔다", async () => {
    await as(A);
    const trip = await newTrip("2028-02-01", "2028-02-01");
    await db.exec(
      `update public.trips set exchange_rates = '{"JPY":{"unit":100,"value":855}}' where id = '${trip}'`,
    );
    await db.query(`select public.add_trip_currency('${trip}', 'KRW', 'USD', 1, 1400)`);
    await db.query(`select public.add_trip_currency('${trip}', 'KRW', 'JPY', 100, 920)`);
    const { rows } = await db.query<{ rates: unknown }>(
      `select exchange_rates rates from public.trips where id = '${trip}'`,
    );
    expect(rows[0].rates).toEqual({
      JPY: { unit: 100, value: 855 },
      USD: { unit: 1, value: 1400 },
    });
  });

  it("기준 화폐 · 잘못된 코드 · 0 이하 환율 · 화면이 알던 기준이 다름 · 멤버가 아닌 사람은 거부한다", async () => {
    await as(A);
    const trip = await newTrip("2028-02-03", "2028-02-03");
    expect(await rejects(`select public.add_trip_currency('${trip}', 'KRW', 'KRW', 1, 1)`)).toMatch(
      /home currency has no rate/,
    );
    expect(await rejects(`select public.add_trip_currency('${trip}', 'KRW', 'usd', 1, 1)`)).toMatch(
      /3 capital letters/,
    );
    expect(await rejects(`select public.add_trip_currency('${trip}', 'KRW', 'USD', 1, 0)`)).toMatch(
      /rate must be positive/,
    );
    // 화면이 알던 기준(USD)이 지금 기준(KRW)과 다르면 — 다른 멤버가 먼저 바꾼 경우
    expect(
      await rejects(`select public.add_trip_currency('${trip}', 'USD', 'JPY', 100, 920)`),
    ).toMatch(/changed by someone else/);
    await as(B);
    expect(
      await rejects(`select public.add_trip_currency('${trip}', 'KRW', 'USD', 1, 1400)`),
    ).toMatch(/not a member/);
  });
});

describe("여행 환율 하나 바꾸기 (0063)", () => {
  it("그 통화만 바꾸고 다른 통화의 환율은 그대로 둔다", async () => {
    await as(A);
    const trip = await newTrip("2028-02-05", "2028-02-05");
    await db.exec(
      `update public.trips set exchange_rates = '{"JPY":{"unit":100,"value":920},"USD":{"unit":1,"value":1400}}' where id = '${trip}'`,
    );
    await db.query(`select public.set_trip_rate('${trip}', 'KRW', 'JPY', 100, 844.5)`);
    const { rows } = await db.query<{ rates: unknown }>(
      `select exchange_rates rates from public.trips where id = '${trip}'`,
    );
    expect(rows[0].rates).toEqual({
      JPY: { unit: 100, value: 844.5 },
      USD: { unit: 1, value: 1400 },
    });
  });

  it("없는 통화 · 0 이하 환율 · 화면이 알던 기준이 다름 · 멤버가 아닌 사람은 거부한다", async () => {
    await as(A);
    const trip = await newTrip("2028-02-07", "2028-02-07");
    await db.exec(
      `update public.trips set exchange_rates = '{"JPY":{"unit":100,"value":920}}' where id = '${trip}'`,
    );
    expect(await rejects(`select public.set_trip_rate('${trip}', 'KRW', 'USD', 1, 1400)`)).toMatch(
      /currency not in trip/,
    );
    expect(await rejects(`select public.set_trip_rate('${trip}', 'KRW', 'JPY', 100, 0)`)).toMatch(
      /rate must be positive/,
    );
    expect(await rejects(`select public.set_trip_rate('${trip}', 'USD', 'JPY', 100, 900)`)).toMatch(
      /changed by someone else/,
    );
    await as(B);
    expect(await rejects(`select public.set_trip_rate('${trip}', 'KRW', 'JPY', 100, 900)`)).toMatch(
      /not a member/,
    );
  });
});

describe("여행 환율 저장 (0066)", () => {
  it("고친 통화만 바꾸고 · 더하고 · 뺀 통화만 지운다 — 그사이 일행이 더한 통화는 남는다", async () => {
    await as(A);
    const trip = await newTrip("2028-02-09", "2028-02-09");
    await db.exec(
      `update public.trips set exchange_rates = '{"JPY":{"unit":100,"value":920},"USD":{"unit":1,"value":1400}}' where id = '${trip}'`,
    );
    // 설정 창을 연 뒤 일행이 비용 입력에서 EUR 를 더했다
    await db.query(`select public.add_trip_currency('${trip}', 'KRW', 'EUR', 1, 1500)`);
    await db.query(
      `select public.save_trip_rates('${trip}', 'KRW', '{"JPY":{"unit":100,"value":900},"TWD":{"unit":1,"value":43,"extra":1}}', array['USD'])`,
    );
    const { rows } = await db.query<{ rates: unknown }>(
      `select exchange_rates rates from public.trips where id = '${trip}'`,
    );
    expect(rows[0].rates).toEqual({
      JPY: { unit: 100, value: 900 },
      TWD: { unit: 1, value: 43 },
      EUR: { unit: 1, value: 1500 },
    });
  });

  it("잘못된 코드 · 0 이하 · 숫자 아닌 환율 · 기준 화폐 · 화면이 알던 기준이 다름 · 멤버가 아닌 사람은 거부한다", async () => {
    await as(A);
    const trip = await newTrip("2028-02-11", "2028-02-11");
    const save = (home: string, set: string) =>
      rejects(`select public.save_trip_rates('${trip}', '${home}', '${set}', null)`);
    expect(await save("KRW", '{"usd":{"unit":1,"value":1400}}')).toMatch(/3 capital letters/);
    expect(await save("KRW", '{"USD":{"unit":1,"value":0}}')).toMatch(/rate must be positive/);
    expect(await save("KRW", '{"USD":{"unit":1,"value":"1400"}}')).toMatch(/rate must be positive/);
    expect(await save("KRW", '{"KRW":{"unit":1,"value":1}}')).toMatch(/home currency has no rate/);
    expect(await save("USD", '{"JPY":{"unit":100,"value":920}}')).toMatch(
      /changed by someone else/,
    );
    expect(await save("KRW", "[]")).toMatch(/must be an object/);
    await as(B);
    expect(await save("KRW", '{"JPY":{"unit":100,"value":920}}')).toMatch(/not a member/);
  });
});

describe("여행 가이드 보관함 (0067)", () => {
  /** 그 여행 보관함의 장소 이름 */
  async function guideNames(trip: string) {
    const { rows } = await db.query<{ name: string }>(
      `select p.name from public.trip_places tp join public.places p on p.id = tp.place_id
       where tp.trip_id = '${trip}' order by p.name`,
    );
    return rows.map((r) => r.name);
  }

  it("일정에 넣은 장소(대체 장소 포함)가 보관함에 들어가고, 일정에서 지워도 남는다", async () => {
    await as(A);
    const trip = await newTrip("2028-03-01", "2028-03-01");
    const main = await addPlace(trip, 0, { name: "라멘집" });
    await db.query(`select public.create_place_schedule($1, 0, $2, $3)`, [
      trip,
      JSON.stringify({ name: "대체 카페" }),
      JSON.stringify({ alternative_of: main }),
    ]);
    expect(await guideNames(trip)).toEqual(["대체 카페", "라멘집"]);
    await db.query(`delete from public.schedule_items where id = '${main}'`);
    expect(await guideNames(trip)).toEqual(["대체 카페", "라멘집"]);
  });

  it("보관함에만 있는 남의 장소도 멤버는 읽고 일정에 붙인다 — 멤버가 아니면 못 읽는다", async () => {
    await as(A);
    const trip = await newTrip("2028-03-03", "2028-03-03");
    const { rows } = await db.query<{ id: string }>(
      `insert into public.places (city_id, name) values ('tokyo', 'A 의 보관 장소') returning id`,
    );
    const place = rows[0].id;
    await db.exec(
      `reset role; insert into public.trip_places (trip_id, place_id, added_by) values ('${trip}', '${place}', '${A}');`,
    );
    await as(B);
    expect((await db.query(`select 1 from public.places where id = '${place}'`)).rows).toHaveLength(
      0,
    );
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(B);
    expect((await db.query(`select 1 from public.places where id = '${place}'`)).rows).toHaveLength(
      1,
    );
    await db.query(`select public.add_schedule_places($1, 0, $2)`, [
      trip,
      JSON.stringify([{ place_id: place }]),
    ]);
  });

  it("멤버가 나가면 그 사람이 담은 장소의 보관함 줄도 소유자 사본으로 — 줄은 하나, 메모는 남는다", async () => {
    await as(A);
    const trip = await newTrip("2028-03-05", "2028-03-05");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(B);
    await addPlace(trip, 0, { name: "B 의 맛집", google_place_id: "g-guide-leave" });
    await db.exec(
      `reset role; update public.trip_places set memo = '꼭 가기' where trip_id = '${trip}';`,
    );
    await as(B);
    await db.query(
      `delete from public.trip_members where trip_id = '${trip}' and user_id = '${B}'`,
    );
    await as(A);
    const { rows } = await db.query<{ owner: string; memo: string }>(
      `select p.created_by owner, tp.memo from public.trip_places tp
       join public.places p on p.id = tp.place_id where tp.trip_id = '${trip}'`,
    );
    expect(rows).toEqual([{ owner: A, memo: "꼭 가기" }]);
  });

  it("마이그레이션 전에 일정에 있던 장소를 처음 넣은 사람으로 채운다", async () => {
    const before = MIGRATIONS.filter((f) => f < "0067");
    const pg = await migratedDb(before);
    await pg.exec(`insert into auth.users (id, email) values ('${A}', 'a@x');`);
    await pg.exec(`select set_config('test.uid', '${A}', false); set role authenticated;`);
    const { rows } = await pg.query<{ id: string }>(
      `select public.create_trip('t', '2028-03-07', '2028-03-07', array['tokyo']) id`,
    );
    await pg.query(`select public.add_schedule_place($1, 0, $2)`, [
      rows[0].id,
      JSON.stringify({ name: "옛 장소" }),
    ]);
    await pg.exec("reset role;");
    await applyMigration(
      pg,
      MIGRATIONS.find((f) => f.startsWith("0067"))!,
    );
    const { rows: got } = await pg.query<{ added_by: string }>(
      `select added_by from public.trip_places where trip_id = '${rows[0].id}'`,
    );
    expect(got).toEqual([{ added_by: A }]);
    await pg.close();
  }, 30_000);
});

describe("여행 가이드 보관함 쓰기 (0068)", () => {
  /** A 의 여행 + 멤버 B, A 가 만든 장소 하나 */
  async function setup(start: string) {
    await as(A);
    const trip = await newTrip(start, start);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.places (city_id, name) values ('tokyo', '보관할 곳') returning id`,
    );
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    return { trip, place: rows[0].id };
  }

  it("멤버가 담고 메모를 고치고 뺀다 — 메모 말고 다른 칸은 고치지 못한다", async () => {
    const { trip, place } = await setup("2028-04-01");
    await as(A);
    await db.query(`insert into public.trip_places (trip_id, place_id) values ($1, $2)`, [
      trip,
      place,
    ]);
    await as(B);
    await db.query(`update public.trip_places set memo = '꼭' where trip_id = $1`, [trip]);
    expect(
      await rejects(`update public.trip_places set added_by = '${B}' where trip_id = '${trip}'`),
    ).toMatch(/permission denied/);
    const { rows } = await db.query(
      `delete from public.trip_places where trip_id = $1 and place_id = $2 returning memo`,
      [trip, place],
    );
    expect(rows).toEqual([{ memo: "꼭" }]);
  });

  it("남의 장소는 붙일 수 있을 때만 담는다 — 멤버가 아니면 못 담는다", async () => {
    const { trip, place } = await setup("2028-04-03");
    await as(B);
    expect(
      await rejects(
        `insert into public.trip_places (trip_id, place_id) values ('${trip}', '${place}')`,
      ),
    ).toMatch(/row-level security/);
    await as(A);
    const other = await newTrip("2028-04-04", "2028-04-04");
    await as(B);
    expect(
      await rejects(
        `insert into public.trip_places (trip_id, place_id) values ('${other}', '${place}')`,
      ),
    ).toMatch(/row-level security/);
  });

  it("일정(대체 장소 포함)에 있는 장소는 빼지 못한다 — 0행", async () => {
    await as(A);
    const trip = await newTrip("2028-04-06", "2028-04-06");
    const main = await addPlace(trip, 0, { name: "일정 장소" });
    await db.query(`select public.create_place_schedule($1, 0, $2, $3)`, [
      trip,
      JSON.stringify({ name: "대체만" }),
      JSON.stringify({ alternative_of: main }),
    ]);
    const { rows } = await db.query(
      `delete from public.trip_places where trip_id = $1 returning 1`,
      [trip],
    );
    expect(rows).toEqual([]);
  });
});

describe("가이드 장소 저장 (0069)", () => {
  /** 장소를 저장하고 장소 id 를 돌려준다 */
  async function save(trip: string, place: Record<string, unknown>) {
    const { rows } = await db.query<{ id: string }>(`select public.save_guide_place($1, $2) id`, [
      trip,
      JSON.stringify(place),
    ]);
    return rows[0].id;
  }

  it("새 장소를 만들어 보관함에 넣는다 — 아이콘은 장소의 기본 아이콘, 일정은 생기지 않는다", async () => {
    await as(A);
    const trip = await newTrip("2028-05-01", "2028-05-01");
    const id = await save(trip, { name: "센소지", category: "sight", emoji: "⛩️" });
    const { rows } = await db.query(
      `select p.name, p.category, p.emoji, tp.added_by from public.trip_places tp
       join public.places p on p.id = tp.place_id where tp.trip_id = $1`,
      [trip],
    );
    expect(rows).toEqual([{ name: "센소지", category: "sight", emoji: "⛩️", added_by: A }]);
    const items = await db.query(`select 1 from public.schedule_items where place_id = $1`, [id]);
    expect(items.rows).toHaveLength(0);
  });

  it("이미 가진 구글 장소는 고쳐 쓰고, 기본 아이콘은 비어 있을 때만 채운다 — 보관함 줄은 하나, 메모 유지", async () => {
    await as(A);
    const trip = await newTrip("2028-05-03", "2028-05-03");
    const first = await save(trip, { name: "카페", google_place_id: "g-guide-1", emoji: "☕" });
    await db.query(`update public.trip_places set memo = '아침에' where trip_id = $1`, [trip]);
    const again = await save(trip, {
      name: "카페 본점",
      google_place_id: "g-guide-1",
      emoji: "🍰",
    });
    expect(again).toBe(first);
    const { rows } = await db.query(
      `select p.name, p.emoji, tp.memo from public.trip_places tp
       join public.places p on p.id = tp.place_id where tp.trip_id = $1`,
      [trip],
    );
    expect(rows).toEqual([{ name: "카페 본점", emoji: "☕", memo: "아침에" }]);
  });

  it("일정 직접 추가는 장소의 기본 아이콘을 건드리지 않는다 — 아이콘은 일정 줄에", async () => {
    await as(A);
    const trip = await newTrip("2028-05-05", "2028-05-05");
    await save(trip, { name: "라멘", google_place_id: "g-guide-2" });
    await db.query(`select public.create_place_schedule($1, 0, $2, $3)`, [
      trip,
      JSON.stringify({ name: "라멘", google_place_id: "g-guide-2", emoji: "🍜" }),
      JSON.stringify({ emoji: "🍥" }),
    ]);
    const { rows } = await db.query(
      `select p.emoji place_emoji, si.emoji item_emoji from public.schedule_items si
       join public.places p on p.id = si.place_id where si.trip_id = $1`,
      [trip],
    );
    expect(rows).toEqual([{ place_emoji: null, item_emoji: "🍥" }]);
  });

  it("멤버가 아니면 장소도 만들지 않고 거부한다", async () => {
    await as(A);
    const trip = await newTrip("2028-05-07", "2028-05-07");
    await as(B);
    expect(await rejects(`select public.save_guide_place('${trip}', '{"name":"x"}')`)).toMatch(
      /not a member/,
    );
    const { rows } = await db.query(`select 1 from public.places where name = 'x'`);
    expect(rows).toHaveLength(0);
  });
});

describe("장소 지역 (0070)", () => {
  /** 장소를 넣고 지역 id 를 돌려준다(superuser — 트리거만 본다) */
  async function insertPlace(cols: Record<string, unknown>) {
    const keys = Object.keys(cols);
    const { rows } = await db.query<{ id: string; area_id: string | null }>(
      `insert into public.places (created_by, ${keys.join(", ")}) values ('${A}', ${keys
        .map((_, i) => `$${i + 1}`)
        .join(", ")}) returning id, area_id`,
      Object.values(cols),
    );
    return rows[0];
  }

  it("넣을 때 반경 안의 가장 가까운 지역으로, 든 곳이 없거나 좌표가 없으면 비운다", async () => {
    await db.exec("reset role;");
    const ginza = await insertPlace({
      city_id: "tokyo",
      name: "긴자 가게",
      lat: 35.6717,
      lng: 139.766,
    });
    expect(ginza.area_id).toBe("tokyo-ginza");
    const far = await insertPlace({
      city_id: "tokyo",
      name: "오다이바",
      lat: 35.627,
      lng: 139.775,
    });
    expect(far.area_id).toBeNull();
    const none = await insertPlace({ city_id: "tokyo", name: "좌표 없음" });
    expect(none.area_id).toBeNull();
    const osaka = await insertPlace({
      city_id: "osaka",
      name: "도톤보리",
      lat: 34.6687,
      lng: 135.5013,
    });
    expect(osaka.area_id).toBeNull();
  });

  it("고른 지역은 두고, 위치만 옮기면 다시 정하고, 다른 도시의 지역은 붙지 않는다", async () => {
    await db.exec("reset role;");
    const p = await insertPlace({
      city_id: "tokyo",
      name: "고른 곳",
      lat: 35.6717,
      lng: 139.766,
      area_id: "tokyo-nihonbashi",
    });
    expect(p.area_id).toBe("tokyo-nihonbashi");
    const area = async () =>
      (
        await db.query<{ area_id: string | null }>(
          `select area_id from public.places where id = $1`,
          [p.id],
        )
      ).rows[0].area_id;
    await db.query(`update public.places set name = '이름만' where id = $1`, [p.id]);
    expect(await area()).toBe("tokyo-nihonbashi");
    await db.query(`update public.places set lat = 35.7295, lng = 139.7109 where id = $1`, [p.id]);
    expect(await area()).toBe("tokyo-ikebukuro");
    await db.query(
      `update public.places set lat = 35.659, lng = 139.701, area_id = 'tokyo-ginza' where id = $1`,
      [p.id],
    );
    expect(await area()).toBe("tokyo-ginza");
    await db.exec(
      `insert into public.city_areas (id, city_id, name, position, lat, lng, radius_m)
       values ('osaka-namba', 'osaka', '난바', 1, 34.6656, 135.5013, 1500);`,
    );
    await db.query(`update public.places set area_id = 'osaka-namba' where id = $1`, [p.id]);
    expect(await area()).toBe("tokyo-shibuya");
    await db.exec(`delete from public.city_areas where id = 'osaka-namba';`);
  });

  it("장소 저장(가이드)이 고른 지역을 받는다 — 고쳐 쓸 때 보내지 않으면 그대로", async () => {
    await as(A);
    const trip = await newTrip("2028-05-09", "2028-05-09");
    const save = async (place: Record<string, unknown>) =>
      (
        await db.query<{ id: string }>(`select public.save_guide_place($1, $2) id`, [
          trip,
          JSON.stringify(place),
        ])
      ).rows[0].id;
    const id = await save({
      name: "도쿄역 라멘",
      google_place_id: "g-area-1",
      lat: 35.6812,
      lng: 139.7671,
      area_id: "tokyo-ginza",
    });
    await save({ name: "도쿄역 라멘", google_place_id: "g-area-1", lat: 35.6812, lng: 139.7671 });
    const { rows } = await db.query(`select area_id from public.places where id = $1`, [id]);
    expect(rows).toEqual([{ area_id: "tokyo-ginza" }]);
  });

  it("마이그레이션 전에 있던 장소를 좌표로 채우고 고친 시각은 그대로 둔다", async () => {
    const before = MIGRATIONS.filter((f) => f < "0070");
    const pg = await migratedDb(before);
    await pg.exec(`insert into auth.users (id, email) values ('${A}', 'a@x');`);
    const { rows } = await pg.query<{ id: string; updated_at: string }>(
      `insert into public.places (city_id, created_by, name, lat, lng)
       values ('tokyo', '${A}', '옛 장소', 35.7295, 139.7109) returning id, updated_at::text`,
    );
    await applyMigration(
      pg,
      MIGRATIONS.find((f) => f.startsWith("0070"))!,
    );
    const { rows: got } = await pg.query(
      `select area_id, updated_at::text from public.places where id = $1`,
      [rows[0].id],
    );
    expect(got).toEqual([{ area_id: "tokyo-ikebukuro", updated_at: rows[0].updated_at }]);
    await pg.close();
  }, 30_000);
});

describe("장소 메뉴 · 종류 (0071)", () => {
  it("장소 저장이 종류를 받고, 다시 담을 때 보내지 않으면 그대로 · 모르는 값은 거부", async () => {
    await as(A);
    const trip = await newTrip("2028-05-11", "2028-05-11");
    const save = (place: Record<string, unknown>) =>
      db.query<{ id: string }>(`select public.save_guide_place($1, $2) id`, [
        trip,
        JSON.stringify(place),
      ]);
    const { rows } = await save({
      name: "라멘집",
      category: "food",
      subtype: "ramen",
      google_place_id: "g-sub",
    });
    await save({ name: "라멘집", category: "food", google_place_id: "g-sub" });
    const got = await db.query(`select subtype from public.places where id = $1`, [rows[0].id]);
    expect(got.rows).toEqual([{ subtype: "ramen" }]);
    expect(
      await rejects(`select public.save_guide_place('${trip}', '{"name":"x","subtype":"pizza"}')`),
    ).toMatch(/check constraint/);
  });

  it("마이그레이션 전 장소를 이름 먼저, 안 되면 설명으로 채운다 — 휴식은 이름만, 카페 · 휴식은 나머지도", async () => {
    const before = MIGRATIONS.filter((f) => f < "0071");
    const pg = await migratedDb(before);
    await pg.exec(`insert into auth.users (id, email) values ('${A}', 'a@x');`);
    const put = (name: string, category: string | null, description: string | null) =>
      pg.query(
        `insert into public.places (city_id, created_by, name, category, description) values ('tokyo', '${A}', $1, $2, $3)`,
        [name, category, description],
      );
    await put("텐동 카네코", "food", "장어 튀김이 유명합니다");
    await put("우나기노 나루세", "food", "장어덮밥 전문점입니다");
    await put("The KITCHEN", "food", "스파 안 식당입니다");
    await put("타임스 스파", "rest", "마사지도 받을 수 있습니다");
    await put("조이풀 마사지 스파", "rest", null);
    await put("코히테이", "cafe", null);
    await put("센소지", "sight", null);
    await applyMigration(
      pg,
      MIGRATIONS.find((f) => f.startsWith("0071"))!,
    );
    const { rows } = await pg.query<{ name: string; subtype: string | null }>(
      `select name, subtype from public.places order by name`,
    );
    expect(Object.fromEntries(rows.map((r) => [r.name, r.subtype]))).toEqual({
      "The KITCHEN": null,
      "텐동 카네코": "tendon",
      "우나기노 나루세": "unagi",
      "타임스 스파": "onsen",
      "조이풀 마사지 스파": "massage",
      코히테이: "sweets",
      센소지: null,
    });
    await pg.close();
  }, 30_000);
});

describe("지출 영수증 (0041 · 0042)", () => {
  /** 여행 · 지출 하나 */
  async function setup(start: string) {
    await as(A);
    const trip = await newTrip(start, start);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, payer_id, amount, currency, name) values ('${trip}', '${A}', 1, 'KRW', '라멘') returning id`,
    );
    return { trip, expense: rows[0].id };
  }
  /** 영수증 한 줄을 붙인다 */
  const attach = (trip: string, expense: string, key: string, mime = "image/jpeg") =>
    db.query(
      `insert into public.expense_receipts (expense_id, trip_id, key, name, mime, size) values ($1, $2, $3, 'r.jpg', $4, 1000)`,
      [expense, trip, key, mime],
    );

  it("그 여행 폴더의 키만, 사진 · PDF 만, 한 지출에 3장까지(0042)", async () => {
    const { trip, expense } = await setup("2028-03-01");
    await attach(trip, expense, `${trip}/a.jpg`);
    await attach(trip, expense, `${trip}/b.pdf`, "application/pdf");
    expect(
      await rejects(
        `insert into public.expense_receipts (expense_id, trip_id, key, name, mime, size) values ('${expense}', '${trip}', 'other/x.jpg', 'x', 'image/jpeg', 1)`,
      ),
    ).toMatch(/expense_receipts_key_chk/);
    expect(
      await rejects(
        `insert into public.expense_receipts (expense_id, trip_id, key, name, mime, size) values ('${expense}', '${trip}', '${trip}/x.exe', 'x', 'application/x-msdownload', 1)`,
      ),
    ).toMatch(/mime/);
    await attach(trip, expense, `${trip}/c.jpg`);
    expect(
      await rejects(
        `insert into public.expense_receipts (expense_id, trip_id, key, name, mime, size) values ('${expense}', '${trip}', '${trip}/fourth.jpg', 'x', 'image/jpeg', 1)`,
      ),
    ).toMatch(/too many receipts/);
  });

  it("다른 여행의 지출에는 붙이지 못하고, 멤버가 아니면 보지도 붙이지도 못한다", async () => {
    const one = await setup("2028-03-03");
    const two = await setup("2028-03-05");
    expect(
      await rejects(
        `insert into public.expense_receipts (expense_id, trip_id, key, name, mime, size) values ('${two.expense}', '${one.trip}', '${one.trip}/x.jpg', 'x', 'image/jpeg', 1)`,
      ),
    ).toMatch(/row-level security/);
    await attach(one.trip, one.expense, `${one.trip}/mine.jpg`);
    await as(B);
    const seen = await db.query(
      `select 1 from public.expense_receipts where trip_id = '${one.trip}'`,
    );
    expect(seen.rows).toHaveLength(0);
    expect(
      await rejects(
        `insert into public.expense_receipts (expense_id, trip_id, key, name, mime, size) values ('${one.expense}', '${one.trip}', '${one.trip}/b.jpg', 'x', 'image/jpeg', 1)`,
      ),
    ).toMatch(/row-level security/);
  });

  it("지출을 지우면 영수증 줄도 지워진다", async () => {
    const { trip, expense } = await setup("2028-03-07");
    await attach(trip, expense, `${trip}/gone.jpg`);
    await db.query(`delete from public.expenses where id = '${expense}'`);
    const left = await db.query(
      `select 1 from public.expense_receipts where expense_id = '${expense}'`,
    );
    expect(left.rows).toHaveLength(0);
  });

  it("버킷: 경로 첫 칸 여행의 멤버만 파일을 올린다", async () => {
    const { trip } = await setup("2028-03-09");
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('receipts', '${trip}/ok.jpg')`,
    );
    await as(B);
    expect(
      await rejects(
        `insert into storage.objects (bucket_id, name) values ('receipts', '${trip}/no.jpg')`,
      ),
    ).toMatch(/row-level security/);
  });
});

describe("0013 데이터 이전", () => {
  it("기존 일정의 장소 칸을 places 로 옮긴다: 같은 사람 · 같은 구글 장소는 하나로, note 는 그대로", async () => {
    const before = MIGRATIONS.filter((f) => f < "0013");
    const pg = await migratedDb(before);
    await pg.exec(`
      insert into auth.users (id, email) values ('${A}', 'a@x');
      insert into public.trips (id, owner_id, title, start_date, end_date)
        values ('33333333-3333-3333-3333-333333333333', '${A}', 't', '2027-06-01', '2027-06-02');
      insert into public.trip_cities (trip_id, city_id) values ('33333333-3333-3333-3333-333333333333', 'tokyo');
      insert into public.schedule_items
        (trip_id, day_index, position, kind, name, place_id, lat, lng, category, rating, links, status, memo)
      values
        ('33333333-3333-3333-3333-333333333333', 0, 0, 'place', '호텔', 'g-hotel', 35.6, 139.7, 'stay', 4.5, '[{"title":"예약","url":"https://x"}]', 'ok', '체크인 15시'),
        ('33333333-3333-3333-3333-333333333333', 1, 0, 'place', '호텔', 'g-hotel', 35.6, 139.7, 'stay', 4.5, '[]', null, null),
        ('33333333-3333-3333-3333-333333333333', 1, 1, 'place', '직접 적은 곳', null, null, null, null, null, '[]', 'wait', null),
        ('33333333-3333-3333-3333-333333333333', 1, 2, 'note', '메모 한 줄', null, null, null, null, null, '[]', null, null);
    `);
    await applyMigration(pg, "0013_places.sql");

    const items = await pg.query<{
      kind: string;
      name: string | null;
      status: string | null;
      memo: string | null;
      place: string | null;
    }>(
      `select si.kind, si.name, si.status, si.memo, p.name || '/' || p.city_id || '/' || coalesce(p.category, '-') || '/' || p.links::text as place
       from public.schedule_items si left join public.places p on p.id = si.place_id
       order by si.day_index, si.position`,
    );
    expect(items.rows).toEqual([
      {
        kind: "place",
        name: null,
        status: "ok",
        memo: "체크인 15시",
        place: '호텔/tokyo/stay/[{"url": "https://x", "title": "예약"}]',
      },
      {
        kind: "place",
        name: null,
        status: null,
        memo: null,
        place: '호텔/tokyo/stay/[{"url": "https://x", "title": "예약"}]',
      },
      { kind: "place", name: null, status: "wait", memo: null, place: "직접 적은 곳/tokyo/-/[]" },
      { kind: "note", name: "메모 한 줄", status: null, memo: null, place: null },
    ]);
    const places = await pg.query<{ n: number }>(`select count(*)::int n from public.places`);
    expect(places.rows[0].n).toBe(2);
    await pg.close();
  });
});

describe("moves (0011)", () => {
  /** 여행 하나와 그 안의 장소 두 곳을 만든다 */
  async function tripWithTwoPlaces(day: string) {
    const id = await newTrip(day, day);
    return { id, a: await addPlace(id, 0, { name: "A" }), b: await addPlace(id, 0, { name: "B" }) };
  }

  it("이동 일정(kind = move)은 더 만들 수 없다", async () => {
    await as(A);
    const id = await newTrip("2027-04-01", "2027-04-01");
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, name, kind)
         values ('${id}', 0, 0, 'x', 'move')`,
      ),
    ).toMatch(/check constraint/);
  });

  it("두 장소 사이에 하나, 비어 있거나 60자를 넘으면 거부, 장소를 지우면 함께 지워진다", async () => {
    await as(A);
    const { id, a, b } = await tripWithTwoPlaces("2027-04-02");
    await db.query(
      `insert into public.moves (trip_id, from_item_id, to_item_id, mode, detail)
       values ('${id}', '${a}', '${b}', 'subway', '유라쿠초선 직통')`,
    );
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id, mode) values ('${id}', '${a}', '${b}', 'bus')`,
      ),
    ).toMatch(/duplicate key/);
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id) values ('${id}', '${b}', '${a}')`,
      ),
    ).toMatch(/check constraint/);
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id, detail)
         values ('${id}', '${b}', '${a}', '${"가".repeat(61)}')`,
      ),
    ).toMatch(/check constraint/);
    await db.query(`delete from public.schedule_items where id = '${a}'`);
    const left = await db.query<{ n: number }>(
      `select count(*)::int n from public.moves where trip_id = '${id}'`,
    );
    expect(left.rows[0].n).toBe(0);
  });

  it("같은 여행 조건은 FK 가 고정한다: RLS 를 우회해도 다른 여행의 일정은 못 잇고, 이어진 일정은 다른 여행으로 못 옮긴다", async () => {
    await as(A);
    const one = await tripWithTwoPlaces("2027-04-05");
    const two = await tripWithTwoPlaces("2027-04-06");
    await db.query(
      `insert into public.moves (trip_id, from_item_id, to_item_id, mode) values ('${one.id}', '${one.a}', '${one.b}', 'taxi')`,
    );
    // 두 여행 모두 A 의 것이라 RLS 가시성으로는 막히지 않는다. 같은 여행 조건만이 막는다
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id, mode) values ('${one.id}', '${one.a}', '${two.a}', 'walk')`,
      ),
    ).toMatch(/row-level security|foreign key/);
    expect(
      await rejects(
        `update public.moves set to_item_id = '${two.b}' where from_item_id = '${one.a}'`,
      ),
    ).toMatch(/row-level security|foreign key/);
    expect(
      await rejects(`update public.schedule_items set trip_id = '${two.id}' where id = '${one.b}'`),
    ).toMatch(/foreign key/);

    // 정책을 고치다 같은 여행 검사가 빠져도 FK 가 남는지: RLS 를 끈 소유자 권한으로 직접 넣어 본다
    await db.exec("reset role");
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id, mode) values ('${one.id}', '${one.a}', '${two.a}', 'walk')`,
      ),
    ).toMatch(/foreign key/);
  });

  it("남의 여행에는 못 붙이고, 내 여행이어도 남의 일정을 끌어올 수 없다", async () => {
    await as(A);
    const mine = await tripWithTwoPlaces("2027-04-03");
    await as(B);
    const theirs = await tripWithTwoPlaces("2027-04-04");
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id, mode)
         values ('${mine.id}', '${mine.a}', '${mine.b}', 'walk')`,
      ),
    ).toMatch(/row-level security/);
    await as(A);
    expect(
      await rejects(
        `insert into public.moves (trip_id, from_item_id, to_item_id, mode)
         values ('${mine.id}', '${mine.a}', '${theirs.a}', 'walk')`,
      ),
    ).toMatch(/row-level security/);
  });
});

describe("RLS", () => {
  it("도시 기준 데이터는 읽기만, 남의 여행에는 도시를 넣지 못한다", async () => {
    await as(A);
    const id = await newTrip("2027-02-01", "2027-02-02");
    await as(B);
    const read = await db.query<{ n: number }>(`select count(*)::int n from public.cities`);
    // 개수는 supabase/cities.test.ts 가 고정한다. 여기서는 읽힌다는 것만 본다
    expect(read.rows[0].n).toBeGreaterThan(0);
    expect(
      await rejects(
        `insert into public.cities (id, scope, name, position, lat, lng, country_code, currency, timezone)
         values ('x','domestic','x',0,0,0,'KR','KRW','Asia/Seoul')`,
      ),
    ).toMatch(/row-level security/);
    expect(await rejects(`insert into public.trip_cities values ('${id}', 'osaka', 1)`)).toMatch(
      /row-level security/,
    );
  });
});

describe("프로필 사진 (0043)", () => {
  it("가입하면 구글 사진이 지금 사진 · 기본 사진 둘 다에 들어간다", async () => {
    const D = "44444444-4444-4444-4444-444444444444";
    await db.exec(
      `reset role; insert into auth.users (id, email, raw_user_meta_data)
       values ('${D}', 'd@x', '{"full_name":"디","avatar_url":"https://g/p.jpg"}');`,
    );
    const { rows } = await db.query<{ avatar_url: string; default_avatar_url: string }>(
      `select avatar_url, default_avatar_url from public.profiles where id = '${D}'`,
    );
    expect(rows[0]).toEqual({
      avatar_url: "https://g/p.jpg",
      default_avatar_url: "https://g/p.jpg",
    });
  });
});

/** 숙소 저장 (0046 · 0048) — { id, added, removed }. linkItem 은 「숙소로 등록」 한 일정 카드 */
async function saveStay(
  trip: string,
  stay: string | null,
  place: Record<string, unknown>,
  fields: Record<string, unknown>,
  prune = false,
  linkItem: string | null = null,
) {
  const { rows } = await db.query<{ r: { id: string; added: number; removed: number } }>(
    `select public.save_stay($1, $2, $3, $4, $5, $6) r`,
    [trip, stay, JSON.stringify(place), JSON.stringify(fields), prune, linkItem],
  );
  return rows[0].r;
}

/** 그 숙소의 타임라인 연결 카드 — 날짜 · 순서대로 */
async function stayCards(stayId: string) {
  const { rows } = await db.query<{
    id: string;
    day_index: number;
    position: number;
    emoji: string | null;
    status: string | null;
    place_id: string;
  }>(
    `select id, day_index, position, emoji, status, place_id from public.schedule_items
     where stay_id = '${stayId}' and alternative_of is null order by day_index, position`,
  );
  return rows;
}

describe("숙소 (0045 · 0046 · 0048 · 0049 · 0050)", () => {
  const PLACE = {
    name: "호텔 몬토레 긴자",
    lat: 35.671,
    lng: 139.765,
    google_place_id: "g-stay-1",
  };
  const FIELDS = {
    emoji: "🏨",
    status: "ok",
    check_in_date: "2027-11-01",
    check_out_date: "2027-11-03",
    check_in_time: "15:00",
    check_out_time: "11:00",
    memo: "확인번호 ABC",
    links: [{ title: "체크인 가이드", url: "https://x" }],
  };

  /** 5일 여행(10.31 ~ 11.4) */
  async function trip5() {
    await as(A);
    return newTrip("2027-10-31", "2027-11-04");
  }

  it("새 숙소: 장소(stay) · 숙소가 생기고 체크인~체크아웃(양 끝 포함)마다 그날 끝에 연결 카드", async () => {
    const trip = await trip5();
    const before = await addPlace(trip, 1, { name: "먼저 있던 곳", lat: 35.6, lng: 139.7 });
    const r = await saveStay(trip, null, PLACE, FIELDS);
    expect(r.added).toBe(3);
    const cards = await stayCards(r.id);
    expect(cards.map((c) => [c.day_index, c.emoji, c.status])).toEqual([
      [1, "🏨", "ok"],
      [2, "🏨", "ok"],
      [3, "🏨", "ok"],
    ]);
    const { rows: first } = await db.query<{ position: number }>(
      `select position from public.schedule_items where id = '${before}'`,
    );
    expect(cards[0].position).toBe(first[0].position + 1);
    const { rows: p } = await db.query<{ category: string; created_by: string; name: string }>(
      `select p.category, p.created_by, p.name from public.stays s join public.places p on p.id = s.place_id where s.id = '${r.id}'`,
    );
    expect(p[0]).toEqual({ category: "stay", created_by: A, name: "호텔 몬토레 긴자" });
  });

  it("숙박이 여행 밖으로 걸치면 안쪽 날만, 전부 밖이면 0장", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, {
      ...FIELDS,
      check_in_date: "2027-10-29",
      check_out_date: "2027-11-01",
    });
    expect((await stayCards(r.id)).map((c) => c.day_index)).toEqual([0, 1]);
    const r2 = await saveStay(
      trip,
      null,
      { ...PLACE, google_place_id: "g-stay-out" },
      { ...FIELDS, check_in_date: "2027-11-10", check_out_date: "2027-11-12" },
    );
    expect(r2.added).toBe(0);
  });

  it("날짜를 안 바꾸면 지운 카드를 되살리지 않고, 날짜를 바꾸면 빈 날만 채운다", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    const cards = await stayCards(r.id);
    await db.query(`delete from public.schedule_items where id = '${cards[1].id}'`);
    const again = await saveStay(trip, r.id, PLACE, { ...FIELDS, memo: "메모만" });
    expect(again.added).toBe(0);
    expect((await stayCards(r.id)).map((c) => c.day_index)).toEqual([1, 3]);
    const longer = await saveStay(trip, r.id, PLACE, { ...FIELDS, check_out_date: "2027-11-04" });
    expect(longer.added).toBe(2);
    expect((await stayCards(r.id)).map((c) => c.day_index)).toEqual([1, 2, 3, 4]);
  });

  it("기간을 줄일 때 — 남기면 연결 유지, 지우면 (옛 범위 ∖ 새 범위) 카드만. 범위 밖으로 옮겨 둔 카드는 건드리지 않는다", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    const keep = await saveStay(trip, r.id, PLACE, { ...FIELDS, check_out_date: "2027-11-02" });
    expect(keep.removed).toBe(0);
    expect((await stayCards(r.id)).map((c) => c.day_index)).toEqual([1, 2, 3]);
    // 사용자가 범위 밖(day 0)으로 옮겨 둔 카드
    const cards = await stayCards(r.id);
    await db.query(`update public.schedule_items set day_index = 0 where id = '${cards[2].id}'`);
    // 2~3 으로 옮기며 지우기: 옛 1~2 ∖ 새 2~3 = day 1 → 1장 지움, day 3 은 비어 채움. day 0 은 그대로
    const pruned = await saveStay(
      trip,
      r.id,
      PLACE,
      { ...FIELDS, check_in_date: "2027-11-02", check_out_date: "2027-11-03" },
      true,
    );
    expect([pruned.removed, pruned.added]).toEqual([1, 1]);
    expect((await stayCards(r.id)).map((c) => c.day_index)).toEqual([0, 2, 3]);
  });

  it("상태 · 아이콘을 바꾸면(직접 update 포함) 연결 카드에 반영되고, 삭제 시 남긴 카드는 그 모습 그대로 일반 카드", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    await db.query(`update public.stays set status = 'wait', emoji = '🛏️' where id = '${r.id}'`);
    expect((await stayCards(r.id)).map((c) => [c.emoji, c.status])).toEqual([
      ["🛏️", "wait"],
      ["🛏️", "wait"],
      ["🛏️", "wait"],
    ]);
    const ids = (await stayCards(r.id)).map((c) => c.id);
    const { rows } = await db.query<{ n: number }>(`select public.delete_stay('${r.id}', false) n`);
    expect(rows[0].n).toBe(0);
    const { rows: left } = await db.query<{ stay_id: string | null; emoji: string; kind: string }>(
      `select stay_id, emoji, kind from public.schedule_items where id = any($1::uuid[])`,
      [ids],
    );
    expect(left).toHaveLength(3);
    expect(left.every((c) => c.stay_id === null && c.emoji === "🛏️" && c.kind === "place")).toBe(
      true,
    );
  });

  it("삭제하며 카드도 지우면 연결 카드가 사라지고 장소는 남는다", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    const { rows } = await db.query<{ n: number }>(`select public.delete_stay('${r.id}', true) n`);
    expect(rows[0].n).toBe(3);
    expect(await stayCards(r.id)).toEqual([]);
    const { rows: p } = await db.query(
      `select 1 from public.places where google_place_id = 'g-stay-1' and created_by = '${A}'`,
    );
    expect(p).toHaveLength(1);
  });

  it("이름을 바꿀 때: 주인은 장소를 고치고, 일행은 자기 사본으로 바꿔 끼운다(원본 그대로)", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    await saveStay(trip, r.id, { ...PLACE, name: "몬토레 긴자" }, FIELDS);
    const { rows: own } = await db.query<{ name: string; n: number }>(
      `select p.name, (select count(*)::int from public.places where google_place_id = 'g-stay-1') n
       from public.stays s join public.places p on p.id = s.place_id where s.id = '${r.id}'`,
    );
    expect(own[0]).toEqual({ name: "몬토레 긴자", n: 1 });
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(B);
    // 바뀐 것이 없으면 건드리지 않는다
    await saveStay(trip, r.id, { ...PLACE, name: "몬토레 긴자" }, { ...FIELDS, memo: "B 메모" });
    await saveStay(trip, r.id, { ...PLACE, name: "몬토레 긴자 (수정)" }, FIELDS);
    const { rows: copy } = await db.query<{ name: string; created_by: string; card_place: string }>(
      `select p.name, p.created_by, (select place_id from public.schedule_items where stay_id = s.id limit 1) card_place
       from public.stays s join public.places p on p.id = s.place_id where s.id = '${r.id}'`,
    );
    expect(copy[0].name).toBe("몬토레 긴자 (수정)");
    expect(copy[0].created_by).toBe(B);
    await as(A);
    const { rows: orig } = await db.query<{ name: string }>(
      `select name from public.places where google_place_id = 'g-stay-1' and created_by = '${A}'`,
    );
    expect(orig[0].name).toBe("몬토레 긴자");
    const { rows: pid } = await db.query<{ place_id: string }>(
      `select place_id from public.stays where id = '${r.id}'`,
    );
    expect(copy[0].card_place).toBe(pid[0].place_id);
  });

  it("다른 호텔로 옮기면 내 장소를 고치지 않고 새 장소 — 같은 장소를 쓰는 다른 여행은 그대로", async () => {
    const tripA = await trip5();
    const a = await saveStay(tripA, null, { ...PLACE, google_place_id: "g-move-x" }, FIELDS);
    const tripB = await newTrip("2027-12-01", "2027-12-05");
    const b = await saveStay(
      tripB,
      null,
      { ...PLACE, google_place_id: "g-move-x" },
      { ...FIELDS, check_in_date: "2027-12-01", check_out_date: "2027-12-02" },
    );
    const placeOf = async (id: string) =>
      (await db.query<{ place_id: string }>(`select place_id from public.stays where id = '${id}'`))
        .rows[0].place_id;
    // 같은 구글 장소라 두 숙소가 장소 하나를 쓴다
    expect(await placeOf(a.id)).toBe(await placeOf(b.id));
    const shared = await placeOf(a.id);
    await saveStay(
      tripB,
      b.id,
      { name: "호텔 Y", lat: 35.7, lng: 139.8, google_place_id: "g-move-y" },
      { ...FIELDS, check_in_date: "2027-12-01", check_out_date: "2027-12-02" },
    );
    expect(await placeOf(b.id)).not.toBe(shared);
    const { rows } = await db.query<{ name: string; google_place_id: string }>(
      `select name, google_place_id from public.places where id = '${shared}'`,
    );
    expect(rows[0]).toEqual({ name: "호텔 몬토레 긴자", google_place_id: "g-move-x" });
    expect((await stayCards(a.id)).every((c) => c.place_id === shared)).toBe(true);
    // 이름만 고치면 그 장소를 고친다
    await saveStay(tripA, a.id, { ...PLACE, google_place_id: "g-move-x", name: "몬토레" }, FIELDS);
    expect(await placeOf(a.id)).toBe(shared);
  });

  it("거부 + 롤백: 빈 이름 · 0박 · 위치 없음 · 멤버 아님(장소도 남지 않는다)", async () => {
    const trip = await trip5();
    expect(
      await rejects(
        `select public.save_stay('${trip}', null, '{"name":"","lat":1,"lng":1}', '${JSON.stringify(FIELDS)}')`,
      ),
    ).toMatch(/name/);
    expect(
      await rejects(
        `select public.save_stay('${trip}', null, '{"name":"x","lat":1,"lng":1}', '${JSON.stringify({ ...FIELDS, check_out_date: "2027-11-01" })}')`,
      ),
    ).toMatch(/stays_dates_chk/);
    expect(
      await rejects(
        `select public.save_stay('${trip}', null, '{"name":"x"}', '${JSON.stringify(FIELDS)}')`,
      ),
    ).toMatch(/location/);
    await as(B);
    expect(
      await rejects(
        `select public.save_stay('${trip}', null, '${JSON.stringify({ ...PLACE, google_place_id: "g-stay-b" })}', '${JSON.stringify(FIELDS)}')`,
      ),
    ).toMatch(/not a member/);
    const { rows } = await db.query(
      `select 1 from public.places where google_place_id = 'g-stay-b'`,
    );
    expect(rows).toHaveLength(0);
  });

  it("RLS: 멤버만 읽고, 연결 카드가 0장이어도 일행은 숙소 장소를 읽고 담을 수 있다. 남의 보관함 장소로는 못 만든다", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    await db.query(`select public.delete_stay('${r.id}', true)`);
    const r2 = await saveStay(trip, null, PLACE, FIELDS);
    await db.query(`delete from public.schedule_items where stay_id = '${r2.id}'`);
    await as(B);
    expect((await db.query(`select 1 from public.stays where id = '${r2.id}'`)).rows).toHaveLength(
      0,
    );
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(B);
    const { rows: seen } = await db.query<{ name: string }>(
      `select p.name from public.stays s join public.places p on p.id = s.place_id where s.id = '${r2.id}'`,
    );
    expect(seen[0].name).toBe("호텔 몬토레 긴자");
    const { rows: pid } = await db.query<{ place_id: string }>(
      `select place_id from public.stays where id = '${r2.id}'`,
    );
    await db.query(
      `insert into public.schedule_items (trip_id, day_index, position, kind, place_id) values ('${trip}', 0, 99, 'place', '${pid[0].place_id}')`,
    );
    // A 의 보관함에만 있는 장소로 B 가 숙소를 만들 수는 없다
    await as(A);
    const other = await newTrip("2027-12-01", "2027-12-03");
    const mine = await saveStay(
      other,
      null,
      { ...PLACE, google_place_id: "g-stay-private" },
      { ...FIELDS, check_in_date: "2027-12-01", check_out_date: "2027-12-02" },
    );
    const { rows: priv } = await db.query<{ place_id: string }>(
      `select place_id from public.stays where id = '${mine.id}'`,
    );
    await as(B);
    expect(
      await rejects(
        `insert into public.stays (trip_id, place_id, check_in_date, check_out_date) values ('${trip}', '${priv[0].place_id}', '2027-11-01', '2027-11-02')`,
      ),
    ).toMatch(/row-level security/);
  });

  it("복합 FK: 다른 여행 숙소에 카드를 잇지 못하고, note 줄에는 stay_id 를 못 넣는다", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    const other = await newTrip("2027-12-01", "2027-12-03");
    const { rows: pid } = await db.query<{ place_id: string }>(
      `select place_id from public.stays where id = '${r.id}'`,
    );
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, place_id, stay_id) values ('${other}', 0, 0, 'place', '${pid[0].place_id}', '${r.id}')`,
      ),
    ).toMatch(/schedule_items_stay_fkey|row-level security/);
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, name, stay_id) values ('${trip}', 0, 50, 'note', '메모', '${r.id}')`,
      ),
    ).toMatch(/schedule_items_stay_kind_chk/);
  });

  it("멤버가 나가면 숙소와 연결 카드가 소유자 사본을 가리킨다", async () => {
    const trip = await trip5();
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(B);
    const r = await saveStay(trip, null, { ...PLACE, google_place_id: "g-stay-leave" }, FIELDS);
    await db.query(
      `delete from public.trip_members where trip_id = '${trip}' and user_id = '${B}'`,
    );
    await as(A);
    const { rows } = await db.query<{ owner: string; card_owner: string }>(
      `select p.created_by owner,
              (select p2.created_by from public.schedule_items si join public.places p2 on p2.id = si.place_id where si.stay_id = s.id limit 1) card_owner
       from public.stays s join public.places p on p.id = s.place_id where s.id = '${r.id}'`,
    );
    expect(rows[0]).toEqual({ owner: A, card_owner: A });
  });

  it("숙소로 등록: 그 카드가 연결 카드가 되고(장소 · 아이콘 · 상태도 숙소 것으로), 그날에는 카드를 또 만들지 않는다", async () => {
    const trip = await trip5();
    const item = await addPlace(trip, 1, { name: "몬토레", lat: 35.6, lng: 139.7 });
    const r = await saveStay(trip, null, PLACE, FIELDS, false, item);
    expect(r.added).toBe(2);
    const cards = await stayCards(r.id);
    expect(cards.map((c) => [c.day_index, c.id === item])).toEqual([
      [1, true],
      [2, false],
      [3, false],
    ]);
    expect(cards[0]).toMatchObject({ emoji: "🏨", status: "ok", place_id: cards[1].place_id });
  });

  it("숙소로 등록: 이미 연결된 카드 · 다른 여행 카드면 거부하고 숙소도 남기지 않는다", async () => {
    const trip = await trip5();
    const other = await trip5();
    const foreign = await addPlace(other, 1, { name: "남의 여행", lat: 35.6, lng: 139.7 });
    await expect(saveStay(trip, null, PLACE, FIELDS, false, foreign)).rejects.toThrow(
      "item to link not found",
    );
    const linked = (await stayCards((await saveStay(trip, null, PLACE, FIELDS)).id))[0].id;
    await expect(
      saveStay(trip, null, { ...PLACE, google_place_id: "g-stay-2" }, FIELDS, false, linked),
    ).rejects.toThrow("item to link not found");
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int n from public.stays where trip_id = '${trip}'`,
    );
    expect(rows[0].n).toBe(1);
  });

  it("숙소로 등록: 카드 날짜가 묵는 날 밖이면(폼에서 체크인을 바꿈) 거부한다 (0049)", async () => {
    const trip = await trip5();
    const item = await addPlace(trip, 0, { name: "몬토레", lat: 35.6, lng: 139.7 });
    await expect(saveStay(trip, null, PLACE, FIELDS, false, item)).rejects.toThrow(
      "outside the stay dates",
    );
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int n from public.stays where trip_id = '${trip}'`,
    );
    expect(rows[0].n).toBe(0);
  });

  it("일정 추가 「내 숙소」: stay_id 로 담으면 그 숙소의 연결 카드(장소 · 아이콘 · 상태 복사), 다른 여행 숙소는 거부 (0050)", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    const { rows } = await db.query<{ ids: string[] }>(
      `select public.add_schedule_places($1, 1, $2) ids`,
      [trip, JSON.stringify([{ stay_id: r.id }])],
    );
    const cards = await stayCards(r.id);
    const added = cards.find((c) => c.id === rows[0].ids[0]);
    expect(added).toMatchObject({
      day_index: 1,
      emoji: "🏨",
      status: "ok",
      place_id: cards[0].place_id,
    });
    expect(cards.filter((c) => c.day_index === 1)).toHaveLength(2);

    const other = await trip5();
    await expect(
      db.query(`select public.add_schedule_places($1, 0, $2)`, [
        other,
        JSON.stringify([{ stay_id: r.id }]),
      ]),
    ).rejects.toThrow("stay not found");
  });

  it("출발일을 옮기면 숙소 날짜도 같은 만큼 옮겨진다", async () => {
    const trip = await trip5();
    const r = await saveStay(trip, null, PLACE, FIELDS);
    await db.query(`select public.update_trip_dates('${trip}', '2027-11-02', '2027-11-06')`);
    const { rows } = await db.query<{ i: string; o: string }>(
      `select check_in_date::text i, check_out_date::text o from public.stays where id = '${r.id}'`,
    );
    expect(rows[0]).toEqual({ i: "2027-11-03", o: "2027-11-05" });
    expect((await stayCards(r.id)).map((c) => c.day_index)).toEqual([1, 2, 3]);
  });
});

describe("숙소 결제 (0051)", () => {
  const PLACE = { name: "호텔 몬토레 긴자", lat: 35.671, lng: 139.765, google_place_id: "g-pay-1" };
  const FIELDS = { check_in_date: "2027-11-01", check_out_date: "2027-11-03", links: [] };

  /** 3일 여행과 그 숙소 */
  async function setup() {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const stay = (await saveStay(trip, null, PLACE, FIELDS)).id;
    return { trip, stay };
  }

  /** 그 숙소의 비용을 넣는다 — 이름 · 카테고리는 일부러 다르게 */
  async function payFor(trip: string, stay: string) {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, payer_id, amount, currency, name, category, stay_id)
       values ('${trip}', '${A}', 32000, 'JPY', '아무 이름', 'food', '${stay}') returning id`,
    );
    return rows[0].id;
  }

  /** 비용 한 줄의 이름 · 카테고리 · 일정 연결 */
  async function expense(id: string) {
    const { rows } = await db.query<{
      name: string;
      category: string;
      schedule_item_id: string | null;
    }>(`select name, category, schedule_item_id from public.expenses where id = '${id}'`);
    return rows[0];
  }

  it("이름 · 카테고리 · 일정 연결은 숙소가 정한다(넣을 때 · 고칠 때)", async () => {
    const { trip, stay } = await setup();
    const id = await payFor(trip, stay);
    expect(await expense(id)).toEqual({
      name: "호텔 몬토레 긴자",
      category: "lodging",
      schedule_item_id: null,
    });
    const item = await addPlace(trip, 0, { name: "아무 곳", lat: 35.6, lng: 139.7 });
    await db.query(
      `update public.expenses set name = '바꿈', category = 'other', schedule_item_id = '${item}' where id = '${id}'`,
    );
    expect(await expense(id)).toMatchObject({ name: "호텔 몬토레 긴자", category: "lodging" });
  });

  it("숙소 하나에 비용 하나, 다른 여행의 숙소에는 붙지 않는다", async () => {
    const { trip, stay } = await setup();
    const other = await newTrip("2027-10-31", "2027-11-02");
    await expect(payFor(other, stay)).rejects.toThrow("expenses_stay_fkey");
    await payFor(trip, stay);
    await expect(payFor(trip, stay)).rejects.toThrow("expenses_stay_key");
  });

  it("장소 이름을 고치거나 다른 장소로 옮기면 비용 이름이 따라간다", async () => {
    const { trip, stay } = await setup();
    const id = await payFor(trip, stay);
    await saveStay(trip, stay, { ...PLACE, name: "몬토레 긴자" }, FIELDS);
    expect((await expense(id)).name).toBe("몬토레 긴자");
    await saveStay(trip, stay, { ...PLACE, name: "다른 호텔", google_place_id: "g-pay-2" }, FIELDS);
    expect((await expense(id)).name).toBe("다른 호텔");
  });

  it("숙소를 지우면 비용도 지운다(카드를 남겨도)", async () => {
    const { trip, stay } = await setup();
    const id = await payFor(trip, stay);
    await db.query(`select public.delete_stay('${stay}', false)`);
    expect(await expense(id)).toBeUndefined();
  });
});

describe("숙소 카드 비용 → 숙소 결제 (0073)", () => {
  const PLACE = {
    name: "호텔 몬토레 긴자",
    lat: 35.671,
    lng: 139.765,
    google_place_id: "g-card-1",
  };
  const FIELDS = { check_in_date: "2027-11-01", check_out_date: "2027-11-03", links: [] };

  /** 3일 여행 · 숙소 · 그 숙소의 첫 카드 */
  async function setup() {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const stay = (await saveStay(trip, null, PLACE, FIELDS)).id;
    const { rows } = await db.query<{ id: string }>(
      `select id from public.schedule_items where stay_id = '${stay}' order by day_index limit 1`,
    );
    return { trip, stay, card: rows[0].id };
  }

  /** 카드에 연결한 비용을 넣는다(가계부 「일정 연결」) */
  async function linkToCard(trip: string, card: string, category = "lodging") {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, payer_id, amount, currency, name, category, schedule_item_id)
       values ('${trip}', '${A}', 312677, 'KRW', '아무 이름', '${category}', '${card}') returning id`,
    );
    return rows[0].id;
  }

  /** 비용의 숙소 · 일정 연결 · 이름 */
  async function owner(id: string) {
    const { rows } = await db.query<{
      stay_id: string | null;
      schedule_item_id: string | null;
      name: string;
    }>(`select stay_id, schedule_item_id, name from public.expenses where id = '${id}'`);
    return rows[0];
  }

  it("숙소 카드를 고른 숙소 비용은 결제가 없으면 그 숙소의 결제가 된다", async () => {
    const { trip, stay, card } = await setup();
    const id = await linkToCard(trip, card);
    expect(await owner(id)).toEqual({
      stay_id: stay,
      schedule_item_id: null,
      name: "호텔 몬토레 긴자",
    });
  });

  it("결제가 이미 있거나 카테고리가 숙소가 아니면 카드에 연결된 채 둔다", async () => {
    const { trip, card } = await setup();
    await linkToCard(trip, card);
    const second = await linkToCard(trip, card);
    expect(await owner(second)).toMatchObject({ stay_id: null, schedule_item_id: card });
    const food = await linkToCard(trip, card, "food");
    expect(await owner(food)).toMatchObject({ stay_id: null, schedule_item_id: card });
  });

  it("금액만 고치면 그대로, 일정 연결을 다시 고르면 결제가 된다", async () => {
    const { trip, stay, card } = await setup();
    const first = await linkToCard(trip, card);
    const second = await linkToCard(trip, card);
    await db.query(`delete from public.expenses where id = '${first}'`);
    await db.query(`update public.expenses set amount = 1000 where id = '${second}'`);
    expect(await owner(second)).toMatchObject({ stay_id: null, schedule_item_id: card });
    await db.query(
      `update public.expenses set schedule_item_id = '${card}' where id = '${second}'`,
    );
    expect(await owner(second)).toMatchObject({ stay_id: stay, schedule_item_id: null });
  });
});

describe("항공편 (0052)", () => {
  const FIELDS = {
    airline_name: "제주항공",
    airline_code: "7C",
    flight_no: "1181",
    dep_airport: "ICN",
    arr_airport: "NRT",
    dep_date: "2027-10-31",
    dep_time: "07:15",
    arr_date: "",
    arr_time: "09:40",
    status: "ok",
    booking_ref: " ABC123 ",
  };

  /** 항공편 저장(save_flight) */
  async function saveFlight(trip: string, flight: string | null, fields: Record<string, unknown>) {
    const { rows } = await db.query<{ r: { id: string; card: string | null } }>(
      `select public.save_flight($1, $2, $3) r`,
      [trip, flight, JSON.stringify(fields)],
    );
    return rows[0].r;
  }

  /** 그 항공편의 일정 카드 */
  async function flightCards(flightId: string) {
    const { rows } = await db.query<{
      id: string;
      day_index: number;
      position: number;
      name: string;
      description: string;
      start_time: string;
      status: string | null;
    }>(
      `select id, day_index, position, name, description, start_time::text, status from public.schedule_items
       where flight_id = '${flightId}' order by day_index`,
    );
    return rows;
  }

  /** 5일 여행(10.31 ~ 11.4) */
  async function trip5() {
    await as(A);
    return newTrip("2027-10-31", "2027-11-04");
  }

  it("새 항공편: 도착일이 비면 출발일, 탑승일 끝에 카드(제목 · 설명 · 시각 · 상태)", async () => {
    const trip = await trip5();
    await addPlace(trip, 0, { name: "먼저 있던 곳", lat: 35.6, lng: 139.7 });
    const r = await saveFlight(trip, null, FIELDS);
    expect(r.card).toBe("added");
    const { rows } = await db.query<{ arr: string; ref: string }>(
      `select arr_date::text arr, booking_ref ref from public.flights where id = '${r.id}'`,
    );
    expect(rows[0]).toEqual({ arr: "2027-10-31", ref: "ABC123" });
    expect(await flightCards(r.id)).toMatchObject([
      {
        day_index: 0,
        position: 1,
        name: "ICN 07:15 - NRT 09:40",
        description: "제주항공 · 7C1181",
        start_time: "07:15:00",
        status: "ok",
      },
    ]);
  });

  it("고치면 카드 글자가 따라가고, 기간 안에서 날짜를 바꾸면 새 날 끝으로 옮긴다(메모 유지)", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    const [card] = await flightCards(r.id);
    await db.query(
      `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${card.id}', '창가 자리')`,
    );
    const same = await saveFlight(trip, r.id, { ...FIELDS, dep_time: "08:00", status: "" });
    expect(same.card).toBeNull();
    expect((await flightCards(r.id))[0]).toMatchObject({
      name: "ICN 08:00 - NRT 09:40",
      start_time: "08:00:00",
      status: null,
    });
    await addPlace(trip, 2, { name: "그날 장소", lat: 35.6, lng: 139.7 });
    const moved = await saveFlight(trip, r.id, { ...FIELDS, dep_date: "2027-11-02" });
    expect(moved.card).toBe("moved");
    expect(await flightCards(r.id)).toMatchObject([{ id: card.id, day_index: 2, position: 1 }]);
    const memos = await db.query(
      `select 1 from public.memos where schedule_item_id = '${card.id}'`,
    );
    expect(memos.rows).toHaveLength(1);
  });

  it("탑승일이 기간 밖이면 카드가 없고, 밖으로 옮기면 카드(메모 포함)를 지우고, 다시 안으로 오면 만든다", async () => {
    const trip = await trip5();
    const outside = await saveFlight(trip, null, { ...FIELDS, dep_date: "2027-10-30" });
    expect(outside.card).toBeNull();
    expect(await flightCards(outside.id)).toHaveLength(0);

    const r = await saveFlight(trip, null, FIELDS);
    const [card] = await flightCards(r.id);
    await db.query(
      `insert into public.memos (trip_id, schedule_item_id, body) values ('${trip}', '${card.id}', '메모')`,
    );
    expect((await saveFlight(trip, r.id, { ...FIELDS, dep_date: "2027-11-05" })).card).toBe(
      "removed",
    );
    expect(await flightCards(r.id)).toHaveLength(0);
    expect(
      (await db.query(`select 1 from public.memos where schedule_item_id = '${card.id}'`)).rows,
    ).toHaveLength(0);
    expect((await saveFlight(trip, r.id, FIELDS)).card).toBe("added");
  });

  it("항공편을 지우면 카드도 지워진다", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    await db.query(`delete from public.flights where id = '${r.id}'`);
    expect(await flightCards(r.id)).toHaveLength(0);
  });

  it("거부 + 롤백: 코드 모양 · 도착일이 출발일보다 앞섬 · 출발일 없음 · 멤버 아님", async () => {
    const trip = await trip5();
    const bad = [
      { ...FIELDS, airline_code: "7c" },
      { ...FIELDS, flight_no: "12345" },
      { ...FIELDS, dep_airport: "IC" },
      { ...FIELDS, arr_date: "2027-10-30" },
      { ...FIELDS, dep_date: "" },
      { ...FIELDS, airline_name: " " },
    ];
    for (const f of bad) {
      expect(
        await rejects(`select public.save_flight('${trip}', null, '${JSON.stringify(f)}')`),
      ).not.toBeNull();
    }
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int n from public.flights where trip_id = '${trip}'`,
    );
    expect(rows[0].n).toBe(0);
    await as(B);
    expect(
      await rejects(`select public.save_flight('${trip}', null, '${JSON.stringify(FIELDS)}')`),
    ).toMatch(/not a member/);
  });

  it("RLS: 멤버만 읽고 고친다. 남의 여행 항공편은 고칠 수 없다", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    await as(B);
    expect((await db.query(`select 1 from public.flights where id = '${r.id}'`)).rows).toHaveLength(
      0,
    );
    expect(
      await rejects(`select public.save_flight('${trip}', '${r.id}', '${JSON.stringify(FIELDS)}')`),
    ).toMatch(/not a member/);
  });

  it("복합 FK: 다른 여행 항공편에 카드를 잇지 못하고, place 줄에는 flight_id 를 못 넣는다. 항공편 하나에 카드 하나", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    // 카드가 없는(기간 밖) 항공편 — unique 보다 FK 를 먼저 보게
    const lone = await saveFlight(trip, null, { ...FIELDS, dep_date: "2027-10-30" });
    const other = await trip5();
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, name, flight_id)
         values ('${other}', 0, 9, 'flight', 'x', '${lone.id}')`,
      ),
    ).toMatch(/schedule_items_flight_fkey/);
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, name, flight_id)
         values ('${trip}', 1, 9, 'place', 'x', '${lone.id}')`,
      ),
    ).toMatch(/schedule_items_flight_kind_chk/);
    expect(
      await rejects(
        `insert into public.schedule_items (trip_id, day_index, position, kind, name, flight_id)
         values ('${trip}', 1, 9, 'flight', 'x', '${r.id}')`,
      ),
    ).toMatch(/schedule_items_flight_key/);
  });

  it("기간을 늘려 탑승일이 들어오면 카드를 만들고, 줄여서 밖이 되면 카드는 마지막 날로 모인 채 남는다 (0053)", async () => {
    const trip = await trip5();
    const back = await saveFlight(trip, null, { ...FIELDS, dep_date: "2027-11-05" });
    expect(await flightCards(back.id)).toHaveLength(0);
    await addPlace(trip, 4, { name: "마지막 날 장소", lat: 35.6, lng: 139.7 });
    await db.query(`select public.update_trip_dates('${trip}', '2027-10-31', '2027-11-05')`);
    expect(await flightCards(back.id)).toMatchObject([
      { day_index: 5, position: 0, name: "ICN 07:15 - NRT 09:40", status: "ok" },
    ]);
    await db.query(`select public.update_trip_dates('${trip}', '2027-10-31', '2027-11-04')`);
    expect((await flightCards(back.id)).map((c) => c.day_index)).toEqual([4]);
  });

  it("출발일을 옮기면 항공편 날짜도 같은 만큼 옮겨진다", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, { ...FIELDS, arr_date: "2027-11-01" });
    await db.query(`select public.update_trip_dates('${trip}', '2027-11-02', '2027-11-06')`);
    const { rows } = await db.query<{ d: string; a: string }>(
      `select dep_date::text d, arr_date::text a from public.flights where id = '${r.id}'`,
    );
    expect(rows[0]).toEqual({ d: "2027-11-02", a: "2027-11-03" });
    expect((await flightCards(r.id))[0].day_index).toBe(0);
  });

  it("일정 편집 저장: 항공편 카드는 지우지 않고 다른 날로 옮기지 않는다. 같은 날 안의 순서는 바뀐다 (0054)", async () => {
    const trip = await trip5();
    const a = await addPlace(trip, 0, { name: "먼저 있던 곳", lat: 35.6, lng: 139.7 });
    const r = await saveFlight(trip, null, FIELDS);
    const [card] = await flightCards(r.id);
    await db.query(`select public.apply_schedule_edit($1, $2, $3, null)`, [
      trip,
      JSON.stringify({ 0: [card.id, a] }),
      [],
    ]);
    expect(await flightCards(r.id)).toMatchObject([{ day_index: 0, position: 0 }]);
    await db.query(`select public.apply_schedule_edit($1, $2, $3, null)`, [
      trip,
      JSON.stringify({ 0: [a], 1: [card.id] }),
      [card.id],
    ]);
    expect(await flightCards(r.id)).toMatchObject([{ id: card.id, day_index: 0 }]);
  });

  /** 그 항공편의 결제를 넣는다 — 이름 · 카테고리는 일부러 다르게 (0055) */
  async function payForFlight(trip: string, flight: string, extra = "") {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, payer_id, amount, currency, name, category, flight_id${extra ? ", stay_id" : ""})
       values ('${trip}', '${A}', 188000, 'KRW', '아무 이름', 'food', '${flight}'${extra ? `, '${extra}'` : ""}) returning id`,
    );
    return rows[0].id;
  }

  /** 비용 한 줄의 이름 · 카테고리 · 일정 연결 */
  async function expenseRow(id: string) {
    const { rows } = await db.query<{
      name: string;
      category: string;
      schedule_item_id: string | null;
    }>(`select name, category, schedule_item_id from public.expenses where id = '${id}'`);
    return rows[0];
  }

  it("결제: 이름 · 카테고리 · 일정 연결은 항공편이 정하고, 항공사 · 편명을 고치면 이름이 따라간다 (0055)", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    const id = await payForFlight(trip, r.id);
    expect(await expenseRow(id)).toEqual({
      name: "제주항공 7C1181",
      category: "flight",
      schedule_item_id: null,
    });
    const [card] = await flightCards(r.id);
    await db.query(
      `update public.expenses set name = '바꿈', category = 'other', schedule_item_id = '${card.id}' where id = '${id}'`,
    );
    expect(await expenseRow(id)).toEqual({
      name: "제주항공 7C1181",
      category: "flight",
      schedule_item_id: null,
    });
    await saveFlight(trip, r.id, {
      ...FIELDS,
      airline_name: "티웨이항공",
      airline_code: "TW",
      flight_no: "211",
    });
    expect((await expenseRow(id)).name).toBe("티웨이항공 TW211");
  });

  it("결제: 항공편 하나에 하나, 다른 여행 항공편 · 숙소 결제와 겹치기는 거부, 항공편을 지우면 결제도 지운다 (0055)", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    const other = await trip5();
    await expect(payForFlight(other, r.id)).rejects.toThrow("expenses_flight_fkey");
    const stay = (
      await saveStay(
        trip,
        null,
        { name: "호텔", lat: 35.6, lng: 139.7, google_place_id: "g-flight-pay" },
        { check_in_date: "2027-11-01", check_out_date: "2027-11-02", links: [] },
      )
    ).id;
    await expect(payForFlight(trip, r.id, stay)).rejects.toThrow("expenses_one_owner_chk");
    const id = await payForFlight(trip, r.id);
    await expect(payForFlight(trip, r.id)).rejects.toThrow("expenses_flight_key");
    await db.query(`delete from public.flights where id = '${r.id}'`);
    expect(await expenseRow(id)).toBeUndefined();
  });

  it("결제: 지워진 항공편 · 숙소에 넣으면 23503 「… not found」 (0056)", async () => {
    const trip = await trip5();
    const r = await saveFlight(trip, null, FIELDS);
    await db.query(`delete from public.flights where id = '${r.id}'`);
    expect(
      await rejects(`insert into public.expenses (trip_id, payer_id, amount, currency, name, category, flight_id)
       values ('${trip}', '${A}', 1, 'KRW', 'x', 'food', '${r.id}')`),
    ).toMatch(/flight not found/);
    expect(
      await rejects(`insert into public.expenses (trip_id, payer_id, amount, currency, name, category, stay_id)
       values ('${trip}', '${A}', 1, 'KRW', 'x', 'food', gen_random_uuid())`),
    ).toMatch(/stay not found/);
  });
});

describe("항공편 카드에 연결된 비용 → 항공편 결제 (0055)", () => {
  const TRIP = "66666666-6666-6666-6666-666666666666";
  const FLIGHT = "77777777-7777-7777-7777-777777777771";
  const CARD = "88888888-8888-8888-8888-888888888881";

  it("항공편마다 가장 먼저 만든 한 건만 결제가 되고, 나머지는 카드에 연결된 채 남는다", async () => {
    const pg = await migratedDb(MIGRATIONS.filter((f) => f < "0055"));
    await pg.exec(`
      insert into auth.users (id, email) values ('${A}', 'a@x');
      insert into public.trips (id, owner_id, title, start_date, end_date)
        values ('${TRIP}', '${A}', 't', '2027-10-31', '2027-11-04');
      insert into public.flights (id, trip_id, airline_name, airline_code, flight_no, dep_airport, arr_airport, dep_date, dep_time, arr_date, arr_time)
        values ('${FLIGHT}', '${TRIP}', '제주항공', '7C', '1181', 'ICN', 'NRT', '2027-10-31', '07:15', '2027-10-31', '09:40');
      insert into public.schedule_items (id, trip_id, day_index, position, kind, flight_id, name)
        values ('${CARD}', '${TRIP}', 0, 0, 'flight', '${FLIGHT}', 'ICN 07:15 - NRT 09:40');
      insert into public.expenses (id, trip_id, payer_id, amount, currency, name, category, schedule_item_id, created_at) values
        ('99999999-9999-9999-9999-999999999992', '${TRIP}', '${A}', 2, 'KRW', '나중', 'other', '${CARD}', '2027-01-02'),
        ('99999999-9999-9999-9999-999999999991', '${TRIP}', '${A}', 1, 'KRW', '항공권', 'flight', '${CARD}', '2027-01-01');
    `);
    await applyMigration(pg, "0055_flight_expense.sql");
    const { rows } = await pg.query(
      `select id, name, category, flight_id, schedule_item_id from public.expenses order by id`,
    );
    expect(rows).toEqual([
      {
        id: "99999999-9999-9999-9999-999999999991",
        name: "제주항공 7C1181",
        category: "flight",
        flight_id: FLIGHT,
        schedule_item_id: null,
      },
      {
        id: "99999999-9999-9999-9999-999999999992",
        name: "나중",
        category: "other",
        flight_id: null,
        schedule_item_id: CARD,
      },
    ]);
  });
});

describe("옛 flight 줄 → 항공편 (0054)", () => {
  const TRIP = "44444444-4444-4444-4444-444444444444";

  it("「AAA HH:MM - BBB HH:MM」 + 「항공사 · 편명」 이면 항공편을 만들어 잇고(자리 · 메모 · 상태 그대로), 아니면 옛 줄로 둔다", async () => {
    const pg = await migratedDb(MIGRATIONS.filter((f) => f < "0054"));
    await pg.exec(`
      insert into auth.users (id, email) values ('${A}', 'a@x');
      insert into public.trips (id, owner_id, title, start_date, end_date)
        values ('${TRIP}', '${A}', 't', '2027-10-31', '2027-11-04');
      insert into public.schedule_items (id, trip_id, day_index, position, kind, name, description, start_time, status, created_by) values
        ('55555555-5555-5555-5555-555555555551', '${TRIP}', 0, 1, 'flight', 'ICN 07:15 - NRT 09:40', '제주항공 · 7C1181', '07:00', 'wait', '${A}'),
        ('55555555-5555-5555-5555-555555555552', '${TRIP}', 4, 3, 'flight', 'NRT 23:30 - ICN 02:10', '에어프레미아 · YP732', null, null, '${A}'),
        ('55555555-5555-5555-5555-555555555553', '${TRIP}', 2, 0, 'flight', '인천 → 나리타', '제주항공 · 7C1181', null, null, '${A}'),
        ('55555555-5555-5555-5555-555555555554', '${TRIP}', 2, 1, 'flight', 'ICN 25:00 - NRT 09:40', '제주항공 · 7C1181', null, null, '${A}');
      insert into public.memos (trip_id, schedule_item_id, body)
        values ('${TRIP}', '55555555-5555-5555-5555-555555555551', '창가 자리');
    `);
    await applyMigration(pg, "0054_flight_cards_schedule.sql");
    const flights = await pg.query(
      `select f.airline_name, f.airline_code, f.flight_no, f.dep_airport, f.arr_airport, f.dep_date::text dep_date,
              f.dep_time::text dep_time, f.arr_date::text arr_date, f.status, s.id item, s.position, s.start_time::text start_time
       from public.flights f join public.schedule_items s on s.flight_id = f.id order by f.dep_date`,
    );
    expect(flights.rows).toEqual([
      {
        airline_name: "제주항공",
        airline_code: "7C",
        flight_no: "1181",
        dep_airport: "ICN",
        arr_airport: "NRT",
        dep_date: "2027-10-31",
        dep_time: "07:15:00",
        arr_date: "2027-10-31",
        status: "wait",
        item: "55555555-5555-5555-5555-555555555551",
        position: 1,
        start_time: "07:15:00",
      },
      {
        airline_name: "에어프레미아",
        airline_code: "YP",
        flight_no: "732",
        dep_airport: "NRT",
        arr_airport: "ICN",
        dep_date: "2027-11-04",
        dep_time: "23:30:00",
        arr_date: "2027-11-05",
        status: null,
        item: "55555555-5555-5555-5555-555555555552",
        position: 3,
        start_time: "23:30:00",
      },
    ]);
    const legacy = await pg.query(
      `select id from public.schedule_items where flight_id is null order by id`,
    );
    expect(legacy.rows).toEqual([
      { id: "55555555-5555-5555-5555-555555555553" },
      { id: "55555555-5555-5555-5555-555555555554" },
    ]);
    const memos = await pg.query(`select body from public.memos`);
    expect(memos.rows).toEqual([{ body: "창가 자리" }]);
  });
});

describe("체크리스트 (0057)", () => {
  /** 항목을 넣고 id 를 돌려준다 */
  async function addItem(trip: string, fields: Record<string, unknown> = {}) {
    const cols = { title: "입국 QR 만들기", ...fields };
    const { rows } = await db.query<{ id: string }>(
      `insert into public.checklist_items (trip_id, ${Object.keys(cols).join(", ")})
       values ($1, ${Object.keys(cols)
         .map((_, i) => `$${i + 2}`)
         .join(", ")}) returning id`,
      [trip, ...Object.values(cols)],
    );
    return rows[0].id;
  }

  it("기본값 — 해야 할 것 · 마감 없음 · 빈 메모 · 링크 없음 · 만든 사람", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const id = await addItem(trip);
    const { rows } = await db.query(
      `select status, due_date, body, links, pinned_by, created_by from public.checklist_items where id = '${id}'`,
    );
    expect(rows[0]).toEqual({
      status: "todo",
      due_date: null,
      body: "",
      links: [],
      pinned_by: null,
      created_by: A,
    });
  });

  it("거부: 빈 제목 · 100자 넘는 제목 · 모르는 상태 · 링크가 배열이 아님", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    for (const bad of [
      { title: "  " },
      { title: "가".repeat(101) },
      { status: "later" },
      { links: JSON.stringify({ url: "x" }) },
    ]) {
      await expect(addItem(trip, bad)).rejects.toThrow();
    }
  });

  it("RLS: 멤버만 읽고 고친다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const id = await addItem(trip);
    await as(B);
    expect(
      (await db.query(`select 1 from public.checklist_items where id = '${id}'`)).rows,
    ).toHaveLength(0);
    await expect(addItem(trip)).rejects.toThrow(/row-level security/);
  });
});

describe("체크리스트 연결 (0058)", () => {
  /** 여행 하나에 장소 일정 · 항공편 · 숙소를 하나씩 */
  async function setup() {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const card = await addPlace(trip, 0, { name: "모구모구 본포", lat: 35.66, lng: 139.7 });
    const { rows: f } = await db.query<{ id: string }>(
      `insert into public.flights (trip_id, airline_name, airline_code, flight_no, dep_airport, arr_airport, dep_date, dep_time, arr_date, arr_time)
       values ('${trip}', '제주항공', '7C', '1181', 'ICN', 'NRT', '2027-10-31', '07:15', '2027-10-31', '09:40') returning id`,
    );
    const { rows: s } = await db.query<{ id: string }>(
      `insert into public.stays (trip_id, place_id, check_in_date, check_out_date)
       select '${trip}', place_id, '2027-10-31', '2027-11-01' from public.schedule_items where id = '${card}' returning id`,
    );
    return { trip, card, flight: f[0].id, stay: s[0].id };
  }

  /** 항목 저장(save_checklist_item) — 항목 id */
  async function save(
    trip: string,
    id: string | null,
    fields: Record<string, unknown>,
    add: Record<string, string>[] = [],
    remove: Record<string, string>[] = [],
  ) {
    const { rows } = await db.query<{ id: string }>(
      `select public.save_checklist_item($1, $2, $3, $4, $5) id`,
      [trip, id, JSON.stringify(fields), JSON.stringify(add), JSON.stringify(remove)],
    );
    return rows[0].id;
  }

  /** 그 항목의 연결 — 「s:…」 · 「f:…」 · 「h:…」 정렬 */
  async function targets(item: string) {
    const { rows } = await db.query<{ t: string }>(
      `select coalesce('s:' || schedule_item_id, 'f:' || flight_id, 'h:' || stay_id) t
       from public.checklist_targets where item_id = '${item}' order by 1`,
    );
    return rows.map((r) => r.t);
  }

  it("새 항목을 연결과 함께 넣고, 편집은 받은 칸 · 더하고 뺀 연결만 바꾼다", async () => {
    const { trip, card, flight, stay } = await setup();
    const id = await save(trip, null, { title: "입장 방식 확인", status: "etc" }, [
      { schedule_item_id: card },
      { flight_id: flight },
    ]);
    expect(await targets(id)).toEqual([`f:${flight}`, `s:${card}`].sort());

    // 이미 있는 연결을 또 더하면 건너뛴다. 뺀 것만 빠진다
    await save(
      trip,
      id,
      { title: "입장 방식 확인하기" },
      [{ stay_id: stay }, { flight_id: flight }],
      [{ schedule_item_id: card }],
    );
    expect(await targets(id)).toEqual([`f:${flight}`, `h:${stay}`].sort());
    const { rows } = await db.query(
      `select status, title, body from public.checklist_items where id = '${id}'`,
    );
    expect(rows[0]).toEqual({ status: "etc", title: "입장 방식 확인하기", body: "" });
  });

  it("그사이 지워진 대상 · 다른 여행의 대상은 건너뛰고 나머지는 저장한다", async () => {
    const { trip, card, flight } = await setup();
    const other = await setup();
    await db.query(`delete from public.schedule_items where id = '${card}'`);
    const id = await save(trip, null, { title: "x" }, [
      { schedule_item_id: card },
      { schedule_item_id: other.card },
      { flight_id: flight },
    ]);
    expect(await targets(id)).toEqual([`f:${flight}`]);
  });

  it("대상(일정 카드 · 항공편 · 숙소)이나 항목을 지우면 연결만 지운다", async () => {
    const { trip, card, flight, stay } = await setup();
    const id = await save(trip, null, { title: "x" }, [
      { schedule_item_id: card },
      { flight_id: flight },
      { stay_id: stay },
    ]);
    await db.query(`delete from public.schedule_items where id = '${card}'`);
    expect(await targets(id)).toEqual([`f:${flight}`, `h:${stay}`].sort());
    await db.query(`delete from public.stays where id = '${stay}'`);
    expect(await targets(id)).toEqual([`f:${flight}`]);
    await db.query(`delete from public.flights where id = '${flight}'`);
    expect(await targets(id)).toEqual([]);
    expect(
      (await db.query(`select 1 from public.checklist_items where id = '${id}'`)).rows,
    ).toHaveLength(1);

    // 항목을 지우면 연결만 — 대상은 남는다
    const more = await setup();
    const again = await save(more.trip, null, { title: "z" }, [{ flight_id: more.flight }]);
    await db.query(`delete from public.checklist_items where id = '${again}'`);
    expect(
      (await db.query(`select 1 from public.checklist_targets where flight_id = '${more.flight}'`))
        .rows,
    ).toHaveLength(0);
    expect(
      (await db.query(`select 1 from public.flights where id = '${more.flight}'`)).rows,
    ).toHaveLength(1);
  });

  it("거부: 대상이 둘 · 없음, 다른 여행의 대상을 직접 넣기, 고칠 항목이 없음", async () => {
    const { trip, card, flight } = await setup();
    const other = await setup();
    const id = await save(trip, null, { title: "x" });
    expect(
      await rejects(
        `select public.save_checklist_item('${trip}', '${id}', '{}', '${JSON.stringify([{ schedule_item_id: card, flight_id: flight }])}')`,
      ),
    ).toMatch(/checklist_targets_one_chk/);
    expect(
      await rejects(`select public.save_checklist_item('${trip}', '${id}', '{}', '[{}]')`),
    ).toMatch(/checklist_targets_one_chk/);
    expect(
      await rejects(
        `insert into public.checklist_targets (trip_id, item_id, schedule_item_id) values ('${trip}', '${id}', '${other.card}')`,
      ),
    ).toMatch(/checklist_targets_schedule_fkey/);
    expect(
      await rejects(`select public.save_checklist_item('${other.trip}', '${id}', '{"title":"y"}')`),
    ).toMatch(/checklist item not found/);
  });

  it("RLS: 멤버만 읽고 고친다", async () => {
    const { trip, card } = await setup();
    const id = await save(trip, null, { title: "x" }, [{ schedule_item_id: card }]);
    await as(B);
    expect((await db.query(`select 1 from public.checklist_targets`)).rows).toHaveLength(0);
    expect(
      await rejects(`select public.save_checklist_item('${trip}', '${id}', '{"title":"y"}')`),
    ).toMatch(/checklist item not found/);
    expect(
      await rejects(`select public.save_checklist_item('${trip}', null, '{"title":"y"}')`),
    ).toMatch(/row-level security/);
  });
});

describe("바우처 (0059)", () => {
  /** 여행 하나에 장소 일정 · 항공편 · 숙소를 하나씩 */
  async function setup() {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const card = await addPlace(trip, 0, { name: "치이카와 파크", lat: 35.73, lng: 139.72 });
    const { rows: f } = await db.query<{ id: string }>(
      `insert into public.flights (trip_id, airline_name, airline_code, flight_no, dep_airport, arr_airport, dep_date, dep_time, arr_date, arr_time)
       values ('${trip}', '제주항공', '7C', '1181', 'ICN', 'NRT', '2027-10-31', '07:15', '2027-10-31', '09:40') returning id`,
    );
    const { rows: s } = await db.query<{ id: string }>(
      `insert into public.stays (trip_id, place_id, check_in_date, check_out_date)
       select '${trip}', place_id, '2027-10-31', '2027-11-01' from public.schedule_items where id = '${card}' returning id`,
    );
    return { trip, card, flight: f[0].id, stay: s[0].id };
  }

  /** 바우처 한 줄을 넣는다 — id */
  async function add(trip: string, cols: Record<string, unknown> = {}) {
    const keys = Object.keys(cols);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.vouchers (trip_id, title${keys.map((k) => `, ${k}`).join("")})
       values ($1, '입장권'${keys.map((_, i) => `, $${i + 2}`).join("")}) returning id`,
      [trip, ...keys.map((k) => cols[k])],
    );
    return rows[0].id;
  }

  it("원본 · 그림 · 번호 · 주인과 함께 넣는다. 파일 없이 번호만 있어도 된다", async () => {
    const { trip, flight } = await setup();
    const id = await add(trip, {
      file_key: `${trip}/a.pdf`,
      file_name: "e-ticket.pdf",
      file_mime: "application/pdf",
      file_size: 20971520,
      pages: "1, 3",
      page_keys: [`${trip}/a-1.png`, `${trip}/a-3.png`],
      thumb_key: `${trip}/a-t.jpg`,
      owners: [A],
      numbers: JSON.stringify([{ label: "예약번호", owner: "", value: "K7QX2M" }]),
      flight_id: flight,
    });
    const { rows } = await db.query<{ pages: string; page_keys: string[] }>(
      `select pages, page_keys from public.vouchers where id = '${id}'`,
    );
    expect(rows[0]).toEqual({ pages: "1, 3", page_keys: [`${trip}/a-1.png`, `${trip}/a-3.png`] });
    await add(trip, { numbers: JSON.stringify([{ label: "바우처 번호", owner: A, value: "1" }]) });
  });

  it("대상(일정 카드 · 항공편 · 숙소)을 지우면 연결 칸만 비우고 바우처는 남는다", async () => {
    const { trip, card, flight, stay } = await setup();
    const ids = [
      await add(trip, { schedule_item_id: card }),
      await add(trip, { flight_id: flight }),
      await add(trip, { stay_id: stay }),
    ];
    await db.query(`delete from public.stays where id = '${stay}'`);
    await db.query(`delete from public.flights where id = '${flight}'`);
    await db.query(`delete from public.schedule_items where id = '${card}'`);
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int n from public.vouchers
       where id = any($1) and trip_id = '${trip}' and num_nonnulls(schedule_item_id, flight_id, stay_id) = 0`,
      [ids],
    );
    expect(rows[0].n).toBe(3);
  });

  it("거부: 대상 둘 · 연결과 사용일 함께 · 다른 여행 대상 · 여행 폴더 밖 키 · 원본 칸 일부만 · 20MB 넘음", async () => {
    const { trip, card, flight } = await setup();
    const other = await setup();
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, schedule_item_id, flight_id)
      values ('${trip}', 'x', '${card}', '${flight}')`),
    ).toMatch(/vouchers_target_chk/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, flight_id, use_date)
      values ('${trip}', 'x', '${flight}', '2027-10-31')`),
    ).toMatch(/vouchers_use_date_chk/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, schedule_item_id)
      values ('${trip}', 'x', '${other.card}')`),
    ).toMatch(/vouchers_schedule_fkey/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, page_keys)
      values ('${trip}', 'x', array['${other.trip}/p.png'])`),
    ).toMatch(/vouchers_keys_chk/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, thumb_key)
      values ('${trip}', 'x', '${trip}/../p.png')`),
    ).toMatch(/vouchers_keys_chk/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, file_key)
      values ('${trip}', 'x', '${trip}/a.pdf')`),
    ).toMatch(/vouchers_file_chk/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, file_key, file_name, file_mime, file_size)
      values ('${trip}', 'x', '${trip}/a.pdf', 'a.pdf', 'application/pdf', 20971521)`),
    ).toMatch(/file_size/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title) values ('${trip}', '  ')`),
    ).toMatch(/title/);
  });

  it("RLS · 버킷: 멤버만 읽고 고치고, 경로 첫 칸 여행의 멤버만 파일을 올린다", async () => {
    const { trip } = await setup();
    await add(trip);
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('vouchers', '${trip}/ok.pdf')`,
    );
    await as(B);
    expect((await db.query(`select 1 from public.vouchers`)).rows).toHaveLength(0);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title) values ('${trip}', 'x')`),
    ).toMatch(/row-level security/);
    expect(
      await rejects(
        `insert into storage.objects (bucket_id, name) values ('vouchers', '${trip}/no.pdf')`,
      ),
    ).toMatch(/row-level security/);
  });

  it("거부: 다른 여행의 항공편 · 숙소, 키가 있는 줄을 다른 여행으로 옮기기, 남의 바우처 · 파일 고치기 · 지우기", async () => {
    const { trip } = await setup();
    const other = await setup();
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, flight_id)
      values ('${trip}', 'x', '${other.flight}')`),
    ).toMatch(/vouchers_flight_fkey/);
    expect(
      await rejects(`insert into public.vouchers (trip_id, title, stay_id)
      values ('${trip}', 'x', '${other.stay}')`),
    ).toMatch(/vouchers_stay_fkey/);
    // 두 여행 모두 멤버여도 파일 키는 원래 여행 폴더라 옮길 수 없다
    const keyed = await add(trip, { thumb_key: `${trip}/t.jpg` });
    expect(
      await rejects(`update public.vouchers set trip_id = '${other.trip}' where id = '${keyed}'`),
    ).toMatch(/vouchers_keys_chk/);
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('vouchers', '${trip}/t.jpg')`,
    );
    await as(B);
    // RLS 는 오류 없이 0줄 — 줄 · 파일이 그대로인지로 확인한다
    await db.query(`update public.vouchers set title = 'B' where id = '${keyed}'`);
    await db.query(`delete from public.vouchers where id = '${keyed}'`);
    expect(
      (await db.query(`select 1 from storage.objects where bucket_id = 'vouchers'`)).rows,
    ).toHaveLength(0);
    await db.query(`delete from storage.objects where bucket_id = 'vouchers'`);
    await as(A);
    expect(
      (await db.query<{ title: string }>(`select title from public.vouchers where id = '${keyed}'`))
        .rows,
    ).toEqual([{ title: "입장권" }]);
    expect(
      (await db.query(`select 1 from storage.objects where name = '${trip}/t.jpg'`)).rows,
    ).toHaveLength(1);
  });
});

describe("준비물 (0060)", () => {
  /** 그룹을 넣고 id 를 돌려준다 */
  async function addGroup(trip: string, name = "📄 서류 · 결제", kind = "pack") {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.pack_groups (trip_id, kind, name) values ($1, $2, $3) returning id`,
      [trip, kind, name],
    );
    return rows[0].id;
  }

  /** 항목을 넣고 id 를 돌려준다 */
  async function addPackItem(trip: string, group: string, fields: Record<string, unknown> = {}) {
    const cols = { name: "여권", ...fields };
    const { rows } = await db.query<{ id: string }>(
      `insert into public.pack_items (trip_id, group_id, ${Object.keys(cols).join(", ")})
       values ($1, $2, ${Object.keys(cols)
         .map((_, i) => `$${i + 3}`)
         .join(", ")}) returning id`,
      [trip, group, ...Object.values(cols)],
    );
    return rows[0].id;
  }

  it("기본값 — 안 챙김 · 빈 메모, 그룹을 지우면 항목도 지워진다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const group = await addGroup(trip);
    const id = await addPackItem(trip, group);
    const { rows } = await db.query(
      `select memo, checked_at, checked_by, created_by from public.pack_items where id = '${id}'`,
    );
    expect(rows[0]).toEqual({ memo: "", checked_at: null, checked_by: null, created_by: A });
    await db.query(`delete from public.pack_groups where id = '${group}'`);
    expect(
      (await db.query(`select 1 from public.pack_items where id = '${id}'`)).rows,
    ).toHaveLength(0);
  });

  it("거부: 빈 이름 · 모르는 종류 · 다른 여행의 그룹 · 챙기지 않았는데 체크한 사람", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const other = await newTrip("2027-12-01", "2027-12-02");
    const group = await addGroup(trip);
    const otherGroup = await addGroup(other);
    await expect(addGroup(trip, "  ")).rejects.toThrow();
    await expect(addGroup(trip, "옷", "gift")).rejects.toThrow();
    await expect(addPackItem(trip, group, { name: " " })).rejects.toThrow();
    await expect(addPackItem(trip, otherGroup)).rejects.toThrow();
    await expect(addPackItem(trip, group, { checked_by: A })).rejects.toThrow();
    await expect(
      addPackItem(trip, group, { checked_by: A, checked_at: "2027-10-30T00:00:00Z" }),
    ).resolves.toBeTruthy();
  });

  it("기본 목록 — 빈 목록에만 그룹 · 항목을 순서대로, 하나라도 틀리면 아무것도 남지 않는다 (0061)", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    /** 기본 목록 넣기 */
    const addPresets = (groups: unknown[], kind = "pack") =>
      db.query(`select public.add_pack_groups($1, $2, $3::jsonb)`, [
        trip,
        kind,
        JSON.stringify(groups),
      ]);
    /** 그 종류의 그룹 이름 · 자리 · 항목 */
    const groupsOf = async (kind = "pack") =>
      (
        await db.query<{ name: string; position: number; items: string[] }>(
          `select g.name, g.position,
                  coalesce(array_agg(i.name order by i.position) filter (where i.id is not null), '{}') as items
             from public.pack_groups g left join public.pack_items i on i.group_id = g.id
            where g.trip_id = '${trip}' and g.kind = '${kind}' group by g.id order by g.position`,
        )
      ).rows;
    await expect(
      addPresets([
        { name: "🔌 전자기기", items: ["충전기"] },
        { name: " ", items: [] },
      ]),
    ).rejects.toThrow();
    expect(await groupsOf()).toEqual([]);
    const presets = [
      { name: "📄 서류 · 결제", items: ["여권", "현금"] },
      { name: "👕 옷", items: [] },
    ];
    await addPresets(presets);
    const filled = [
      { name: "📄 서류 · 결제", position: 0, items: ["여권", "현금"] },
      { name: "👕 옷", position: 1, items: [] },
    ];
    expect(await groupsOf()).toEqual(filled);
    // 두 번 눌러도(일행 · 다른 기기) 한 벌만 — 그룹이 있으면 아무것도 하지 않는다. 다른 종류는 따로 센다
    await addPresets(presets);
    expect(await groupsOf()).toEqual(filled);
    await addPresets([{ name: "🍫 간식", items: [] }], "shop");
    expect(await groupsOf("shop")).toEqual([{ name: "🍫 간식", position: 0, items: [] }]);
  });

  it("RLS: 멤버만 읽고 고친다 — 남의 여행에 기본 목록도 넣지 못한다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const group = await addGroup(trip);
    await as(B);
    expect(
      (await db.query(`select 1 from public.pack_groups where id = '${group}'`)).rows,
    ).toHaveLength(0);
    await expect(addGroup(trip)).rejects.toThrow(/row-level security/);
    await expect(
      db.query(`select public.add_pack_groups($1, 'pack', $2::jsonb)`, [
        trip,
        JSON.stringify([{ name: "옷", items: [] }]),
      ]),
    ).rejects.toThrow(/row-level security/);
  });

  it("쇼핑 사진 (0062) — 사진 · 썸네일은 함께, 그 여행 폴더 안, 줄마다 겹치지 않는다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    const other = await newTrip("2027-12-01", "2027-12-02");
    const group = await addGroup(trip, "🛍️ 우리용", "shop");
    const photo = { photo_key: `${trip}/p.jpg`, thumb_key: `${trip}/t.jpg` };
    const id = await addPackItem(trip, group, photo);
    await expect(addPackItem(trip, group, { photo_key: `${trip}/p2.jpg` })).rejects.toThrow(
      /pack_items_photo_chk/,
    );
    await expect(
      addPackItem(trip, group, { photo_key: `${other}/p.jpg`, thumb_key: `${other}/t.jpg` }),
    ).rejects.toThrow(/pack_items_photo_keys_chk/);
    await expect(
      addPackItem(trip, group, { photo_key: `${trip}/../p.jpg`, thumb_key: `${trip}/t2.jpg` }),
    ).rejects.toThrow(/pack_items_photo_keys_chk/);
    await expect(addPackItem(trip, group, photo)).rejects.toThrow(/unique/);
    // 사진을 지우면 두 칸을 함께 비운다
    await db.query(
      `update public.pack_items set photo_key = null, thumb_key = null where id = '${id}'`,
    );
    await expect(addPackItem(trip, group, photo)).resolves.toBeTruthy();
  });

  it("쇼핑 사진 버킷 (0062) — 경로 첫 칸 여행의 멤버만 올리고 · 보고 · 지운다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-02");
    await db.query(
      `insert into storage.objects (bucket_id, name) values ('pack-photos', '${trip}/ok.jpg')`,
    );
    await as(B);
    // 읽기 정책 — 남은 이 여행 사진을 찾지 못해 서명 주소도 만들 수 없다
    expect(
      (await db.query(`select 1 from storage.objects where bucket_id = 'pack-photos'`)).rows,
    ).toHaveLength(0);
    await expect(
      db.query(
        `insert into storage.objects (bucket_id, name) values ('pack-photos', '${trip}/no.jpg')`,
      ),
    ).rejects.toThrow(/row-level security/);
    // RLS 는 오류 없이 0줄 — 파일이 그대로인지로 확인한다
    await db.query(`delete from storage.objects where bucket_id = 'pack-photos'`);
    await as(A);
    expect(
      (await db.query(`select 1 from storage.objects where name = '${trip}/ok.jpg'`)).rows,
    ).toHaveLength(1);
  });
});

describe("메모 홈에 고정 (0064)", () => {
  it("장소 메모 · 날짜 메모에 고정한 사람을 적고 일행 누구나 푼다. 날짜 메모가 아닌 일정은 고정하지 못한다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-07", "2027-10-07");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const place = await addPlace(trip, 0, { name: "이치란", lat: 35.66, lng: 139.7 });
    const memo = await db.query<{ id: string; pinned_by: string | null }>(
      `insert into public.memos (trip_id, schedule_item_id, body, pinned_by)
       values ('${trip}', '${place}', '카운터석', '${A}') returning id, pinned_by`,
    );
    expect(memo.rows[0].pinned_by).toBe(A);
    const note = await db.query<{ id: string }>(
      `insert into public.schedule_items (trip_id, day_index, position, kind, name, pinned_by)
       values ('${trip}', 0, 1, 'note', '공항 집합', '${A}') returning id`,
    );
    await as(B);
    await db.query(`update public.memos set pinned_by = null where id = '${memo.rows[0].id}'`);
    await db.query(
      `update public.schedule_items set pinned_by = null where id = '${note.rows[0].id}'`,
    );
    const after = await db.query(
      `select (select pinned_by from public.memos where id = '${memo.rows[0].id}') m,
              (select pinned_by from public.schedule_items where id = '${note.rows[0].id}') n`,
    );
    expect(after.rows[0]).toEqual({ m: null, n: null });
    expect(
      await rejects(`update public.schedule_items set pinned_by = '${B}' where id = '${place}'`),
    ).toMatch(/check constraint/);
  });
});

describe("여행 도시 바꾸기 (0065)", () => {
  /** 그 여행의 도시를 순서대로 */
  async function cities(trip: string) {
    const { rows } = await db.query<{ city_id: string }>(
      `select city_id from public.trip_cities where trip_id = '${trip}' order by position`,
    );
    return rows.map((r) => r.city_id);
  }

  it("고른 순서대로 통째로 바꾸고, 뺀 도시의 일정 · 장소는 그대로 둔다", async () => {
    await as(A);
    const trip = await newTrip("2028-04-01", "2028-04-02");
    const item = await addPlace(trip, 0, { name: "도쿄 타워", lat: 35.6586, lng: 139.7454 });
    await db.query(`select public.set_trip_cities('${trip}', array['osaka', 'fukuoka'])`);
    expect(await cities(trip)).toEqual(["osaka", "fukuoka"]);
    const kept = await db.query(`select 1 from public.schedule_items where id = '${item}'`);
    expect(kept.rows).toHaveLength(1);
    await db.query(`select public.set_trip_cities('${trip}', array['fukuoka', 'tokyo'])`);
    expect(await cities(trip)).toEqual(["fukuoka", "tokyo"]);
  });

  it("빈 목록 · 겹친 도시 · 없는 도시 · 멤버가 아닌 사람은 거부하고 그대로 둔다", async () => {
    await as(A);
    const trip = await newTrip("2028-04-03", "2028-04-03");
    expect(await rejects(`select public.set_trip_cities('${trip}', array[]::text[])`)).toMatch(
      /at least one city/,
    );
    expect(
      await rejects(`select public.set_trip_cities('${trip}', array['osaka', 'osaka'])`),
    ).toMatch(/duplicate city/);
    expect(await rejects(`select public.set_trip_cities('${trip}', array['nowhere'])`)).toMatch(
      /foreign key/,
    );
    expect(await cities(trip)).toEqual(["tokyo"]);
    await as(B);
    expect(await rejects(`select public.set_trip_cities('${trip}', array['osaka'])`)).toMatch(
      /not a member/,
    );
    await as(A);
    expect(await cities(trip)).toEqual(["tokyo"]);
  });
});

describe("교통비 (0072)", () => {
  /** 교통비 줄을 넣고 id 를 돌려준다 */
  async function addFare(trip: string, fields: Record<string, unknown>) {
    const cols = { currency: "JPY", ...fields };
    const { rows } = await db.query<{ id: string }>(
      `insert into public.transport_fares (trip_id, ${Object.keys(cols).join(", ")})
       values ($1, ${Object.keys(cols)
         .map((_, i) => `$${i + 2}`)
         .join(", ")}) returning id`,
      [trip, ...Object.values(cols)],
    );
    return rows[0].id;
  }

  it("날짜 줄은 날짜마다 하나, 날짜 밖 줄은 이름으로 여러 개. 일행이 고치고 여행 메모도 쓴다", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-04");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const day = await addFare(trip, { day_index: 0, amount: 900, memo: "호텔 → 도쿄역" });
    await addFare(trip, { title: "공항 왕복", amount: 5500 });
    await addFare(trip, { title: "스카이라이너", amount: 2570 });
    // 같은 날 다시 넣으면 그 줄을 고친다(upsert)
    await db.query(
      `insert into public.transport_fares (trip_id, day_index, amount, currency) values ('${trip}', 0, 1000, 'JPY')
       on conflict (trip_id, day_index) do update set amount = excluded.amount`,
    );
    await as(B);
    await db.query(`update public.transport_fares set memo = '스카이트리' where id = '${day}'`);
    await db.query(`update public.trips set transport_note = '이코카' where id = '${trip}'`);
    const { rows } = await db.query(
      `select day_index, title, amount::text, memo from public.transport_fares
       where trip_id = '${trip}' order by day_index nulls last, title`,
    );
    expect(rows).toEqual([
      { day_index: 0, title: null, amount: "1000.00", memo: "스카이트리" },
      { day_index: null, title: "공항 왕복", amount: "5500.00", memo: null },
      { day_index: null, title: "스카이라이너", amount: "2570.00", memo: null },
    ]);
    expect(
      (await db.query(`select transport_note from public.trips where id = '${trip}'`)).rows,
    ).toEqual([{ transport_note: "이코카" }]);
  });

  it("거부: 같은 날 두 줄 · 이름 있는 날짜 줄 · 이름 없는 날짜 밖 줄 · 빈 날짜 줄 · 음수 · 모르는 통화 · 긴 메모 · 멤버 아님", async () => {
    await as(A);
    const trip = await newTrip("2027-10-31", "2027-11-04");
    await addFare(trip, { day_index: 1, amount: 100 });
    expect(
      await rejects(`insert into public.transport_fares (trip_id, day_index, amount, currency)
      values ('${trip}', 1, 200, 'JPY')`),
    ).toMatch(/transport_fares_day_key/);
    expect(
      await rejects(`insert into public.transport_fares (trip_id, day_index, title, amount, currency)
      values ('${trip}', 2, 'x', 1, 'JPY')`),
    ).toMatch(/transport_fares_kind_chk/);
    expect(
      await rejects(`insert into public.transport_fares (trip_id, amount, currency)
      values ('${trip}', 1, 'JPY')`),
    ).toMatch(/transport_fares_kind_chk/);
    expect(
      await rejects(`insert into public.transport_fares (trip_id, day_index, currency)
      values ('${trip}', 3, 'JPY')`),
    ).toMatch(/transport_fares_filled_chk/);
    expect(
      await rejects(`insert into public.transport_fares (trip_id, day_index, amount, currency)
      values ('${trip}', 3, -1, 'JPY')`),
    ).toMatch(/check constraint/);
    expect(
      await rejects(`insert into public.transport_fares (trip_id, day_index, amount, currency)
      values ('${trip}', 3, 1, 'yen')`),
    ).toMatch(/check constraint/);
    expect(
      await rejects(
        `update public.trips set transport_note = repeat('가', 501) where id = '${trip}'`,
      ),
    ).toMatch(/check constraint/);
    await as(B);
    expect(
      await rejects(`insert into public.transport_fares (trip_id, day_index, amount, currency)
      values ('${trip}', 4, 1, 'JPY')`),
    ).toMatch(/row-level security/);
    // RLS 는 오류 없이 0줄 — 그대로인지로 확인한다
    await db.query(`delete from public.transport_fares where trip_id = '${trip}'`);
    await as(A);
    expect(
      (await db.query(`select 1 from public.transport_fares where trip_id = '${trip}'`)).rows,
    ).toHaveLength(1);
  });
});

describe("비용 장소 (0076)", () => {
  /** 지금 사람으로 내 장소를 하나 만든다(비용 입력이 부르는 upsert_my_place) */
  async function myPlace(trip: string, name: string) {
    const { rows } = await db.query<{ id: string }>(`select public.upsert_my_place($1, $2) as id`, [
      trip,
      JSON.stringify({ name, lat: 35.67, lng: 139.76 }),
    ]);
    return rows[0].id;
  }
  /** 지금 사람으로 장소가 붙은 비용을 넣는다 */
  async function expenseAt(trip: string, payer: string, place: string) {
    const { rows } = await db.query<{ id: string }>(
      `insert into public.expenses (trip_id, payer_id, amount, currency, name, place_id)
       values ('${trip}', '${payer}', 500, 'JPY', '편의점', '${place}') returning id`,
    );
    return rows[0].id;
  }

  it("내 장소를 비용에 붙이면 일행도 그 장소를 읽고, 보관함에는 들어가지 않는다", async () => {
    await as(A);
    const trip = await newTrip("2027-06-01", "2027-06-02");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const place = await myPlace(trip, "로손 긴자점");
    await expenseAt(trip, A, place);

    await as(B);
    const shown = await db.query(`select name from public.places where id = '${place}'`);
    expect(shown.rows).toEqual([{ name: "로손 긴자점" }]);
    const guide = await db.query(
      `select 1 from public.trip_places where trip_id = '${trip}' and place_id = '${place}'`,
    );
    expect(guide.rows).toEqual([]);
  });

  it("남의 개인 장소는 비용에 붙이지 못하고, 일행이 붙인 장소가 있는 비용은 고칠 수 있다", async () => {
    await as(A);
    const trip = await newTrip("2027-06-03", "2027-06-03");
    const other = await newTrip("2027-06-04", "2027-06-04");
    const privatePlace = await myPlace(other, "A 혼자 아는 곳");
    const used = await myPlace(trip, "마츠모토키요시");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const expense = await expenseAt(trip, A, used);

    await as(B);
    expect(
      await rejects(
        `insert into public.expenses (trip_id, payer_id, amount, currency, name, place_id)
         values ('${trip}', '${B}', 1, 'JPY', 'x', '${privatePlace}')`,
      ),
    ).toMatch(/row-level security/);
    await db.query(`update public.expenses set amount = 800 where id = '${expense}'`);
    // 이 여행이 이미 쓰는 장소는 일행도 붙인다
    await expenseAt(trip, B, used);
    const { rows } = await db.query<{ n: number }>(
      `select count(*)::int n from public.expenses where trip_id = '${trip}' and place_id = '${used}'`,
    );
    expect(rows[0].n).toBe(2);
  });

  it("멤버가 나가면 그 사람이 비용에 붙인 장소도 소유자 사본으로 바뀌고, 장소를 지우면 비용의 장소만 빈다", async () => {
    await as(A);
    const trip = await newTrip("2027-06-05", "2027-06-05");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(B);
    const place = await myPlace(trip, "약국");
    const expense = await expenseAt(trip, B, place);
    await db.query(
      `delete from public.trip_members where trip_id = '${trip}' and user_id = '${B}'`,
    );

    await as(A);
    const { rows } = await db.query<{ owner: string; name: string; id: string }>(
      `select p.created_by owner, p.name, p.id from public.expenses e
       join public.places p on p.id = e.place_id where e.id = '${expense}'`,
    );
    expect(rows.map((r) => [r.owner, r.name])).toEqual([[A, "약국"]]);
    expect(rows[0].id).not.toBe(place);

    await db.query(`delete from public.places where id = '${rows[0].id}'`);
    const after = await db.query<{ place_id: string | null }>(
      `select place_id from public.expenses where id = '${expense}'`,
    );
    expect(after.rows).toEqual([{ place_id: null }]);
  });
});

describe("택스 리펀 (0077)", () => {
  /** 환급 건을 넣고 id 를 돌려준다 */
  async function addRefund(trip: string, fields: Record<string, unknown>) {
    const cols = { store: "キデイランド新宿店", currency: "JPY", method: "card", ...fields };
    const { rows } = await db.query<{ id: string }>(
      `insert into public.tax_refunds (trip_id, ${Object.keys(cols).join(", ")})
       values ($1, ${Object.keys(cols)
         .map((_, i) => `$${i + 2}`)
         .join(", ")}) returning id`,
      [trip, ...Object.values(cols)],
    );
    return rows[0].id;
  }

  it("매장 · 금액 · 방법을 적고, 일행이 세관 확인 → 받았어요 로 단계를 올린다. 만든 사람은 넣은 사람", async () => {
    await as(A);
    const trip = await newTrip("2027-11-01", "2027-11-05");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const id = await addRefund(trip, {
      provider: "J-TaxRefund",
      bought_on: "2027-11-01",
      bought_time: "20:03",
      amount: 10128,
      refund_amount: 1012,
      method_note: "쿠팡 와우카드",
    });
    await as(B);
    await db.query(`update public.tax_refunds set customs_at = now() where id = '${id}'`);
    await db.query(`update public.tax_refunds set received_at = now() where id = '${id}'`);
    const { rows } = await db.query(
      `select store, provider, amount::text, refund_amount::text, method, method_note, created_by,
              customs_at is not null as customs, received_at is not null as received
       from public.tax_refunds where id = '${id}'`,
    );
    expect(rows).toEqual([
      {
        store: "キデイランド新宿店",
        provider: "J-TaxRefund",
        amount: "10128.00",
        refund_amount: "1012.00",
        method: "card",
        method_note: "쿠팡 와우카드",
        created_by: A,
        customs: true,
        received: true,
      },
    ]);
  });

  it("거부: 세관 확인 없이 받았어요 · 날짜 없는 시각 · 빈 매장 · 모르는 방법 · 음수 · 모르는 통화 · 멤버 아님", async () => {
    await as(A);
    const trip = await newTrip("2027-11-06", "2027-11-07");
    const id = await addRefund(trip, {});
    expect(
      await rejects(`update public.tax_refunds set received_at = now() where id = '${id}'`),
    ).toMatch(/tax_refunds_steps_chk/);
    // 되돌리기 — 세관 확인을 비우려면 받았어요도 함께 비운다
    await db.query(
      `update public.tax_refunds set customs_at = now(), received_at = now() where id = '${id}'`,
    );
    expect(
      await rejects(`update public.tax_refunds set customs_at = null where id = '${id}'`),
    ).toMatch(/tax_refunds_steps_chk/);
    await db.query(
      `update public.tax_refunds set customs_at = null, received_at = null where id = '${id}'`,
    );
    expect(
      await rejects(`update public.tax_refunds set bought_time = '10:00' where id = '${id}'`),
    ).toMatch(/tax_refunds_time_chk/);
    await expect(addRefund(trip, { store: "  " })).rejects.toThrow(/check constraint/);
    await expect(addRefund(trip, { method: "coupon" })).rejects.toThrow(/check constraint/);
    await expect(addRefund(trip, { refund_amount: -1 })).rejects.toThrow(/check constraint/);
    await expect(addRefund(trip, { currency: "yen" })).rejects.toThrow(/check constraint/);
    await as(B);
    await expect(addRefund(trip, {})).rejects.toThrow(/row-level security/);
    // RLS 는 오류 없이 0줄 — 그대로인지로 확인한다
    await db.query(`delete from public.tax_refunds where trip_id = '${trip}'`);
    await as(A);
    expect(
      (await db.query(`select 1 from public.tax_refunds where trip_id = '${trip}'`)).rows,
    ).toHaveLength(1);
  });
});

describe("택스 리펀 누구 것 · 바코드 (0078)", () => {
  it("환급 받는 사람은 그 여행 멤버만, 바코드 번호를 적는다. 남의 사람 · 긴 번호는 거부", async () => {
    await as(A);
    const trip = await newTrip("2027-11-08", "2027-11-09");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    const solo = await newTrip("2027-11-10", "2027-11-10");
    await as(A);
    const { rows } = await db.query<{ id: string }>(
      `insert into public.tax_refunds (trip_id, store, currency, method, owner_id, barcode)
       values ('${trip}', 'ASICS', 'JPY', 'card', '${B}', '31248121703003980985') returning id`,
    );
    const saved = await db.query(
      `select owner_id, barcode from public.tax_refunds where id = '${rows[0].id}'`,
    );
    expect(saved.rows).toEqual([{ owner_id: B, barcode: "31248121703003980985" }]);
    // B 가 멤버가 아닌 여행에는 B 를 받는 사람으로 적지 못한다
    expect(
      await rejects(
        `insert into public.tax_refunds (trip_id, store, currency, method, owner_id)
         values ('${solo}', 'x', 'JPY', 'card', '${B}')`,
      ),
    ).toMatch(/refund owner is not a trip member/);
    expect(
      await rejects(
        `update public.tax_refunds set barcode = repeat('1', 61) where id = '${rows[0].id}'`,
      ),
    ).toMatch(/check constraint/);
  });
});

describe("택스 리펀 누구 것 검사는 바꿀 때만 (0079)", () => {
  it("받는 사람이 나간 뒤에도 일행이 단계를 바꾸고, 나간 사람을 새로 고르지는 못한다", async () => {
    await as(A);
    const trip = await newTrip("2027-11-11", "2027-11-12");
    await db.exec(
      `reset role; insert into public.trip_members (trip_id, user_id, role) values ('${trip}', '${B}', 'member');`,
    );
    await as(A);
    const mine = await db.query<{ id: string }>(
      `insert into public.tax_refunds (trip_id, store, currency, method, owner_id)
       values ('${trip}', 'ASICS', 'JPY', 'card', '${B}') returning id`,
    );
    const other = await db.query<{ id: string }>(
      `insert into public.tax_refunds (trip_id, store, currency, method)
       values ('${trip}', 'x', 'JPY', 'card') returning id`,
    );
    await db.exec(
      `reset role; delete from public.trip_members where trip_id = '${trip}' and user_id = '${B}';`,
    );
    await as(A);
    await db.query(
      `update public.tax_refunds set customs_at = now(), memo = '공항' where id = '${mine.rows[0].id}'`,
    );
    const { rows } = await db.query(
      `select owner_id, customs_at is not null as customs from public.tax_refunds where id = '${mine.rows[0].id}'`,
    );
    expect(rows).toEqual([{ owner_id: B, customs: true }]);
    expect(
      await rejects(
        `update public.tax_refunds set owner_id = '${B}' where id = '${other.rows[0].id}'`,
      ),
    ).toMatch(/refund owner is not a trip member/);
    // 정하지 않음으로 바꾸는 것은 된다
    await db.query(`update public.tax_refunds set owner_id = null where id = '${mine.rows[0].id}'`);
  });
});
