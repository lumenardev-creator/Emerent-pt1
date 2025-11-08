export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      kiosk_inventory: {
        Row: {
          auto_request_enabled: boolean | null
          created_at: string | null
          id: string
          kiosk_id: string | null
          last_updated: string | null
          product_id: string | null
          quantity: number
          threshold: number | null
        }
        Insert: {
          auto_request_enabled?: boolean | null
          created_at?: string | null
          id?: string
          kiosk_id?: string | null
          last_updated?: string | null
          product_id?: string | null
          quantity?: number
          threshold?: number | null
        }
        Update: {
          auto_request_enabled?: boolean | null
          created_at?: string | null
          id?: string
          kiosk_id?: string | null
          last_updated?: string | null
          product_id?: string | null
          quantity?: number
          threshold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_inventory_kiosk_id_fkey"
            columns: ["kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosk_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosks: {
        Row: {
          address: string
          created_at: string
          email: string | null
          id: string
          kiosk_code: string
          last_activity: string | null
          manager_name: string | null
          name: string
          phone: string | null
          sku_count: number | null
          status: string | null
          total_items: number | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          id?: string
          kiosk_code: string
          last_activity?: string | null
          manager_name?: string | null
          name: string
          phone?: string | null
          sku_count?: number | null
          status?: string | null
          total_items?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          kiosk_code?: string
          last_activity?: string | null
          manager_name?: string | null
          name?: string
          phone?: string | null
          sku_count?: number | null
          status?: string | null
          total_items?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          change_amount: number | null
          change_percentage: number | null
          current_value: number
          id: string
          metric_type: string
          period: string | null
          previous_value: number | null
          recorded_at: string
        }
        Insert: {
          change_amount?: number | null
          change_percentage?: number | null
          current_value: number
          id?: string
          metric_type: string
          period?: string | null
          previous_value?: number | null
          recorded_at?: string
        }
        Update: {
          change_amount?: number | null
          change_percentage?: number | null
          current_value?: number
          id?: string
          metric_type?: string
          period?: string | null
          previous_value?: number | null
          recorded_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          acquired_date: string | null
          acquired_price: number | null
          created_at: string
          depletion_rate: string | null
          eligible_for_redistribution: boolean | null
          estimated_market_demand: string | null
          forecasted_daily_requirement: number | null
          id: string
          market_demand_distance: string | null
          mrp: number | null
          name: string
          normal_supply_level: number | null
          over_supply_limit: number | null
          quantity: number
          redistributable_quantity: number | null
          redistribution_cost: number | null
          redistribution_revenue: number | null
          sku: string
          status: string | null
          suggested_selling_price: number | null
          supply_level: number | null
          under_supply_limit: number | null
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          acquired_date?: string | null
          acquired_price?: number | null
          created_at?: string
          depletion_rate?: string | null
          eligible_for_redistribution?: boolean | null
          estimated_market_demand?: string | null
          forecasted_daily_requirement?: number | null
          id?: string
          market_demand_distance?: string | null
          mrp?: number | null
          name: string
          normal_supply_level?: number | null
          over_supply_limit?: number | null
          quantity?: number
          redistributable_quantity?: number | null
          redistribution_cost?: number | null
          redistribution_revenue?: number | null
          sku: string
          status?: string | null
          suggested_selling_price?: number | null
          supply_level?: number | null
          under_supply_limit?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          acquired_date?: string | null
          acquired_price?: number | null
          created_at?: string
          depletion_rate?: string | null
          eligible_for_redistribution?: boolean | null
          estimated_market_demand?: string | null
          forecasted_daily_requirement?: number | null
          id?: string
          market_demand_distance?: string | null
          mrp?: number | null
          name?: string
          normal_supply_level?: number | null
          over_supply_limit?: number | null
          quantity?: number
          redistributable_quantity?: number | null
          redistribution_cost?: number | null
          redistribution_revenue?: number | null
          sku?: string
          status?: string | null
          suggested_selling_price?: number | null
          supply_level?: number | null
          under_supply_limit?: number | null
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          kiosk_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kiosk_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          kiosk_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_kiosk_id_fkey"
            columns: ["kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
        ]
      }
      redistributions: {
        Row: {
          completed_at: string | null
          created_at: string
          from_kiosk_id: string | null
          id: string
          priority: string | null
          product_id: string | null
          quantity: number
          reason: string | null
          status: string | null
          to_kiosk_id: string | null
          unit: string
          value_recovered: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          from_kiosk_id?: string | null
          id?: string
          priority?: string | null
          product_id?: string | null
          quantity: number
          reason?: string | null
          status?: string | null
          to_kiosk_id?: string | null
          unit: string
          value_recovered?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          from_kiosk_id?: string | null
          id?: string
          priority?: string | null
          product_id?: string | null
          quantity?: number
          reason?: string | null
          status?: string | null
          to_kiosk_id?: string | null
          unit?: string
          value_recovered?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "redistributions_from_kiosk_id_fkey"
            columns: ["from_kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redistributions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redistributions_to_kiosk_id_fkey"
            columns: ["to_kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          blockchain_ref: string | null
          created_at: string
          from_kiosk_id: string | null
          id: string
          product_id: string | null
          quantity: number
          redistribution_id: string | null
          status: string | null
          to_kiosk_id: string | null
          tx_id: string
          unit: string
          value: number | null
        }
        Insert: {
          blockchain_ref?: string | null
          created_at?: string
          from_kiosk_id?: string | null
          id?: string
          product_id?: string | null
          quantity: number
          redistribution_id?: string | null
          status?: string | null
          to_kiosk_id?: string | null
          tx_id: string
          unit: string
          value?: number | null
        }
        Update: {
          blockchain_ref?: string | null
          created_at?: string
          from_kiosk_id?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          redistribution_id?: string | null
          status?: string | null
          to_kiosk_id?: string | null
          tx_id?: string
          unit?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_from_kiosk_id_fkey"
            columns: ["from_kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_redistribution_id_fkey"
            columns: ["redistribution_id"]
            isOneToOne: false
            referencedRelation: "redistributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_kiosk_id_fkey"
            columns: ["to_kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      signup_user_with_role: {
        Args: {
          user_email: string
          user_full_name: string
          user_password: string
          user_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "kiosk_user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "kiosk_user"],
    },
  },
} as const
