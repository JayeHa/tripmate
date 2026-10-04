-- copy_places_on_leave(0014): 0017 에서 생긴 places.wait 을 사본에 함께 옮긴다(0017 리뷰 반영).
-- 컬럼을 하나씩 나열해 복사하므로 places 에 칸을 더하면 이 함수도 고친다.

-- 0014 와 같고 insert 목록에 wait 만 더했다. 판단 근거(security definer 인 이유 등)는 0014 주석에 있다.
create or replace function public.copy_places_on_leave()
returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  r record;
  v_copy uuid;
begin
  select owner_id into v_owner from public.trips where id = old.trip_id;
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
        rating, review_count, wait, description, hours, gmap_url, links
      ) values (
        r.city_id, v_owner, r.name, r.google_place_id, r.lat, r.lng, r.address, r.category, r.emoji,
        r.rating, r.review_count, r.wait, r.description, r.hours, r.gmap_url, r.links
      )
      returning id into v_copy;
    end if;
    update public.schedule_items set place_id = v_copy
    where trip_id = old.trip_id and place_id = r.id;
  end loop;
  return old;
end $$;
