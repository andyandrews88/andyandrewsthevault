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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      user_audit_data: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          results: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          results?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          results?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_body_entries: {
        Row: {
          bmi: number | null
          body_fat_percent: number | null
          bone_density: number | null
          chest_cm: number | null
          created_at: string
          entry_date: string
          fat_mass_kg: number | null
          height_cm: number | null
          hips_cm: number | null
          id: string
          lean_mass_kg: number | null
          left_arm_fat_percent: number | null
          left_bicep_cm: number | null
          left_calf_cm: number | null
          left_forearm_cm: number | null
          left_leg_fat_percent: number | null
          left_thigh_cm: number | null
          measurement_source:
            | Database["public"]["Enums"]["measurement_source"]
            | null
          neck_cm: number | null
          notes: string | null
          photo_path: string | null
          right_arm_fat_percent: number | null
          right_bicep_cm: number | null
          right_calf_cm: number | null
          right_forearm_cm: number | null
          right_leg_fat_percent: number | null
          right_thigh_cm: number | null
          shoulders_cm: number | null
          trunk_fat_percent: number | null
          updated_at: string
          user_id: string
          uses_imperial: boolean | null
          visceral_fat_rating: number | null
          waist_cm: number | null
          weight_kg: number | null
        }
        Insert: {
          bmi?: number | null
          body_fat_percent?: number | null
          bone_density?: number | null
          chest_cm?: number | null
          created_at?: string
          entry_date?: string
          fat_mass_kg?: number | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          left_arm_fat_percent?: number | null
          left_bicep_cm?: number | null
          left_calf_cm?: number | null
          left_forearm_cm?: number | null
          left_leg_fat_percent?: number | null
          left_thigh_cm?: number | null
          measurement_source?:
            | Database["public"]["Enums"]["measurement_source"]
            | null
          neck_cm?: number | null
          notes?: string | null
          photo_path?: string | null
          right_arm_fat_percent?: number | null
          right_bicep_cm?: number | null
          right_calf_cm?: number | null
          right_forearm_cm?: number | null
          right_leg_fat_percent?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          trunk_fat_percent?: number | null
          updated_at?: string
          user_id: string
          uses_imperial?: boolean | null
          visceral_fat_rating?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Update: {
          bmi?: number | null
          body_fat_percent?: number | null
          bone_density?: number | null
          chest_cm?: number | null
          created_at?: string
          entry_date?: string
          fat_mass_kg?: number | null
          height_cm?: number | null
          hips_cm?: number | null
          id?: string
          lean_mass_kg?: number | null
          left_arm_fat_percent?: number | null
          left_bicep_cm?: number | null
          left_calf_cm?: number | null
          left_forearm_cm?: number | null
          left_leg_fat_percent?: number | null
          left_thigh_cm?: number | null
          measurement_source?:
            | Database["public"]["Enums"]["measurement_source"]
            | null
          neck_cm?: number | null
          notes?: string | null
          photo_path?: string | null
          right_arm_fat_percent?: number | null
          right_bicep_cm?: number | null
          right_calf_cm?: number | null
          right_forearm_cm?: number | null
          right_leg_fat_percent?: number | null
          right_thigh_cm?: number | null
          shoulders_cm?: number | null
          trunk_fat_percent?: number | null
          updated_at?: string
          user_id?: string
          uses_imperial?: boolean | null
          visceral_fat_rating?: number | null
          waist_cm?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_meals: {
        Row: {
          created_at: string
          foods: Json
          id: string
          name: string
          totals: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          foods?: Json
          id?: string
          name: string
          totals?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          foods?: Json
          id?: string
          name?: string
          totals?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_nutrition_data: {
        Row: {
          activity: Json | null
          biometrics: Json | null
          created_at: string
          dietary: Json | null
          goals: Json | null
          id: string
          results: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity?: Json | null
          biometrics?: Json | null
          created_at?: string
          dietary?: Json | null
          goals?: Json | null
          id?: string
          results?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity?: Json | null
          biometrics?: Json | null
          created_at?: string
          dietary?: Json | null
          goals?: Json | null
          id?: string
          results?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          trial_started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          trial_started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wearable_connections: {
        Row: {
          access_token: string | null
          created_at: string
          device_type: Database["public"]["Enums"]["wearable_device"]
          external_user_id: string | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_error: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          device_type: Database["public"]["Enums"]["wearable_device"]
          external_user_id?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          device_type?: Database["public"]["Enums"]["wearable_device"]
          external_user_id?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_error?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_wearable_data: {
        Row: {
          device_type: Database["public"]["Enums"]["wearable_device"]
          id: string
          metric_type: Database["public"]["Enums"]["wearable_metric"]
          recorded_at: string
          synced_at: string
          user_id: string
          value: number
        }
        Insert: {
          device_type: Database["public"]["Enums"]["wearable_device"]
          id?: string
          metric_type: Database["public"]["Enums"]["wearable_metric"]
          recorded_at: string
          synced_at?: string
          user_id: string
          value: number
        }
        Update: {
          device_type?: Database["public"]["Enums"]["wearable_device"]
          id?: string
          metric_type?: Database["public"]["Enums"]["wearable_metric"]
          recorded_at?: string
          synced_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      vault_podcasts: {
        Row: {
          apple_url: string | null
          created_at: string
          description: string
          duration: string | null
          episode_number: number | null
          id: string
          is_premium: boolean
          published_at: string | null
          spotify_url: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          apple_url?: string | null
          created_at?: string
          description: string
          duration?: string | null
          episode_number?: number | null
          id?: string
          is_premium?: boolean
          published_at?: string | null
          spotify_url?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          apple_url?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          episode_number?: number | null
          id?: string
          is_premium?: boolean
          published_at?: string | null
          spotify_url?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: []
      }
      vault_resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          content: string | null
          created_at: string
          description: string
          duration: string | null
          embed_url: string | null
          file_path: string | null
          id: string
          is_premium: boolean
          leak_tags: string[] | null
          pages: number | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          content?: string | null
          created_at?: string
          description: string
          duration?: string | null
          embed_url?: string | null
          file_path?: string | null
          id?: string
          is_premium?: boolean
          leak_tags?: string[] | null
          pages?: number | null
          title: string
          type: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          content?: string | null
          created_at?: string
          description?: string
          duration?: string | null
          embed_url?: string | null
          file_path?: string | null
          id?: string
          is_premium?: boolean
          leak_tags?: string[] | null
          pages?: number | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      measurement_source:
        | "scale"
        | "calipers"
        | "bioimpedance"
        | "dexa"
        | "inbody"
        | "bodpod"
        | "navy_method"
        | "visual_estimate"
        | "other"
      resource_category: "physics" | "physiology" | "process"
      resource_type:
        | "youtube"
        | "vimeo"
        | "spotify"
        | "apple_podcast"
        | "article"
        | "pdf"
      subscription_status: "trial" | "active" | "expired" | "cancelled"
      wearable_device: "whoop" | "garmin" | "fitbit" | "apple_health"
      wearable_metric:
        | "recovery_score"
        | "strain_score"
        | "hrv"
        | "resting_heart_rate"
        | "sleep_score"
        | "sleep_duration"
        | "respiratory_rate"
        | "steps"
        | "active_minutes"
        | "heart_rate_avg"
        | "vo2_max"
        | "training_load"
        | "body_battery"
        | "stress_level"
        | "cardio_fitness"
        | "stand_hours"
        | "calories_burned"
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
      app_role: ["admin", "moderator", "user"],
      measurement_source: [
        "scale",
        "calipers",
        "bioimpedance",
        "dexa",
        "inbody",
        "bodpod",
        "navy_method",
        "visual_estimate",
        "other",
      ],
      resource_category: ["physics", "physiology", "process"],
      resource_type: [
        "youtube",
        "vimeo",
        "spotify",
        "apple_podcast",
        "article",
        "pdf",
      ],
      subscription_status: ["trial", "active", "expired", "cancelled"],
      wearable_device: ["whoop", "garmin", "fitbit", "apple_health"],
      wearable_metric: [
        "recovery_score",
        "strain_score",
        "hrv",
        "resting_heart_rate",
        "sleep_score",
        "sleep_duration",
        "respiratory_rate",
        "steps",
        "active_minutes",
        "heart_rate_avg",
        "vo2_max",
        "training_load",
        "body_battery",
        "stress_level",
        "cardio_fitness",
        "stand_hours",
        "calories_burned",
      ],
    },
  },
} as const
