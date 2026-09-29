export const queryKeys = {
  user: ["user"] as const,
  trips: {
    all: ["trips"] as const,
    detail: (tripId: string) => ["trips", tripId] as const,
    members: (tripId: string) => ["trips", tripId, "members"] as const,
  },
  scheduleItems: (tripId: string) => ["trips", tripId, "schedule-items"] as const,
  expenses: (tripId: string) => ["trips", tripId, "expenses"] as const,
  dayRoute: (tripId: string, dayIndex: number, mode: string) =>
    ["trips", tripId, "route", dayIndex, mode] as const,
};
