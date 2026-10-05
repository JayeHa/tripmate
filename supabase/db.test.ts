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
  create table storage.buckets (id text primary key, name text, public boolean);
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
  it("줄이면 잘린 날의 일정은 마지막 날 끝으로(순서 유지), 지출은 같이 옮기고 도착일로 모은다", async () => {
    await as(A);
    const id = await newTrip("2026-11-01", "2026-11-05");
    await db.exec(`
      insert into public.schedule_items (trip_id, day_index, position, kind, name) values
        ('${id}',0,0,'note','a'),('${id}',2,0,'note','c'),('${id}',3,0,'note','d'),
        ('${id}',3,1,'note','e'),('${id}',4,0,'note','f');
      insert into public.expenses (trip_id, payer_id, amount, currency, spent_on) values
        ('${id}','${A}',1,'KRW','2026-11-02'),('${id}','${A}',2,'KRW','2026-11-04');
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
      `select amount::int || '@' || spent_on v from public.expenses where trip_id = '${id}' order by amount`,
    );
    expect(expenses.rows.map((r) => r.v)).toEqual(["1@2026-11-11", "2@2026-11-12"]);

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
