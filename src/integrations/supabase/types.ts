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
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_channels: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_locked: boolean
          name: string
          order_index: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          name: string
          order_index?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_locked?: boolean
          name?: string
          order_index?: number
        }
        Relationships: []
      }
      community_likes: {
        Row: {
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      community_messages: {
        Row: {
          channel_id: string | null
          content: string
          created_at: string
          id: string
          is_thread_root: boolean
          likes_count: number
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_thread_root?: boolean
          likes_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_thread_root?: boolean
          likes_count?: number
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "community_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conditioning_sets: {
        Row: {
          avg_heart_rate: number | null
          calories: number | null
          created_at: string
          distance: number | null
          distance_unit: string | null
          duration_seconds: number | null
          exercise_id: string
          id: string
          is_completed: boolean | null
          set_number: number
        }
        Insert: {
          avg_heart_rate?: number | null
          calories?: number | null
          created_at?: string
          distance?: number | null
          distance_unit?: string | null
          duration_seconds?: number | null
          exercise_id: string
          id?: string
          is_completed?: boolean | null
          set_number?: number
        }
        Update: {
          avg_heart_rate?: number | null
          calories?: number | null
          created_at?: string
          distance?: number | null
          distance_unit?: string | null
          duration_seconds?: number | null
          exercise_id?: string
          id?: string
          is_completed?: boolean | null
          set_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "conditioning_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean
          to_user_id?: string
        }
        Relationships: []
      }
      exercise_library: {
        Row: {
          category: string
          created_at: string
          id: string
          muscle_group: string | null
          name: string
          notes: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          muscle_group?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          muscle_group?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      exercise_sets: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_completed: boolean | null
          reps: number | null
          rpe: number | null
          set_number: number
          weight: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_completed?: boolean | null
          reps?: number | null
          rpe?: number | null
          set_number?: number
          weight?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_completed?: boolean | null
          reps?: number | null
          rpe?: number | null
          set_number?: number
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          exercise_name: string
          id: string
          max_reps: number | null
          max_weight: number
          set_id: string | null
          user_id: string
          workout_id: string | null
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          exercise_name: string
          id?: string
          max_reps?: number | null
          max_weight: number
          set_id?: string | null
          user_id: string
          workout_id?: string | null
        }
        Update: {
          achieved_at?: string
          created_at?: string
          exercise_name?: string
          id?: string
          max_reps?: number | null
          max_weight?: number
          set_id?: string | null
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "exercise_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      program_workouts: {
        Row: {
          created_at: string
          day_number: number
          exercises: Json
          id: string
          notes: string | null
          program_id: string
          week_number: number
          workout_name: string
        }
        Insert: {
          created_at?: string
          day_number: number
          exercises?: Json
          id?: string
          notes?: string | null
          program_id: string
          week_number: number
          workout_name: string
        }
        Update: {
          created_at?: string
          day_number?: number
          exercises?: Json
          id?: string
          notes?: string | null
          program_id?: string
          week_number?: number
          workout_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_workouts_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category: string
          created_at: string
          days_per_week: number
          description: string
          difficulty: string
          duration_weeks: number
          id: string
          is_active: boolean
          name: string
          program_style: string | null
          slug: string
          video_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          days_per_week: number
          description: string
          difficulty?: string
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name: string
          program_style?: string | null
          slug: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          days_per_week?: number
          description?: string
          difficulty?: string
          duration_weeks?: number
          id?: string
          is_active?: boolean
          name?: string
          program_style?: string | null
          slug?: string
          video_url?: string | null
        }
        Relationships: []
      }
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
      user_calendar_workouts: {
        Row: {
          completed_at: string | null
          created_at: string
          enrollment_id: string
          id: string
          is_completed: boolean
          program_workout_id: string
          scheduled_date: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          is_completed?: boolean
          program_workout_id: string
          scheduled_date: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          is_completed?: boolean
          program_workout_id?: string
          scheduled_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_workouts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "user_program_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_calendar_workouts_program_workout_id_fkey"
            columns: ["program_workout_id"]
            isOneToOne: false
            referencedRelation: "program_workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_checkins: {
        Row: {
          check_date: string
          created_at: string
          drive_score: number
          energy_score: number
          id: string
          notes: string | null
          sleep_score: number
          stress_score: number
          user_id: string
        }
        Insert: {
          check_date?: string
          created_at?: string
          drive_score: number
          energy_score: number
          id?: string
          notes?: string | null
          sleep_score: number
          stress_score: number
          user_id: string
        }
        Update: {
          check_date?: string
          created_at?: string
          drive_score?: number
          energy_score?: number
          id?: string
          notes?: string | null
          sleep_score?: number
          stress_score?: number
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          achieved_at: string | null
          created_at: string
          current_value: number
          exercise_name: string | null
          goal_type: string
          id: string
          start_value: number
          status: string
          target_date: string
          target_value: number
          title: string
          unit: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string
          current_value: number
          exercise_name?: string | null
          goal_type: string
          id?: string
          start_value: number
          status?: string
          target_date: string
          target_value: number
          title: string
          unit?: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string
          current_value?: number
          exercise_name?: string | null
          goal_type?: string
          id?: string
          start_value?: number
          status?: string
          target_date?: string
          target_value?: number
          title?: string
          unit?: string
          user_id?: string
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
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          is_coach: boolean
          notification_preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          is_coach?: boolean
          notification_preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_coach?: boolean
          notification_preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_program_enrollments: {
        Row: {
          addon_placement: string | null
          created_at: string
          id: string
          program_id: string
          start_date: string
          status: string
          training_days: number[]
          user_id: string
        }
        Insert: {
          addon_placement?: string | null
          created_at?: string
          id?: string
          program_id: string
          start_date: string
          status?: string
          training_days?: number[]
          user_id: string
        }
        Update: {
          addon_placement?: string | null
          created_at?: string
          id?: string
          program_id?: string
          start_date?: string
          status?: string
          training_days?: number[]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
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
          is_featured: boolean
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
          is_featured?: boolean
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
          is_featured?: boolean
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
          is_featured: boolean
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
          is_featured?: boolean
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
          is_featured?: boolean
          is_premium?: boolean
          leak_tags?: string[] | null
          pages?: number | null
          title?: string
          type?: Database["public"]["Enums"]["resource_type"]
          updated_at?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_name: string
          exercise_type: string | null
          id: string
          notes: string | null
          order_index: number
          workout_id: string
        }
        Insert: {
          created_at?: string
          exercise_name: string
          exercise_type?: string | null
          id?: string
          notes?: string | null
          order_index?: number
          workout_id: string
        }
        Update: {
          created_at?: string
          exercise_name?: string
          exercise_type?: string | null
          id?: string
          notes?: string | null
          order_index?: number
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          id: string
          is_completed: boolean | null
          notes: string | null
          total_volume: number | null
          updated_at: string
          user_id: string
          workout_name: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          total_volume?: number | null
          updated_at?: string
          user_id: string
          workout_name: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          total_volume?: number | null
          updated_at?: string
          user_id?: string
          workout_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_wearable_connections_safe: {
        Row: {
          created_at: string | null
          device_type: Database["public"]["Enums"]["wearable_device"] | null
          external_user_id: string | null
          id: string | null
          is_connected: boolean | null
          last_sync_at: string | null
          sync_error: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["wearable_device"] | null
          external_user_id?: string | null
          id?: string | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          sync_error?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["wearable_device"] | null
          external_user_id?: string | null
          id?: string | null
          is_connected?: boolean | null
          last_sync_at?: string | null
          sync_error?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      resource_category: "training" | "nutrition" | "lifestyle"
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
      resource_category: ["training", "nutrition", "lifestyle"],
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
