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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
        }
        Relationships: []
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "question_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          plan_type: string
          starts_at: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          plan_type?: string
          starts_at?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          plan_type?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_likes: {
        Row: {
          created_at: string | null
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_grade: number | null
          bio: string | null
          comment_score: number | null
          created_at: string | null
          id: string
          likes_count: number | null
          name: string | null
          rank_position: number | null
          streak: number | null
          subscription_tier: string | null
          target_career: string | null
          total_essays: number | null
          total_score: number | null
          username: string
          weekly_hours: number | null
        }
        Insert: {
          avatar_url?: string | null
          average_grade?: number | null
          bio?: string | null
          comment_score?: number | null
          created_at?: string | null
          id: string
          likes_count?: number | null
          name?: string | null
          rank_position?: number | null
          streak?: number | null
          subscription_tier?: string | null
          target_career?: string | null
          total_essays?: number | null
          total_score?: number | null
          username: string
          weekly_hours?: number | null
        }
        Update: {
          avatar_url?: string | null
          average_grade?: number | null
          bio?: string | null
          comment_score?: number | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          name?: string | null
          rank_position?: number | null
          streak?: number | null
          subscription_tier?: string | null
          target_career?: string | null
          total_essays?: number | null
          total_score?: number | null
          username?: string
          weekly_hours?: number | null
        }
        Relationships: []
      }
      question_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_comments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          last_seen_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          question_id: string
          score: number
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          question_id: string
          score?: number
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          question_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_questions: {
        Row: {
          banca: string | null
          barema: Json | null
          career: string
          created_at: string | null
          created_by: string | null
          deadline: string | null
          difficulty: string
          discipline: string
          id: string
          ideal_answer: string | null
          is_active: boolean
          is_premium: boolean
          is_weekly: boolean
          mirror_text: string | null
          participants: number
          statement: string
          title: string
        }
        Insert: {
          banca?: string | null
          barema?: Json | null
          career: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          difficulty?: string
          discipline: string
          id?: string
          ideal_answer?: string | null
          is_active?: boolean
          is_premium?: boolean
          is_weekly?: boolean
          mirror_text?: string | null
          participants?: number
          statement: string
          title: string
        }
        Update: {
          banca?: string | null
          barema?: Json | null
          career?: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          difficulty?: string
          discipline?: string
          id?: string
          ideal_answer?: string | null
          is_active?: boolean
          is_premium?: boolean
          is_weekly?: boolean
          mirror_text?: string | null
          participants?: number
          statement?: string
          title?: string
        }
        Relationships: []
      }
      weekly_waitlist: {
        Row: {
          created_at: string | null
          id: string
          notified: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notified?: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notified?: boolean
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
