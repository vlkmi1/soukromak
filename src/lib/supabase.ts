import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      fishing_spots: {
        Row: {
          id: number;
          name: string;
          position_x: number;
          position_y: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          position_x: number;
          position_y: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          position_x?: number;
          position_y?: number;
          created_at?: string;
        };
      };
      spot_positions: {
        Row: {
          id: number;
          spot_id: number;
          position_number: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          spot_id: number;
          position_number: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          spot_id?: number;
          position_number?: number;
          created_at?: string;
        };
      };
      reservations: {
        Row: {
          id: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          reservation_date: string;
          status: "new" | "confirmed" | "paid" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          reservation_date: string;
          status?: "new" | "confirmed" | "paid" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          reservation_date?: string;
          status?: "new" | "confirmed" | "paid" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
      };
      reservation_positions: {
        Row: {
          id: number;
          reservation_id: number;
          position_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          reservation_id: number;
          position_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          reservation_id?: number;
          position_id?: number;
          created_at?: string;
        };
      };
    };
  };
};