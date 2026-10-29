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
          default_avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          default_avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          default_avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          day_summaries: (string | null)[];
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
          day_summaries?: (string | null)[];
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
          day_summaries?: (string | null)[];
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
          address_local: string | null;
          address_ko: string | null;
          address_detail: string | null;
          category: string | null;
          emoji: string | null;
          rating: number | null;
          review_count: number | null;
          wait: string | null;
          description: string | null;
          hours: string | null;
          hours_week: Json | null;
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
          address_local?: string | null;
          address_ko?: string | null;
          address_detail?: string | null;
          category?: string | null;
          emoji?: string | null;
          rating?: number | null;
          review_count?: number | null;
          wait?: string | null;
          description?: string | null;
          hours?: string | null;
          hours_week?: Json | null;
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
          address_local?: string | null;
          address_ko?: string | null;
          address_detail?: string | null;
          category?: string | null;
          emoji?: string | null;
          rating?: number | null;
          review_count?: number | null;
          wait?: string | null;
          description?: string | null;
          hours?: string | null;
          hours_week?: Json | null;
          gmap_url?: string | null;
          links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stays: {
        Row: {
          id: string;
          trip_id: string;
          place_id: string;
          emoji: string | null;
          status: string | null;
          check_in_date: string;
          check_out_date: string;
          check_in_time: string | null;
          check_out_time: string | null;
          memo: string | null;
          links: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          place_id: string;
          emoji?: string | null;
          status?: string | null;
          check_in_date: string;
          check_out_date: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          memo?: string | null;
          links?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          place_id?: string;
          emoji?: string | null;
          status?: string | null;
          check_in_date?: string;
          check_out_date?: string;
          check_in_time?: string | null;
          check_out_time?: string | null;
          memo?: string | null;
          links?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stays_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      checklist_items: {
        Row: {
          id: string;
          trip_id: string;
          status: string;
          title: string;
          due_date: string | null;
          body: string;
          links: Json;
          pinned_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          status?: string;
          title: string;
          due_date?: string | null;
          body?: string;
          links?: Json;
          pinned_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          status?: string;
          title?: string;
          due_date?: string | null;
          body?: string;
          links?: Json;
          pinned_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pack_groups: {
        Row: {
          id: string;
          trip_id: string;
          kind: string;
          name: string;
          position: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          kind: string;
          name: string;
          position?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          kind?: string;
          name?: string;
          position?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pack_items: {
        Row: {
          id: string;
          trip_id: string;
          group_id: string;
          name: string;
          memo: string;
          position: number;
          checked_at: string | null;
          checked_by: string | null;
          photo_key: string | null;
          thumb_key: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          group_id: string;
          name: string;
          memo?: string;
          position?: number;
          checked_at?: string | null;
          checked_by?: string | null;
          photo_key?: string | null;
          thumb_key?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          group_id?: string;
          name?: string;
          memo?: string;
          position?: number;
          checked_at?: string | null;
          checked_by?: string | null;
          photo_key?: string | null;
          thumb_key?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      checklist_targets: {
        Row: {
          id: string;
          trip_id: string;
          item_id: string;
          schedule_item_id: string | null;
          flight_id: string | null;
          stay_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          item_id: string;
          schedule_item_id?: string | null;
          flight_id?: string | null;
          stay_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          item_id?: string;
          schedule_item_id?: string | null;
          flight_id?: string | null;
          stay_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      vouchers: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          file_key: string | null;
          file_name: string | null;
          file_mime: string | null;
          file_size: number | null;
          pages: string;
          page_keys: string[];
          thumb_key: string | null;
          owners: string[];
          numbers: Json;
          schedule_item_id: string | null;
          flight_id: string | null;
          stay_id: string | null;
          use_date: string | null;
          site_title: string;
          site_url: string;
          memo: string;
          pinned_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          file_key?: string | null;
          file_name?: string | null;
          file_mime?: string | null;
          file_size?: number | null;
          pages?: string;
          page_keys?: string[];
          thumb_key?: string | null;
          owners?: string[];
          numbers?: Json;
          schedule_item_id?: string | null;
          flight_id?: string | null;
          stay_id?: string | null;
          use_date?: string | null;
          site_title?: string;
          site_url?: string;
          memo?: string;
          pinned_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          title?: string;
          file_key?: string | null;
          file_name?: string | null;
          file_mime?: string | null;
          file_size?: number | null;
          pages?: string;
          page_keys?: string[];
          thumb_key?: string | null;
          owners?: string[];
          numbers?: Json;
          schedule_item_id?: string | null;
          flight_id?: string | null;
          stay_id?: string | null;
          use_date?: string | null;
          site_title?: string;
          site_url?: string;
          memo?: string;
          pinned_by?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      flights: {
        Row: {
          id: string;
          trip_id: string;
          airline_name: string;
          airline_code: string;
          flight_no: string;
          dep_airport: string;
          arr_airport: string;
          dep_date: string;
          dep_time: string;
          arr_date: string;
          arr_time: string;
          status: string | null;
          booking_ref: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          airline_name: string;
          airline_code: string;
          flight_no: string;
          dep_airport: string;
          arr_airport: string;
          dep_date: string;
          dep_time: string;
          arr_date: string;
          arr_time: string;
          status?: string | null;
          booking_ref?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          airline_name?: string;
          airline_code?: string;
          flight_no?: string;
          dep_airport?: string;
          arr_airport?: string;
          dep_date?: string;
          dep_time?: string;
          arr_date?: string;
          arr_time?: string;
          status?: string | null;
          booking_ref?: string | null;
          created_by?: string | null;
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
          alternative_of: string | null;
          stay_id: string | null;
          flight_id: string | null;
          links: Json;
          created_by: string | null;
          pinned_by: string | null;
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
          alternative_of?: string | null;
          stay_id?: string | null;
          flight_id?: string | null;
          links?: Json;
          created_by?: string | null;
          pinned_by?: string | null;
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
          alternative_of?: string | null;
          stay_id?: string | null;
          flight_id?: string | null;
          links?: Json;
          created_by?: string | null;
          pinned_by?: string | null;
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
      memos: {
        Row: {
          id: string;
          trip_id: string;
          schedule_item_id: string;
          author_id: string | null;
          body: string;
          starred: boolean;
          pinned_by: string | null;
          links: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          schedule_item_id: string;
          author_id?: string | null;
          body: string;
          starred?: boolean;
          pinned_by?: string | null;
          links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          schedule_item_id?: string;
          author_id?: string | null;
          body?: string;
          starred?: boolean;
          pinned_by?: string | null;
          links?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          stay_id: string | null;
          flight_id: string | null;
          payer_id: string | null;
          payer_guest_id: string | null;
          split_each: boolean;
          amount: number;
          currency: string;
          category: string;
          name: string;
          memo: string | null;
          spent_on: string | null;
          payment_method: string;
          rate: number | null;
          counted: boolean;
          paid: boolean;
          due_date: string | null;
          split_mode: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          schedule_item_id?: string | null;
          stay_id?: string | null;
          flight_id?: string | null;
          payer_id?: string | null;
          payer_guest_id?: string | null;
          split_each?: boolean;
          amount: number;
          currency: string;
          category?: string;
          name: string;
          memo?: string | null;
          spent_on?: string | null;
          payment_method?: string;
          rate?: number | null;
          counted?: boolean;
          paid?: boolean;
          due_date?: string | null;
          split_mode?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          schedule_item_id?: string | null;
          stay_id?: string | null;
          flight_id?: string | null;
          payer_id?: string | null;
          payer_guest_id?: string | null;
          split_each?: boolean;
          amount?: number;
          currency?: string;
          category?: string;
          name?: string;
          memo?: string | null;
          spent_on?: string | null;
          payment_method?: string;
          rate?: number | null;
          counted?: boolean;
          paid?: boolean;
          due_date?: string | null;
          split_mode?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          trip_id: string;
          user_id: string | null;
          guest_id: string | null;
          share: number;
        };
        Insert: {
          id?: string;
          expense_id: string;
          // 트리거(set_expense_split_trip)가 비용에서 채운다 — 넣지 않는다
          trip_id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          share: number;
        };
        Update: {
          id?: string;
          expense_id?: string;
          trip_id?: string;
          user_id?: string | null;
          guest_id?: string | null;
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
      trip_guests: {
        Row: {
          id: string;
          trip_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          trip_id: string;
          from_user_id: string | null;
          from_guest_id: string | null;
          to_user_id: string | null;
          to_guest_id: string | null;
          amount: number;
          settled_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_user_id?: string | null;
          from_guest_id?: string | null;
          to_user_id?: string | null;
          to_guest_id?: string | null;
          amount: number;
          settled_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          from_user_id?: string | null;
          from_guest_id?: string | null;
          to_user_id?: string | null;
          to_guest_id?: string | null;
          amount?: number;
          settled_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      expense_receipts: {
        Row: {
          id: string;
          expense_id: string;
          trip_id: string;
          key: string;
          name: string;
          mime: string;
          size: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          expense_id: string;
          trip_id: string;
          key: string;
          name: string;
          mime: string;
          size: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          expense_id?: string;
          trip_id?: string;
          key?: string;
          name?: string;
          mime?: string;
          size?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
      save_stay: {
        Args: {
          p_trip: string;
          p_stay: string | null;
          p_place: Json;
          p_fields: Json;
          p_prune?: boolean;
          p_link_item?: string | null;
        };
        Returns: Json;
      };
      save_flight: {
        Args: { p_trip: string; p_flight: string | null; p_fields: Json };
        Returns: Json;
      };
      add_pack_groups: {
        Args: { p_trip: string; p_kind: string; p_groups: Json };
        Returns: undefined;
      };
      save_checklist_item: {
        Args: {
          p_trip: string;
          p_id: string | null;
          p_fields: Json;
          p_add?: Json;
          p_remove?: Json;
        };
        Returns: string;
      };
      delete_stay: {
        Args: { p_stay: string; p_delete_cards: boolean };
        Returns: number;
      };
      create_place_schedule: {
        Args: { p_trip: string; p_day: number; p_place: Json; p_item: Json };
        Returns: string;
      };
      apply_schedule_edit: {
        Args: { p_trip: string; p_days: Json; p_deletes: string[]; p_summaries: Json };
        Returns: undefined;
      };
      merge_trip_guest: {
        Args: { p_guest: string; p_user: string };
        Returns: undefined;
      };
      swap_alternative: {
        Args: { p_alt: string };
        Returns: undefined;
      };
      place_city_for_trip: {
        Args: { p_trip: string; p_lat: number | null; p_lng: number | null };
        Returns: string | null;
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
      add_trip_currency: {
        Args: {
          p_trip_id: string;
          p_home: string;
          p_code: string;
          p_unit: number;
          p_value: number;
        };
        Returns: undefined;
      };
      set_trip_rate: {
        Args: {
          p_trip_id: string;
          p_home: string;
          p_code: string;
          p_unit: number;
          p_value: number;
        };
        Returns: undefined;
      };
      set_trip_cities: {
        Args: { p_trip_id: string; p_city_ids: string[] };
        Returns: undefined;
      };
      change_home_currency: {
        Args: {
          p_trip_id: string;
          p_from: string;
          p_currency: string;
          p_rates: Json;
          p_factor: number;
        };
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
      keys_in_trip: {
        Args: { p_keys: string[]; p_trip: string };
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
