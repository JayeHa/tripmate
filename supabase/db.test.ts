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

describe("schedule_items · places 칸 (0010 · 0013)", () => {
  it("note 는 장소 없이 제목만으로, 상태 없음 · 빈 대체 장소가 된다", async () => {
    await as(A);
    const id = await newTrip("2027-03-01", "2027-03-01");
    const { rows } = await db.query(
      `insert into public.schedule_items (trip_id, day_index, position, kind, name)
       values ('${id}', 0, 0, 'note', '공항 집합') returning status, alternatives`,
    );
    expect(rows).toEqual([{ status: null, alternatives: [] }]);
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
    ["alternatives 가 배열이 아님", "kind, name, alternatives", `'note', 'x', '"x"'`],
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
