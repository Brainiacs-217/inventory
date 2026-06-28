export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      items: {
        Row: {
          base_unit: string;
          case_size: number | null;
          category: string;
          cost: number | null;
          cost_manually_edited: boolean | null;
          created_at: string | null;
          gl_code: string | null;
          id: string;
          is_active: boolean | null;
          last_counted_at: string | null;
          name: string;
          notes: string | null;
          on_hand: number | null;
          organization_id: string;
          par_level: number | null;
          price: number;
          reporting_unit: string;
          sku: string | null;
          unit_name: string;
          unit_of_measure: string;
          unit_size: number;
          updated_at: string | null;
          vendor: string | null;
        };
        Insert: {
          base_unit: string;
          case_size?: number | null;
          category: string;
          cost?: number | null;
          cost_manually_edited?: boolean | null;
          created_at?: string | null;
          gl_code?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_counted_at?: string | null;
          name: string;
          notes?: string | null;
          on_hand?: number | null;
          organization_id: string;
          par_level?: number | null;
          price?: number;
          reporting_unit: string;
          sku?: string | null;
          unit_name: string;
          unit_of_measure: string;
          unit_size?: number;
          updated_at?: string | null;
          vendor?: string | null;
        };
        Update: {
          base_unit?: string;
          case_size?: number | null;
          category?: string;
          cost?: number | null;
          cost_manually_edited?: boolean | null;
          created_at?: string | null;
          gl_code?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_counted_at?: string | null;
          name?: string;
          notes?: string | null;
          on_hand?: number | null;
          organization_id?: string;
          par_level?: number | null;
          price?: number;
          reporting_unit?: string;
          sku?: string | null;
          unit_name?: string;
          unit_of_measure?: string;
          unit_size?: number;
          updated_at?: string | null;
          vendor?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_check_lines: {
        Row: {
          check_id: string;
          counted_qty: number;
          id: string;
          item_id: string;
          previous_on_hand: number;
        };
        Insert: {
          check_id: string;
          counted_qty: number;
          id?: string;
          item_id: string;
          previous_on_hand: number;
        };
        Update: {
          check_id?: string;
          counted_qty?: number;
          id?: string;
          item_id?: string;
          previous_on_hand?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_check_lines_check_id_fkey";
            columns: ["check_id"];
            isOneToOne: false;
            referencedRelation: "inventory_checks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_check_lines_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_checks: {
        Row: {
          id: string;
          organization_id: string;
          room_id: string;
          saved_at: string;
          saved_by: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          room_id: string;
          saved_at?: string;
          saved_by?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          room_id?: string;
          saved_at?: string;
          saved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_checks_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_checks_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "storage_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_checks_saved_by_fkey";
            columns: ["saved_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          created_at: string | null;
          id: string;
          organization_id: string;
          profile_id: string;
          role: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          organization_id: string;
          profile_id: string;
          role?: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          organization_id?: string;
          profile_id?: string;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          logo_url: string | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          logo_url?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          item_id: string;
          quantity: number;
          recipe_id: string;
          sort_order: number;
          unit: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          quantity: number;
          recipe_id: string;
          sort_order?: number;
          unit: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          quantity?: number;
          recipe_id?: string;
          sort_order?: number;
          unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          created_at: string;
          food_cost: number;
          id: string;
          misc_cost: number;
          name: string;
          organization_id: string;
          sales_price: number;
          serving_size_quantity: number | null;
          serving_size_unit: string | null;
          updated_at: string;
          yield_quantity: number | null;
          yield_unit: string | null;
        };
        Insert: {
          created_at?: string;
          food_cost?: number;
          id?: string;
          misc_cost?: number;
          name: string;
          organization_id: string;
          sales_price?: number;
          serving_size_quantity?: number | null;
          serving_size_unit?: string | null;
          updated_at?: string;
          yield_quantity?: number | null;
          yield_unit?: string | null;
        };
        Update: {
          created_at?: string;
          food_cost?: number;
          id?: string;
          misc_cost?: number;
          name?: string;
          organization_id?: string;
          sales_price?: number;
          serving_size_quantity?: number | null;
          serving_size_unit?: string | null;
          updated_at?: string;
          yield_quantity?: number | null;
          yield_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recipes_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      storage_room_items: {
        Row: {
          item_id: string;
          room_id: string;
        };
        Insert: {
          item_id: string;
          room_id: string;
        };
        Update: {
          item_id?: string;
          room_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "storage_room_items_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "storage_room_items_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "storage_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      storage_rooms: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          organization_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          organization_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          organization_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "storage_rooms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
