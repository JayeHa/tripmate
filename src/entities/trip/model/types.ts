import type { Tables } from "@/shared/api/supabase/database.types";
import type { ExchangeRates } from "@/shared/lib/money/types";

export type Trip = Omit<Tables<"trips">, "exchange_rates"> & { exchange_rates: ExchangeRates };
