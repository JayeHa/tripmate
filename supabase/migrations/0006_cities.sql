-- 도시 기준 데이터. 트리플의 도시 선택 화면을 기준으로 우리가 정의한다.
-- 여행은 trip_cities 로 도시를 여러 개 고른다. 도시에는 지도 중심·통화·시간대·사진이 붙고,
-- 이후 추천 장소(city_places)도 도시에 붙는다.
-- 기준 데이터라 앱에서는 읽기만 한다. 바꿀 때는 마이그레이션으로 바꾼다.

-- ---------- 권역 (해외만. 국내는 권역 없이 바로 도시) ----------
create table public.city_regions (
  id       text primary key,
  name     text not null,
  position int  not null
);

-- ---------- 도시 ----------
create table public.cities (
  id           text primary key,                 -- 영문 slug. 이미지 파일명·FK 로 쓴다
  scope        text not null check (scope in ('abroad', 'domestic')),
  region_id    text references public.city_regions(id),
  name         text not null,
  areas        text[] not null default '{}',      -- 포함 지역. 표시와 검색('하코네' → 도쿄)에 쓴다
  description  text,                             -- areas 대신 보일 문구 (국내 「어디론가」)
  position     int  not null,                    -- 권역(국내는 국내 전체) 안의 순서
  lat          double precision not null,        -- 지도 중심
  lng          double precision not null,
  zoom         smallint not null default 11,
  country_code text not null,                    -- ISO 3166-1 alpha-2
  currency     text not null,                    -- ISO 4217. 가계부 기본 통화
  timezone     text not null,                    -- IANA. 일정 시각
  image_path   text,                             -- storage city-images 버킷 안의 경로. 없으면 틴트로 대신
  constraint cities_region_chk check ((scope = 'abroad') = (region_id is not null))
);
create index cities_order_idx on public.cities(scope, region_id, position);

-- ---------- 여행 ↔ 도시 ----------
create table public.trip_cities (
  trip_id  uuid not null references public.trips(id) on delete cascade,
  city_id  text not null references public.cities(id),
  position smallint not null default 0,
  primary key (trip_id, city_id)
);
create index trip_cities_city_idx on public.trip_cities(city_id);

-- ---------- RLS ----------
alter table public.city_regions enable row level security;
alter table public.cities       enable row level security;
alter table public.trip_cities  enable row level security;

-- 기준 데이터는 읽기만. 쓰기 정책이 없으니 앱에서는 바꿀 수 없다.
create policy "city_regions_read" on public.city_regions for select to authenticated using (true);
create policy "cities_read"       on public.cities       for select to authenticated using (true);

-- 여행 도시는 그 여행 멤버가 다룬다. trips_update_member 와 같은 기준이다.
-- 익명(둘러보기)도 자기 여행에서만 멤버라 남의 데이터에 흔적을 남기지 않는다.
create policy "trip_cities_select" on public.trip_cities
  for select to authenticated using (public.is_trip_member(trip_id));
create policy "trip_cities_insert" on public.trip_cities
  for insert to authenticated with check (public.is_trip_member(trip_id));
create policy "trip_cities_update" on public.trip_cities
  for update to authenticated using (public.is_trip_member(trip_id)) with check (public.is_trip_member(trip_id));
create policy "trip_cities_delete" on public.trip_cities
  for delete to authenticated using (public.is_trip_member(trip_id));

-- ---------- 도시 사진 버킷 ----------
-- 공개 버킷은 공개 URL 로 정책 없이 읽힌다. 업로드는 service role 스크립트로만 한다.
insert into storage.buckets (id, name, public)
values ('city-images', 'city-images', true)
on conflict (id) do nothing;

-- ---------- 시드 ----------
insert into public.city_regions (id, name, position) values
  ('japan', '일본', 0),
  ('southeast-asia', '동남아시아', 1),
  ('greater-china', '중화/중국', 2),
  ('south-pacific', '남태평양', 3),
  ('europe', '유럽', 4),
  ('americas', '미주', 5),
  ('central-asia', '중앙아시아', 6),
  ('west-asia', '서아시아', 7),
  ('latin-america', '중남미', 8);

insert into public.cities
  (id, scope, region_id, name, areas, description, position, lat, lng, zoom, country_code, currency, timezone)
values
  ('tokyo', 'abroad', 'japan', '도쿄', array['도쿄', '하코네', '요코하마', '가마쿠라'], null, 0, 35.6812, 139.7671, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('fukuoka', 'abroad', 'japan', '후쿠오카', array['후쿠오카', '유후인', '벳푸', '기타큐슈'], null, 1, 33.5902, 130.4017, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('osaka', 'abroad', 'japan', '오사카', array['오사카', '교토', '고베', '나라'], null, 2, 34.6937, 135.5023, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('kagoshima', 'abroad', 'japan', '가고시마', array['가고시마', '이부스키', '기리시마', '야쿠시마'], null, 3, 31.5966, 130.5571, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('shizuoka', 'abroad', 'japan', '시즈오카', array['시즈오카', '후지노미야', '이토', '하마마쓰'], null, 4, 34.9756, 138.3828, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('nagoya', 'abroad', 'japan', '나고야', array['나고야', '다카야마', '시라카와고', '게로'], null, 5, 35.1815, 136.9066, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('sapporo', 'abroad', 'japan', '삿포로', array['삿포로', '하코다테', '오타루', '비에이', '노보리베츠'], null, 6, 43.0618, 141.3545, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('okinawa', 'abroad', 'japan', '오키나와', array['오키나와'], null, 7, 26.2124, 127.6809, 9, 'JP', 'JPY', 'Asia/Tokyo'),
  ('hiroshima', 'abroad', 'japan', '히로시마', array['히로시마'], null, 8, 34.3853, 132.4553, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('nagasaki', 'abroad', 'japan', '나가사키', array['나가사키', '사가', '사세보', '운젠'], null, 9, 32.7503, 129.8777, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('yonago', 'abroad', 'japan', '요나고', array['요나고'], null, 10, 35.4281, 133.331, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('takamatsu', 'abroad', 'japan', '다카마쓰', array['다카마쓰'], null, 11, 34.3428, 134.0466, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('tsushima', 'abroad', 'japan', '대마도', array['대마도'], null, 12, 34.2026, 129.2876, 10, 'JP', 'JPY', 'Asia/Tokyo'),
  ('matsuyama', 'abroad', 'japan', '마쓰야마', array['마쓰야마'], null, 13, 33.8392, 132.7657, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('kumamoto', 'abroad', 'japan', '구마모토', array['구마모토', '아소'], null, 14, 32.8031, 130.7079, 11, 'JP', 'JPY', 'Asia/Tokyo'),
  ('nha-trang', 'abroad', 'southeast-asia', '나트랑', array['나트랑'], null, 0, 12.2388, 109.1967, 11, 'VN', 'VND', 'Asia/Ho_Chi_Minh'),
  ('manila', 'abroad', 'southeast-asia', '마닐라', array['마닐라', '바탕가스'], null, 1, 14.5995, 120.9842, 11, 'PH', 'PHP', 'Asia/Manila'),
  ('myanmar', 'abroad', 'southeast-asia', '미얀마', array['양곤', '바간', '만달레이', '인레 호수'], null, 2, 16.8409, 96.1735, 7, 'MM', 'MMK', 'Asia/Yangon'),
  ('chiang-mai', 'abroad', 'southeast-asia', '치앙마이', array['치앙마이', '치앙라이', '빠이'], null, 3, 18.7883, 98.9853, 11, 'TH', 'THB', 'Asia/Bangkok'),
  ('palawan', 'abroad', 'southeast-asia', '팔라완', array['팔라완'], null, 4, 9.7392, 118.7353, 9, 'PH', 'PHP', 'Asia/Manila'),
  ('phu-quoc', 'abroad', 'southeast-asia', '푸꾸옥', array['푸꾸옥'], null, 5, 10.2899, 103.984, 10, 'VN', 'VND', 'Asia/Ho_Chi_Minh'),
  ('laos', 'abroad', 'southeast-asia', '라오스', array['비엔티안', '방비엥', '루앙프라방'], null, 6, 17.9757, 102.6331, 7, 'LA', 'LAK', 'Asia/Vientiane'),
  ('kuala-lumpur', 'abroad', 'southeast-asia', '쿠알라룸푸르', array['쿠알라룸푸르', '말라카', '푸트라자야', '페낭'], null, 7, 3.139, 101.6869, 11, 'MY', 'MYR', 'Asia/Kuala_Lumpur'),
  ('da-lat', 'abroad', 'southeast-asia', '달랏', array['달랏'], null, 8, 11.9404, 108.4583, 11, 'VN', 'VND', 'Asia/Ho_Chi_Minh'),
  ('da-nang', 'abroad', 'southeast-asia', '다낭', array['다낭', '호이안', '후에'], null, 9, 16.0544, 108.2022, 11, 'VN', 'VND', 'Asia/Ho_Chi_Minh'),
  ('bangkok', 'abroad', 'southeast-asia', '방콕', array['방콕', '파타야', '후아힌', '코 사멧', '코사무이'], null, 10, 13.7563, 100.5018, 11, 'TH', 'THB', 'Asia/Bangkok'),
  ('cebu', 'abroad', 'southeast-asia', '세부', array['세부', '보홀'], null, 11, 10.3157, 123.8854, 11, 'PH', 'PHP', 'Asia/Manila'),
  ('kota-kinabalu', 'abroad', 'southeast-asia', '코타키나발루', array['코타키나발루'], null, 12, 5.9804, 116.0735, 11, 'MY', 'MYR', 'Asia/Kuching'),
  ('singapore', 'abroad', 'southeast-asia', '싱가포르', array['싱가포르', '조호르바루'], null, 13, 1.3521, 103.8198, 11, 'SG', 'SGD', 'Asia/Singapore'),
  ('hanoi', 'abroad', 'southeast-asia', '하노이', array['하노이', '하롱베이', '하이퐁', '사파'], null, 14, 21.0278, 105.8342, 11, 'VN', 'VND', 'Asia/Ho_Chi_Minh'),
  ('ho-chi-minh', 'abroad', 'southeast-asia', '호치민', array['호치민', '무이네'], null, 15, 10.8231, 106.6297, 11, 'VN', 'VND', 'Asia/Ho_Chi_Minh'),
  ('bali', 'abroad', 'southeast-asia', '발리', array['발리', '롬복'], null, 16, -8.3405, 115.092, 9, 'ID', 'IDR', 'Asia/Makassar'),
  ('phuket', 'abroad', 'southeast-asia', '푸켓', array['푸켓', '끄라비'], null, 17, 7.8804, 98.3923, 10, 'TH', 'THB', 'Asia/Bangkok'),
  ('boracay', 'abroad', 'southeast-asia', '보라카이', array['보라카이'], null, 18, 11.9674, 121.9248, 12, 'PH', 'PHP', 'Asia/Manila'),
  ('kaohsiung', 'abroad', 'greater-china', '가오슝', array['가오슝', '타이난', '컨딩'], null, 0, 22.6273, 120.3014, 11, 'TW', 'TWD', 'Asia/Taipei'),
  ('qingdao', 'abroad', 'greater-china', '칭다오', array['칭다오'], null, 1, 36.0671, 120.3826, 11, 'CN', 'CNY', 'Asia/Shanghai'),
  ('hainan', 'abroad', 'greater-china', '하이난', array['하이난'], null, 2, 18.2528, 109.5119, 9, 'CN', 'CNY', 'Asia/Shanghai'),
  ('dalian', 'abroad', 'greater-china', '대련', array['대련'], null, 3, 38.914, 121.6147, 11, 'CN', 'CNY', 'Asia/Shanghai'),
  ('yantai', 'abroad', 'greater-china', '연태', array['연태'], null, 4, 37.4638, 121.4479, 11, 'CN', 'CNY', 'Asia/Shanghai'),
  ('hong-kong', 'abroad', 'greater-china', '홍콩', array['홍콩', '마카오'], null, 5, 22.3193, 114.1694, 11, 'HK', 'HKD', 'Asia/Hong_Kong'),
  ('taipei', 'abroad', 'greater-china', '타이베이', array['타이베이', '이란', '타이중'], null, 6, 25.033, 121.5654, 11, 'TW', 'TWD', 'Asia/Taipei'),
  ('shanghai', 'abroad', 'greater-china', '상하이', array['상하이', '쑤저우', '항저우'], null, 7, 31.2304, 121.4737, 11, 'CN', 'CNY', 'Asia/Shanghai'),
  ('beijing', 'abroad', 'greater-china', '베이징', array['베이징'], null, 8, 39.9042, 116.4074, 11, 'CN', 'CNY', 'Asia/Shanghai'),
  ('sydney', 'abroad', 'south-pacific', '시드니', array['시드니', '블루마운틴', '울릉공', '뉴캐슬'], null, 0, -33.8688, 151.2093, 11, 'AU', 'AUD', 'Australia/Sydney'),
  ('melbourne', 'abroad', 'south-pacific', '멜버른', array['멜버른', '질롱', '그레이트 오션 로드'], null, 1, -37.8136, 144.9631, 11, 'AU', 'AUD', 'Australia/Melbourne'),
  ('auckland', 'abroad', 'south-pacific', '오클랜드', array['오클랜드'], null, 2, -36.8485, 174.7633, 11, 'NZ', 'NZD', 'Pacific/Auckland'),
  ('queenstown', 'abroad', 'south-pacific', '퀸스타운', array['퀸스타운'], null, 3, -45.0312, 168.6626, 11, 'NZ', 'NZD', 'Pacific/Auckland'),
  ('brisbane', 'abroad', 'south-pacific', '브리즈번', array['브리즈번', '골드코스트'], null, 4, -27.4698, 153.0251, 11, 'AU', 'AUD', 'Australia/Brisbane'),
  ('guam', 'abroad', 'south-pacific', '괌', array['괌'], null, 5, 13.4443, 144.7937, 11, 'GU', 'USD', 'Pacific/Guam'),
  ('saipan', 'abroad', 'south-pacific', '사이판', array['사이판'], null, 6, 15.185, 145.7467, 11, 'MP', 'USD', 'Pacific/Saipan'),
  ('granada', 'abroad', 'europe', '그라나다', array['그라나다', '말라가', '네르하'], null, 0, 37.1773, -3.5986, 11, 'ES', 'EUR', 'Europe/Madrid'),
  ('dubrovnik', 'abroad', 'europe', '두브로브니크', array['두브로브니크', '스플리트'], null, 1, 42.6507, 18.0944, 11, 'HR', 'EUR', 'Europe/Zagreb'),
  ('lisbon', 'abroad', 'europe', '리스본', array['리스본', '신트라', '카스카이스', '오비두스'], null, 2, 38.7223, -9.1393, 11, 'PT', 'EUR', 'Europe/Lisbon'),
  ('milan', 'abroad', 'europe', '밀라노', array['밀라노', '꼬모', '베로나', '베르가모', '시르미오네'], null, 3, 45.4642, 9.19, 11, 'IT', 'EUR', 'Europe/Rome'),
  ('brussels', 'abroad', 'europe', '브뤼셀', array['브뤼셀', '브뤼헤', '겐트', '앤트워프'], null, 4, 50.8503, 4.3517, 11, 'BE', 'EUR', 'Europe/Brussels'),
  ('seville', 'abroad', 'europe', '세비야', array['세비야', '카디스', '론다', '코르도바'], null, 5, 37.3891, -5.9845, 11, 'ES', 'EUR', 'Europe/Madrid'),
  ('zagreb', 'abroad', 'europe', '자그레브', array['자그레브', '플리트비체', '리예카'], null, 6, 45.815, 15.9819, 11, 'HR', 'EUR', 'Europe/Zagreb'),
  ('porto', 'abroad', 'europe', '포르투', array['포르투', '브라가', '기마랑이스', '아베이루&코스타노바'], null, 7, 41.1579, -8.6291, 11, 'PT', 'EUR', 'Europe/Lisbon'),
  ('helsinki', 'abroad', 'europe', '헬싱키', array['헬싱키', '포르보', '투르쿠'], null, 8, 60.1699, 24.9384, 11, 'FI', 'EUR', 'Europe/Helsinki'),
  ('athens', 'abroad', 'europe', '아테네', array['아테네', '산토리니'], null, 9, 37.9838, 23.7275, 11, 'GR', 'EUR', 'Europe/Athens'),
  ('nice', 'abroad', 'europe', '니스', array['니스'], null, 10, 43.7102, 7.262, 11, 'FR', 'EUR', 'Europe/Paris'),
  ('mallorca', 'abroad', 'europe', '마요르카', array['마요르카'], null, 11, 39.5696, 2.6502, 10, 'ES', 'EUR', 'Europe/Madrid'),
  ('paris', 'abroad', 'europe', '파리', array['파리', '베르사유', '몽생미셸', '스트라스부르'], null, 12, 48.8566, 2.3522, 11, 'FR', 'EUR', 'Europe/Paris'),
  ('prague', 'abroad', 'europe', '프라하', array['프라하', '체스키 크룸로프', '카를로비 바리'], null, 13, 50.0755, 14.4378, 11, 'CZ', 'CZK', 'Europe/Prague'),
  ('rome', 'abroad', 'europe', '로마', array['로마', '나폴리', '아말피', '포지타노', '소렌토'], null, 14, 41.9028, 12.4964, 11, 'IT', 'EUR', 'Europe/Rome'),
  ('london', 'abroad', 'europe', '런던', array['런던', '옥스퍼드', '윈저&이튼', '브라이튼&세븐 시스터즈'], null, 15, 51.5074, -0.1278, 11, 'GB', 'GBP', 'Europe/London'),
  ('barcelona', 'abroad', 'europe', '바르셀로나', array['바르셀로나', '시체스', '지로나', '이비자'], null, 16, 41.3874, 2.1686, 11, 'ES', 'EUR', 'Europe/Madrid'),
  ('vienna', 'abroad', 'europe', '빈', array['빈', '잘츠부르크', '할슈타트', '인스부르크'], null, 17, 48.2082, 16.3738, 11, 'AT', 'EUR', 'Europe/Vienna'),
  ('florence', 'abroad', 'europe', '피렌체', array['피렌체', '베네치아', '피사', '친퀘테레', '시에나'], null, 18, 43.7696, 11.2558, 11, 'IT', 'EUR', 'Europe/Rome'),
  ('interlaken', 'abroad', 'europe', '인터라켄', array['인터라켄', '융프라우', '그린델발트'], null, 19, 46.6863, 7.8632, 11, 'CH', 'CHF', 'Europe/Zurich'),
  ('madrid', 'abroad', 'europe', '마드리드', array['마드리드', '톨레도', '세고비아'], null, 20, 40.4168, -3.7038, 11, 'ES', 'EUR', 'Europe/Madrid'),
  ('budapest', 'abroad', 'europe', '부다페스트', array['부다페스트'], null, 21, 47.4979, 19.0402, 11, 'HU', 'HUF', 'Europe/Budapest'),
  ('vladivostok', 'abroad', 'europe', '블라디보스토크', array['블라디보스토크', '우수리스크'], null, 22, 43.1198, 131.8869, 11, 'RU', 'RUB', 'Asia/Vladivostok'),
  ('zurich', 'abroad', 'europe', '취리히', array['취리히', '루체른', '베른'], null, 23, 47.3769, 8.5417, 11, 'CH', 'CHF', 'Europe/Zurich'),
  ('frankfurt', 'abroad', 'europe', '프랑크푸르트', array['프랑크푸르트', '하이델베르크', '쾰른'], null, 24, 50.1109, 8.6821, 11, 'DE', 'EUR', 'Europe/Berlin'),
  ('munich', 'abroad', 'europe', '뮌헨', array['뮌헨', '퓌센', '뉘른베르크'], null, 25, 48.1351, 11.582, 11, 'DE', 'EUR', 'Europe/Berlin'),
  ('amsterdam', 'abroad', 'europe', '암스테르담', array['암스테르담', '잔세스칸스'], null, 26, 52.3676, 4.9041, 11, 'NL', 'EUR', 'Europe/Amsterdam'),
  ('berlin', 'abroad', 'europe', '베를린', array['베를린', '드레스덴'], null, 27, 52.52, 13.405, 11, 'DE', 'EUR', 'Europe/Berlin'),
  ('vancouver', 'abroad', 'americas', '밴쿠버', array['밴쿠버', '빅토리아', '휘슬러'], null, 0, 49.2827, -123.1207, 11, 'CA', 'CAD', 'America/Vancouver'),
  ('san-francisco', 'abroad', 'americas', '샌프란시스코', array['샌프란시스코', '산호세', '나파 밸리'], null, 1, 37.7749, -122.4194, 11, 'US', 'USD', 'America/Los_Angeles'),
  ('seattle', 'abroad', 'americas', '시애틀', array['시애틀'], null, 2, 47.6062, -122.3321, 11, 'US', 'USD', 'America/Los_Angeles'),
  ('toronto', 'abroad', 'americas', '토론토', array['토론토', '나이아가라', '킹스턴', '블루 마운틴'], null, 3, 43.6532, -79.3832, 11, 'CA', 'CAD', 'America/Toronto'),
  ('hawaii', 'abroad', 'americas', '하와이', array['하와이'], null, 4, 21.3069, -157.8583, 9, 'US', 'USD', 'Pacific/Honolulu'),
  ('new-york', 'abroad', 'americas', '뉴욕', array['뉴욕'], null, 5, 40.7128, -74.006, 11, 'US', 'USD', 'America/New_York'),
  ('los-angeles', 'abroad', 'americas', '로스앤젤레스', array['로스앤젤레스', '라스베가스'], null, 6, 34.0522, -118.2437, 10, 'US', 'USD', 'America/Los_Angeles'),
  ('ulaanbaatar', 'abroad', 'central-asia', '울란바타르', array['울란바타르'], null, 0, 47.8864, 106.9057, 11, 'MN', 'MNT', 'Asia/Ulaanbaatar'),
  ('almaty', 'abroad', 'central-asia', '알마티', array['알마티'], null, 1, 43.222, 76.8512, 11, 'KZ', 'KZT', 'Asia/Almaty'),
  ('dubai', 'abroad', 'west-asia', '두바이', array['두바이', '아부다비', '알 아인'], null, 0, 25.2048, 55.2708, 10, 'AE', 'AED', 'Asia/Dubai'),
  ('istanbul', 'abroad', 'west-asia', '이스탄불', array['이스탄불', '부르사', '이즈닉'], null, 1, 41.0082, 28.9784, 11, 'TR', 'TRY', 'Europe/Istanbul'),
  ('cappadocia', 'abroad', 'west-asia', '카파도키아', array['카파도키아', '코니아'], null, 2, 38.6431, 34.8289, 10, 'TR', 'TRY', 'Europe/Istanbul'),
  ('maldives', 'abroad', 'west-asia', '몰디브', array['몰디브'], null, 3, 4.1755, 73.5093, 8, 'MV', 'MVR', 'Indian/Maldives'),
  ('cancun', 'abroad', 'latin-america', '칸쿤', array['칸쿤'], null, 0, 21.1619, -86.8515, 11, 'MX', 'MXN', 'America/Cancun'),
  ('gapyeong-yangpyeong', 'domestic', null, '가평·양평', array['가평', '양평'], null, 0, 37.8315, 127.5105, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('gangneung-sokcho', 'domestic', null, '강릉·속초', array['강릉', '속초', '양양'], null, 1, 37.7519, 128.8761, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('gyeongju', 'domestic', null, '경주', array['경주'], null, 2, 35.8562, 129.2247, 12, 'KR', 'KRW', 'Asia/Seoul'),
  ('busan', 'domestic', null, '부산', array['부산'], null, 3, 35.1796, 129.0756, 11, 'KR', 'KRW', 'Asia/Seoul'),
  ('yeosu', 'domestic', null, '여수', array['여수', '순천'], null, 4, 34.7604, 127.6622, 11, 'KR', 'KRW', 'Asia/Seoul'),
  ('incheon', 'domestic', null, '인천', array['인천', '강화도'], null, 5, 37.4563, 126.7052, 11, 'KR', 'KRW', 'Asia/Seoul'),
  ('jeonju', 'domestic', null, '전주', array['전주', '군산'], null, 6, 35.8242, 127.148, 11, 'KR', 'KRW', 'Asia/Seoul'),
  ('jeju', 'domestic', null, '제주', array['제주'], null, 7, 33.4996, 126.5312, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('chuncheon-hongcheon', 'domestic', null, '춘천·홍천', array['춘천', '홍천'], null, 8, 37.8813, 127.7298, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('taean', 'domestic', null, '태안', array['태안', '당진', '서산'], null, 9, 36.7456, 126.298, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('tongyeong-geoje-namhae', 'domestic', null, '통영·거제·남해', array['통영', '거제', '남해'], null, 10, 34.8544, 128.4332, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('pohang-andong', 'domestic', null, '포항·안동', array['포항', '안동'], null, 11, 36.019, 129.3435, 10, 'KR', 'KRW', 'Asia/Seoul'),
  ('domestic-anywhere', 'domestic', null, '국내', '{}', '어디론가 떠나고 싶을 때', 12, 36.5, 127.8, 7, 'KR', 'KRW', 'Asia/Seoul');

-- ---------- 기존 여행의 목적지 이전 ----------
-- destination 이 도시 이름이나 포함 지역과 같으면 그 도시로 잇는다. 안 맞으면 잇지 않는다(「도시 미정」).
-- destination 컬럼은 아직 지우지 않는다. 만들기 플로우가 trip_cities 를 쓰기 시작한 뒤 지운다.
insert into public.trip_cities (trip_id, city_id, position)
select t.id, c.id, 0
from public.trips t
cross join lateral (
  select c.id from public.cities c
  where c.name = btrim(t.destination) or btrim(t.destination) = any(c.areas)
  order by (c.name = btrim(t.destination)) desc, c.scope, c.position
  limit 1
) c
where t.destination is not null;

-- ---------- 초대 미리보기: 목적지 대신 도시 이름 ----------
-- 반환 형태가 바뀌어 create or replace 로는 안 된다.
drop function public.get_trip_preview(text);
create function public.get_trip_preview(p_token text)
returns table (id uuid, title text, cities text[], start_date date, end_date date, member_count bigint)
language sql stable security definer set search_path = public as $$
  select t.id, t.title,
         coalesce(
           (select array_agg(c.name order by tc.position)
            from public.trip_cities tc join public.cities c on c.id = tc.city_id
            where tc.trip_id = t.id),
           '{}'
         ),
         t.start_date, t.end_date,
         (select count(*) from public.trip_members m where m.trip_id = t.id)
  from public.trips t where t.invite_token = p_token;
$$;
revoke all on function public.get_trip_preview(text) from public;
grant execute on function public.get_trip_preview(text) to authenticated, anon;
