"use client";

import { useEffect, useState } from "react";

import { useTripCities, useTripHolidays } from "@/entities/city";
import type { Trip } from "@/entities/trip";
import { useLiveRates } from "@/shared/api/live-rates";
import { todayISO } from "@/shared/lib/days";
import { liveUnitValue } from "@/shared/lib/money";

import { widgetTiles } from "../lib/widgets";
import { useWeatherTile } from "./use-weather-tile";

/** 현지 시각을 다시 그리는 간격 — 분이 바뀌는 것만 보이면 된다 */
const TICK_MS = 15_000;

/** 지금 시각 — 15초마다 새로 그린다. 여행 홈은 클라이언트에서만 그려서 첫 값이 서버와 어긋나지 않는다 */
function useClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * 위젯 줄 — 여행의 첫 도시(통화 · 시간대)와 여행 환율로 정한 타일들, 계산기에 쓸 여행지 통화,
 * 실시간 환율(여행 환율과 같은 단위의 기준 화폐 금액 — 참고용, 여행지 통화의 여행 환율이 있을 때만 받는다),
 * 공휴일 · 날씨 타일을 보이는지(출처 표기용). 공휴일은 첫 도시의 나라, 날씨는 첫 도시의 좌표 기준이다.
 * 도시를 아직 모르면 타일 없음(줄이 늦게 나타난다 — 자리를 비워 두지 않는다)
 */
export function useWidgets(tripId: string, trip: Trip) {
  const city = useTripCities(tripId).data?.[0];
  const at = useClock();
  const rate =
    city && city.currency !== trip.home_currency ? trip.exchange_rates[city.currency] : null;
  const liveRates = useLiveRates(trip.home_currency, !!rate).data;
  const live =
    city && rate && liveRates ? liveUnitValue(liveRates, city.currency, rate.unit) : null;
  const holidays = useTripHolidays(tripId, trip);
  const weather = useWeatherTile(city, trip, at);
  if (!city) return { tiles: [], currency: null, live: null, holiday: false, weather: false };
  const tiles = widgetTiles({
    currency: city.currency,
    timeZone: city.timezone,
    home: trip.home_currency,
    rates: trip.exchange_rates,
    at,
    live,
    weather,
    holidays,
    start: trip.start_date,
    today: todayISO(),
  });
  return {
    tiles,
    currency: city.currency,
    live,
    holiday: tiles.some((t) => t.key === "holiday"),
    weather: weather !== null,
  };
}
