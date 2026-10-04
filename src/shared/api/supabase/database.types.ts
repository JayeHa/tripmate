// 스키마(supabase/migrations)에 맞춰 수동 작성.
// Supabase 프로젝트를 연결한 뒤 `pnpm db:types` 로 재생성하세요.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          destination: string | null;
          start_date: string;
          end_date: string;
          home_currency: string;
          exchange_rates: Json;
          invite_token: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          destination?: string | null;
          start_date: string;
          end_date: string;
          home_currency?: string;
          exchange_rates?: Json;
          invite_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          destination?: string | null;
          start_date?: string;
          end_date?: string;
          home_currency?: string;
          exchange_rates?: Json;
          invite_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trip_members: {
        Row: {
          trip_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "trip_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      city_regions: {
        Row: {
          id: string;
          name: string;
          position: number;
        };
        Insert: {
          id: string;
          name: string;
          position: number;
        };
        Update: {
          id?: string;
          name?: string;
          position?: number;
        };
        Relationships: [];
      };
      cities: {
        Row: {
          id: string;
          scope: "abroad" | "domestic";
          region_id: string | null;
          name: string;
          areas: string[];
          description: string | null;
          position: number;
          lat: number;
          lng: number;
          zoom: number;
          country_code: string;
          currency: string;
          timezone: string;
        };
        Insert: {
          id: string;
          scope: "abroad" | "domestic";
          region_id?: string | null;
          name: string;
          areas?: string[];
          description?: string | null;
          position: number;
          lat: number;
          lng: number;
          zoom?: number;
          country_code: string;
          currency: string;
          timezone: string;
        };
        Update: {
          id?: string;
          scope?: "abroad" | "domestic";
          region_id?: string | null;
          name?: string;
          areas?: string[];
          description?: string | null;
          position?: number;
          lat?: number;
          lng?: number;
          zoom?: number;
          country_code?: string;
          currency?: string;
          timezone?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cities_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "city_regions";
            referencedColumns: ["id"];
          },
        ];
      };
      trip_cities: {
        Row: {
          trip_id: string;
          city_id: string;
          position: number;
        };
        Insert: {
          trip_id: string;
          city_id: string;
          position?: number;
        };
        Update: {
          trip_id?: string;
          city_id?: string;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "trip_cities_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "trip_cities_city_id_fkey";
            columns: ["city_id"];
            isOneToOne: false;
            referencedRelation: "cities";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          id: string;
          city_id: string;
          created_by: string;
          name: string;
          google_place_id: string | null;
          lat: number | null;
          lng: number | null;
          address: string | null;
          category: string | null;
          emoji: string | null;
          rating: number | null;
          review_count: number | null;
          description: string | null;
          hours: string | null;
          gmap_url: string | null;
          links: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          city_id: string;
          created_by?: string;
          name: string;
          google_place_id?: string | null;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          category?: string | null;
          emoji?: string | null;
          rating?: number | null;
          review_count?: number | null;
          description?: string | null;
          hours?: string | null;
          gmap_url?: string | null;
          links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          created_by?: string;
          name?: string;
          google_place_id?: string | null;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          category?: string | null;
          emoji?: string | null;
          rating?: number | null;
          review_count?: number | null;
          description?: string | null;
          hours?: string | null;
          gmap_url?: string | null;
          links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      schedule_items: {
        Row: {
          id: string;
          trip_id: string;
          day_index: number;
          position: number;
          kind: string;
          place_id: string | null;
          name: string | null;
          description: string | null;
          emoji: string | null;
          start_time: string | null;
          status: string | null;
          memo: string | null;
          alternatives: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_index: number;
          position: number;
          kind?: string;
          place_id?: string | null;
          name?: string | null;
          description?: string | null;
          emoji?: string | null;
          start_time?: string | null;
          status?: string | null;
          memo?: string | null;
          alternatives?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_index?: number;
          position?: number;
          kind?: string;
          place_id?: string | null;
          name?: string | null;
          description?: string | null;
          emoji?: string | null;
          start_time?: string | null;
          status?: string | null;
          memo?: string | null;
          alternatives?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_items_place_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      moves: {
        Row: {
          id: string;
          trip_id: string;
          from_item_id: string;
          to_item_id: string;
          mode: string | null;
          detail: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_item_id: string;
          to_item_id: string;
          mode?: string | null;
          detail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          from_item_id?: string;
          to_item_id?: string;
          mode?: string | null;
          detail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      day_routes: {
        Row: {
          trip_id: string;
          day_index: number;
          travel_mode: string;
          items_hash: string;
          polyline: string;
          legs: Json;
          computed_at: string;
        };
        Insert: {
          trip_id: string;
          day_index: number;
          travel_mode?: string;
          items_hash: string;
          polyline: string;
          legs: Json;
          computed_at?: string;
        };
        Update: {
          trip_id?: string;
          day_index?: number;
          travel_mode?: string;
          items_hash?: string;
          polyline?: string;
          legs?: Json;
          computed_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          schedule_item_id: string | null;
          payer_id: string;
          amount: number;
          currency: string;
          category: string;
          memo: string | null;
          spent_on: string;
          split_mode: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          schedule_item_id?: string | null;
          payer_id: string;
          amount: number;
          currency: string;
          category?: string;
          memo?: string | null;
          spent_on: string;
          split_mode?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          schedule_item_id?: string | null;
          payer_id?: string;
          amount?: number;
          currency?: string;
          category?: string;
          memo?: string | null;
          spent_on?: string;
          split_mode?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_splits: {
        Row: {
          expense_id: string;
          user_id: string;
          share: number;
        };
        Insert: {
          expense_id: string;
          user_id: string;
          share: number;
        };
        Update: {
          expense_id?: string;
          user_id?: string;
          share?: number;
        };
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_trip_by_token: {
        Args: { p_token: string };
        Returns: string;
      };
      get_trip_preview: {
        Args: { p_token: string };
        Returns: {
          id: string;
          title: string;
          cities: string[];
          start_date: string;
          end_date: string;
          member_count: number;
        }[];
      };
      add_schedule_place: {
        Args: { p_trip: string; p_day: number; p_place: Json };
        Returns: string;
      };
      add_schedule_places: {
        Args: { p_trip: string; p_day: number; p_places: Json };
        Returns: string[];
      };
      can_attach_place: {
        Args: { p_place: string; p_trip: string };
        Returns: boolean;
      };
      create_trip: {
        Args: { p_title: string; p_start: string; p_end: string; p_city_ids: string[] };
        Returns: string;
      };
      update_trip_dates: {
        Args: { p_trip_id: string; p_start: string; p_end: string };
        Returns: undefined;
      };
      rotate_invite_token: {
        Args: { p_trip_id: string };
        Returns: string;
      };
      is_trip_member: {
        Args: { p_trip_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];
