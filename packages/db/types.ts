export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      acwr_logs: {
        Row: {
          acute_load: number | null
          acwr_ratio: number | null
          athlete_id: string
          chronic_load: number | null
          created_at: string | null
          duration_min: number | null
          id: string
          log_date: string
          notes: string | null
          session_load: number | null
          session_rpe: number | null
        }
        Insert: {
          acute_load?: number | null
          acwr_ratio?: number | null
          athlete_id: string
          chronic_load?: number | null
          created_at?: string | null
          duration_min?: number | null
          id?: string
          log_date: string
          notes?: string | null
          session_load?: number | null
          session_rpe?: number | null
        }
        Update: {
          acute_load?: number | null
          acwr_ratio?: number | null
          athlete_id?: string
          chronic_load?: number | null
          created_at?: string | null
          duration_min?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          session_load?: number | null
          session_rpe?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acwr_logs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_push_tokens: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          platform: string | null
          token: string
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          platform?: string | null
          token: string
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          platform?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_push_tokens_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          full_name: string
          gender: string | null
          height_cm: number | null
          id: string
          is_active: boolean | null
          notes: string | null
          org_id: string
          position: string | null
          team_id: string
          updated_at: string | null
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          org_id: string
          position?: string | null
          team_id: string
          updated_at?: string | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          full_name?: string
          gender?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          org_id?: string
          position?: string | null
          team_id?: string
          updated_at?: string | null
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athletes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athletes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_results: {
        Row: {
          athlete_id: string
          competition_id: string
          event: string | null
          id: string
          notes: string | null
          rank: number | null
          score: number | null
        }
        Insert: {
          athlete_id: string
          competition_id: string
          event?: string | null
          id?: string
          notes?: string | null
          rank?: number | null
          score?: number | null
        }
        Update: {
          athlete_id?: string
          competition_id?: string
          event?: string | null
          id?: string
          notes?: string | null
          rank?: number | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_results_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          competition_date: string | null
          id: string
          level: string | null
          location: string | null
          name: string
          notes: string | null
          org_id: string
          team_id: string | null
        }
        Insert: {
          competition_date?: string | null
          id?: string
          level?: string | null
          location?: string | null
          name: string
          notes?: string | null
          org_id: string
          team_id?: string | null
        }
        Update: {
          competition_date?: string | null
          id?: string
          level?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "competitions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category: string | null
          duration_sec: number | null
          id: string
          load_kg: number | null
          load_percent: number | null
          name: string
          notes: string | null
          order_index: number | null
          reps: number | null
          rest_sec: number | null
          session_id: string
          sets: number | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          duration_sec?: number | null
          id?: string
          load_kg?: number | null
          load_percent?: number | null
          name: string
          notes?: string | null
          order_index?: number | null
          reps?: number | null
          rest_sec?: number | null
          session_id: string
          sets?: number | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          duration_sec?: number | null
          id?: string
          load_kg?: number | null
          load_percent?: number | null
          name?: string
          notes?: string | null
          order_index?: number | null
          reps?: number | null
          rest_sec?: number | null
          session_id?: string
          sets?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          org_id: string
          role: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id: string
          role: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          org_id?: string
          role?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      polar_sync_state: {
        Row: {
          athlete_id: string
          id: string
          last_synced_at: string | null
          last_tx_id: string | null
          resource_type: string | null
        }
        Insert: {
          athlete_id: string
          id?: string
          last_synced_at?: string | null
          last_tx_id?: string | null
          resource_type?: string | null
        }
        Update: {
          athlete_id?: string
          id?: string
          last_synced_at?: string | null
          last_tx_id?: string | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polar_sync_state_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          discipline: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string | null
          discipline?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string | null
          discipline?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          athlete_id: string
          created_at: string | null
          id: string
          notes: string | null
          test_date: string
          test_type: string
          unit: string | null
          value: number | null
        }
        Insert: {
          athlete_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          test_date: string
          test_type: string
          unit?: string | null
          value?: number | null
        }
        Update: {
          athlete_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          test_date?: string
          test_type?: string
          unit?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          athlete_id: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          is_published: boolean | null
          notes: string | null
          org_id: string
          phase: string | null
          start_date: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          week_number: number | null
        }
        Insert: {
          athlete_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean | null
          notes?: string | null
          org_id: string
          phase?: string | null
          start_date?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          week_number?: number | null
        }
        Update: {
          athlete_id?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean | null
          notes?: string | null
          org_id?: string
          phase?: string | null
          start_date?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          day_of_week: number | null
          description: string | null
          duration_min: number | null
          id: string
          order_index: number | null
          program_id: string
          session_type: string | null
          title: string | null
        }
        Insert: {
          day_of_week?: number | null
          description?: string | null
          duration_min?: number | null
          id?: string
          order_index?: number | null
          program_id: string
          session_type?: string | null
          title?: string | null
        }
        Update: {
          day_of_week?: number | null
          description?: string | null
          duration_min?: number | null
          id?: string
          order_index?: number | null
          program_id?: string
          session_type?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_connections: {
        Row: {
          access_token: string
          athlete_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          scopes: string[] | null
          token_expires_at: string | null
        }
        Insert: {
          access_token: string
          athlete_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
        }
        Update: {
          access_token?: string
          athlete_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          scopes?: string[] | null
          token_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_connections_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_daily_metrics: {
        Row: {
          active_calories: number | null
          athlete_id: string
          created_at: string | null
          deep_sleep_min: number | null
          hrv_rmssd: number | null
          id: string
          metric_date: string
          muscle_load: number | null
          provider: string
          raw_data: Json | null
          recovery_score: number | null
          rem_sleep_min: number | null
          resting_hr: number | null
          sleep_efficiency: number | null
          sleep_score: number | null
          spo2: number | null
          strain_score: number | null
          total_sleep_min: number | null
        }
        Insert: {
          active_calories?: number | null
          athlete_id: string
          created_at?: string | null
          deep_sleep_min?: number | null
          hrv_rmssd?: number | null
          id?: string
          metric_date: string
          muscle_load?: number | null
          provider: string
          raw_data?: Json | null
          recovery_score?: number | null
          rem_sleep_min?: number | null
          resting_hr?: number | null
          sleep_efficiency?: number | null
          sleep_score?: number | null
          spo2?: number | null
          strain_score?: number | null
          total_sleep_min?: number | null
        }
        Update: {
          active_calories?: number | null
          athlete_id?: string
          created_at?: string | null
          deep_sleep_min?: number | null
          hrv_rmssd?: number | null
          id?: string
          metric_date?: string
          muscle_load?: number | null
          provider?: string
          raw_data?: Json | null
          recovery_score?: number | null
          rem_sleep_min?: number | null
          resting_hr?: number | null
          sleep_efficiency?: number | null
          sleep_score?: number | null
          spo2?: number | null
          strain_score?: number | null
          total_sleep_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wearable_daily_metrics_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      whoop_cycles: {
        Row: {
          athlete_id: string
          avg_hr: number | null
          cycle_end: string | null
          cycle_start: string | null
          id: string
          kilojoules: number | null
          max_hr: number | null
          raw_data: Json | null
          strain_score: number | null
          synced_at: string | null
          whoop_cycle_id: string
        }
        Insert: {
          athlete_id: string
          avg_hr?: number | null
          cycle_end?: string | null
          cycle_start?: string | null
          id?: string
          kilojoules?: number | null
          max_hr?: number | null
          raw_data?: Json | null
          strain_score?: number | null
          synced_at?: string | null
          whoop_cycle_id: string
        }
        Update: {
          athlete_id?: string
          avg_hr?: number | null
          cycle_end?: string | null
          cycle_start?: string | null
          id?: string
          kilojoules?: number | null
          max_hr?: number | null
          raw_data?: Json | null
          strain_score?: number | null
          synced_at?: string | null
          whoop_cycle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whoop_cycles_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_acwr: {
        Args: { p_athlete_id: string; p_date: string }
        Returns: {
          acute_load: number
          acwr_ratio: number
          chronic_load: number
        }[]
      }
      get_athlete_programs: {
        Args: { p_athlete_id: string }
        Returns: {
          athlete_id: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          is_published: boolean | null
          notes: string | null
          org_id: string
          phase: string | null
          start_date: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          week_number: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "training_programs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_super_admin: { Args: never; Returns: boolean }
      my_role: { Args: { org: string }; Returns: string }
      my_team_id: { Args: { org: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

