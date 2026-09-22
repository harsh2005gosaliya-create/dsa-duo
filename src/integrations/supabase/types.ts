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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string
          icon: string
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          description: string
          icon?: string
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          description?: string
          icon?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          meta: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          message: string
          meta?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
      daily_mission_items: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          is_review: boolean
          mission_id: string
          problem_id: string
          slot: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          is_review?: boolean
          mission_id: string
          problem_id: string
          slot?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          is_review?: boolean
          mission_id?: string
          problem_id?: string
          slot?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_mission_items_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_mission_items_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_missions: {
        Row: {
          completed_count: number
          created_at: string
          id: string
          mission_date: string
          target: number
          user_id: string
        }
        Insert: {
          completed_count?: number
          created_at?: string
          id?: string
          mission_date: string
          target?: number
          user_id: string
        }
        Update: {
          completed_count?: number
          created_at?: string
          id?: string
          mission_date?: string
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      discussions: {
        Row: {
          body: string
          created_at: string
          id: string
          problem_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          problem_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          problem_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      duo_signals: {
        Row: {
          created_at: string
          from_user: string
          id: string
          kind: string
          payload: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          kind: string
          payload: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          kind?: string
          payload?: string
          to_user?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      mistakes: {
        Row: {
          attempt_id: string | null
          category: string
          created_at: string
          id: string
          note: string | null
          problem_id: string | null
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          category: string
          created_at?: string
          id?: string
          note?: string | null
          problem_id?: string | null
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          category?: string
          created_at?: string
          id?: string
          note?: string | null
          problem_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mistakes_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "problem_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mistakes_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_oa_problems: {
        Row: {
          flagged: boolean
          id: string
          mock_id: string
          position: number
          problem_id: string
          solved: boolean
          user_id: string
        }
        Insert: {
          flagged?: boolean
          id?: string
          mock_id: string
          position?: number
          problem_id: string
          solved?: boolean
          user_id: string
        }
        Update: {
          flagged?: boolean
          id?: string
          mock_id?: string
          position?: number
          problem_id?: string
          solved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_oa_problems_mock_id_fkey"
            columns: ["mock_id"]
            isOneToOne: false
            referencedRelation: "mock_oas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_oa_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_oas: {
        Row: {
          difficulty_mode: string
          duration_min: number
          finished_at: string | null
          id: string
          score: number | null
          solved_count: number
          started_at: string
          status: string
          time_used_min: number | null
          total_count: number
          user_id: string
        }
        Insert: {
          difficulty_mode: string
          duration_min: number
          finished_at?: string | null
          id?: string
          score?: number | null
          solved_count?: number
          started_at?: string
          status?: string
          time_used_min?: number | null
          total_count?: number
          user_id: string
        }
        Update: {
          difficulty_mode?: string
          duration_min?: number
          finished_at?: string | null
          id?: string
          score?: number | null
          solved_count?: number
          started_at?: string
          status?: string
          time_used_min?: number | null
          total_count?: number
          user_id?: string
        }
        Relationships: []
      }
      problem_attempts: {
        Row: {
          attempts_count: number
          can_resolve_tomorrow: boolean
          confidence: number
          created_at: string
          difficulty_felt: number
          hints_used: number
          id: string
          is_resolve: boolean
          key_idea: string | null
          mistake_note: string | null
          notes: string | null
          outcome: string
          problem_id: string
          solved_on: string
          space_complexity: string | null
          time_complexity: string | null
          time_taken_min: number
          user_id: string
        }
        Insert: {
          attempts_count?: number
          can_resolve_tomorrow?: boolean
          confidence?: number
          created_at?: string
          difficulty_felt?: number
          hints_used?: number
          id?: string
          is_resolve?: boolean
          key_idea?: string | null
          mistake_note?: string | null
          notes?: string | null
          outcome?: string
          problem_id: string
          solved_on?: string
          space_complexity?: string | null
          time_complexity?: string | null
          time_taken_min?: number
          user_id: string
        }
        Update: {
          attempts_count?: number
          can_resolve_tomorrow?: boolean
          confidence?: number
          created_at?: string
          difficulty_felt?: number
          hints_used?: number
          id?: string
          is_resolve?: boolean
          key_idea?: string | null
          mistake_note?: string | null
          notes?: string | null
          outcome?: string
          problem_id?: string
          solved_on?: string
          space_complexity?: string | null
          time_complexity?: string | null
          time_taken_min?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_attempts_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_reviews: {
        Row: {
          completed_at: string | null
          confidence_now: number | null
          created_at: string
          due_date: string
          easier: boolean | null
          id: string
          interval_index: number
          problem_id: string
          remembered_approach: boolean | null
          status: string
          time_taken_min: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          confidence_now?: number | null
          created_at?: string
          due_date: string
          easier?: boolean | null
          id?: string
          interval_index?: number
          problem_id: string
          remembered_approach?: boolean | null
          status?: string
          time_taken_min?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          confidence_now?: number | null
          created_at?: string
          due_date?: string
          easier?: boolean | null
          id?: string
          interval_index?: number
          problem_id?: string
          remembered_approach?: boolean | null
          status?: string
          time_taken_min?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "problem_reviews_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      problems: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          estimated_time: number
          id: string
          is_seed: boolean
          pattern: string | null
          platform: string
          subtopic: string | null
          tags: string[]
          title: string
          topic: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          estimated_time?: number
          id?: string
          is_seed?: boolean
          pattern?: string | null
          platform?: string
          subtopic?: string | null
          tags?: string[]
          title: string
          topic?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          estimated_time?: number
          id?: string
          is_seed?: boolean
          pattern?: string | null
          platform?: string
          subtopic?: string | null
          tags?: string[]
          title?: string
          topic?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_target: number
          dsa_level: string
          id: string
          interview_date: string | null
          name: string
          onboarded: boolean
          preferred_language: string
          target_companies: string[]
          target_role: string
          theme: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_target?: number
          dsa_level?: string
          id: string
          interview_date?: string | null
          name?: string
          onboarded?: boolean
          preferred_language?: string
          target_companies?: string[]
          target_role?: string
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_target?: number
          dsa_level?: string
          id?: string
          interview_date?: string | null
          name?: string
          onboarded?: boolean
          preferred_language?: string
          target_companies?: string[]
          target_role?: string
          theme?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      roadmap_phases: {
        Row: {
          checklist: string[]
          id: string
          phase_order: number
          summary: string | null
          title: string
          topics: string[]
        }
        Insert: {
          checklist?: string[]
          id?: string
          phase_order: number
          summary?: string | null
          title: string
          topics?: string[]
        }
        Update: {
          checklist?: string[]
          id?: string
          phase_order?: number
          summary?: string | null
          title?: string
          topics?: string[]
        }
        Relationships: []
      }
      shared_problems: {
        Row: {
          created_at: string
          from_user: string
          id: string
          message: string | null
          problem_id: string
          share_date: string
          status: string
          to_user: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          message?: string | null
          problem_id: string
          share_date?: string
          status?: string
          to_user: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          message?: string | null
          problem_id?: string
          share_date?: string
          status?: string
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          approach: string | null
          code: string
          created_at: string
          id: string
          intuition: string | null
          language: string
          problem_id: string
          space_complexity: string | null
          time_complexity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approach?: string | null
          code?: string
          created_at?: string
          id?: string
          intuition?: string | null
          language?: string
          problem_id: string
          space_complexity?: string | null
          time_complexity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approach?: string | null
          code?: string
          created_at?: string
          id?: string
          intuition?: string | null
          language?: string
          problem_id?: string
          space_complexity?: string | null
          time_complexity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          code: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          code: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          code?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["code"]
          },
        ]
      }
      user_phase_progress: {
        Row: {
          checked: string[]
          completed: boolean
          phase_id: string
          started: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          checked?: string[]
          completed?: boolean
          phase_id: string
          started?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          checked?: string[]
          completed?: boolean
          phase_id?: string
          started?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_phase_progress_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "roadmap_phases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_problem_state: {
        Row: {
          failed_count: number
          last_activity_at: string
          last_confidence: number | null
          mastery: string
          problem_id: string
          solved_count: number
          total_attempts: number
          user_id: string
        }
        Insert: {
          failed_count?: number
          last_activity_at?: string
          last_confidence?: number | null
          mastery?: string
          problem_id: string
          solved_count?: number
          total_attempts?: number
          user_id: string
        }
        Update: {
          failed_count?: number
          last_activity_at?: string
          last_confidence?: number | null
          mastery?: string
          problem_id?: string
          solved_count?: number
          total_attempts?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_problem_state_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: { Args: { a: string; b: string }; Returns: boolean }
      find_user_by_username: {
        Args: { uname: string }
        Returns: {
          id: string
          name: string
          username: string
        }[]
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
