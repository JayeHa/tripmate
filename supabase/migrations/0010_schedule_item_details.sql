-- (d) 일정 타임라인. 시안의 장소 정보를 일정 한 줄이 직접 갖는다.
-- 장소 보관함(places) 테이블은 두지 않는다. 가이드(#17)의 장소를 일정에 담을 때는 값을 복사한다.
--
-- kind     : place(번호 마커·지도 핀) · flight · note(파란 점 한 줄) · move(이동 구간, 카드 없음)
-- status   : 예약 상태. 없으면 null(「상태 없음」). 번호 마커와 지도 핀의 색이 된다
-- category : 카테고리. 이모지 기본값 · 메타 줄 라벨 · 식사 카드 배경이 여기서 나온다
-- rating · review_count : 사용자가 직접 적는다. Google 평점은 약관상 저장할 수 없다(#34)
-- links        : [{ title, url }] 구글맵 외 추가 링크
-- alternatives : [{ name, gmap, sub?, hours? }] 대체 장소
alter table public.schedule_items
  add column kind text not null default 'place'
    check (kind in ('place', 'flight', 'note', 'move')),
  add column status text check (status in ('ok', 'wait', 'opt')),
  add column category text check (category in ('sight', 'food', 'cafe', 'shop', 'stay', 'air')),
  add column emoji text,
  add column rating numeric(2, 1) check (rating between 0 and 5),
  add column review_count int check (review_count >= 0),
  add column description text,
  add column hours text,
  add column gmap_url text,
  add column links jsonb not null default '[]' check (jsonb_typeof(links) = 'array'),
  add column alternatives jsonb not null default '[]' check (jsonb_typeof(alternatives) = 'array');
