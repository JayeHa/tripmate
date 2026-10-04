-- 멤버가 여행에서 나가면, 그 사람이 만든 장소 중 이 여행이 쓰는 것을 여행 소유자의 사본으로 바꾼다.
-- 장소는 만든 사람만 고친다(0013). 나간 뒤에도 원본을 쓰면 나간 사람이 고친 내용이 이 여행에 계속 보이고,
-- 남은 멤버는 손을 쓸 수 없다 — 남의 여행에 흔적이 남는다(AGENTS.md 인증 경계).
-- 사본은 소유자 것이 되어 남은 쪽이 고칠 수 있고, 원본은 나간 사람의 다른 여행에서 그대로 쓴다.
-- 소유자가 같은 구글 장소를 이미 갖고 있으면 사본을 만들지 않고 그 장소를 쓴다(장소 1 · 일정 N).
--
-- security definer 다: 사본의 created_by 가 호출자(나가는 사람)가 아니라 소유자라서 places_insert_owner 를 통과하지 못하고,
-- 남의 일정 행을 고쳐야 한다. 트리거라 직접 부를 수 없고, 나가는 동작(members_delete) 자체가 경계다.
create function public.copy_places_on_leave()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  r record;
  v_copy uuid;
begin
  select owner_id into v_owner from public.trips where id = old.trip_id;
  -- 여행이 지워지는 중(cascade)이거나 소유자 본인이면 옮길 곳이 없다
  if v_owner is null or v_owner = old.user_id then
    return old;
  end if;

  for r in
    select distinct p.*
    from public.places p
    join public.schedule_items si on si.place_id = p.id
    where si.trip_id = old.trip_id and p.created_by = old.user_id
  loop
    v_copy := null;
    if r.google_place_id is not null then
      select id into v_copy from public.places
      where created_by = v_owner and google_place_id = r.google_place_id;
    end if;
    if v_copy is null then
      insert into public.places (
        city_id, created_by, name, google_place_id, lat, lng, address, category, emoji,
        rating, review_count, description, hours, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.category, r.emoji,
        r.rating, r.review_count, r.description, r.hours, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;
revoke all on function public.copy_places_on_leave() from public;

create trigger trip_members_copy_places after delete on public.trip_members
  for each row execute function public.copy_places_on_leave();
