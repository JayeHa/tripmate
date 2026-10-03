import type { ExchangeRates } from "@/lib/money/types";
import type { Tables } from "@/lib/supabase/database.types";

export type Trip = Omit<Tables<"trips">, "exchange_rates"> & { exchange_rates: ExchangeRates };
