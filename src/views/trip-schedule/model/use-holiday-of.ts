import { useTripHolidays } from "@/entities/city";
import type { Trip } from "@/entities/trip";
import { holidayName } from "@/shared/lib/country-holidays";
import { dayIndexToDate } from "@/shared/lib/days";

/** 그 날(0-base)의 여행지 공휴일 이름을 돌려주는 함수. 공휴일이 아니거나 아직 모르면 null */
export function useHolidayOf(tripId: string, trip: Trip | undefined) {
  const holidays = useTripHolidays(tripId, trip);
  return (day: number) =>
    trip && holidays ? holidayName(holidays, dayIndexToDate(trip.start_date, day)) : null;
}
