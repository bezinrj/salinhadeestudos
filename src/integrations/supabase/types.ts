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
      discipline_subjects: {
        Row: {
          category: string | null
          created_at: string | null
          discipline: string
          id: string
          sort_order: number
          subject: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          discipline: string
          id?: string
          sort_order?: number
          subject: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          discipline?: string
          id?: string
          sort_order?: number
          subject?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
      moderation_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          justification: string
          proposed_data: Json | null
          question_id: string
          request_type: Database["public"]["Enums"]["moderation_request_type"]
          requester_id: string
          status: Database["public"]["Enums"]["moderation_request_status"]
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          justification: string
          proposed_data?: Json | null
          question_id: string
          request_type: Database["public"]["Enums"]["moderation_request_type"]
          requester_id: string
          status?: Database["public"]["Enums"]["moderation_request_status"]
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          justification?: string
          proposed_data?: Json | null
          question_id?: string
          request_type?: Database["public"]["Enums"]["moderation_request_type"]
          requester_id?: string
          status?: Database["public"]["Enums"]["moderation_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "moderation_requests_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
        ]
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
          active_badge_id: string | null
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
          active_badge_id?: string | null
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
          active_badge_id?: string | null
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
      question_reports: {
        Row: {
          admin_note: string | null
          attachment_deleted_at: string | null
          attachment_expires_at: string | null
          attachment_name: string | null
          attachment_path: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          description: string
          id: string
          problem_type: Database["public"]["Enums"]["report_problem_type"]
          question_id: string
          status: Database["public"]["Enums"]["report_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          attachment_deleted_at?: string | null
          attachment_expires_at?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          description: string
          id?: string
          problem_type: Database["public"]["Enums"]["report_problem_type"]
          question_id: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          attachment_deleted_at?: string | null
          attachment_expires_at?: string | null
          attachment_name?: string | null
          attachment_path?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          description?: string
          id?: string
          problem_type?: Database["public"]["Enums"]["report_problem_type"]
          question_id?: string
          status?: Database["public"]["Enums"]["report_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reports_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_access: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          schedule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          schedule_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_access_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          block_date: string
          color: string | null
          created_at: string | null
          discipline: string
          dod_url: string | null
          id: string
          notes: string | null
          questions_url: string | null
          schedule_id: string
          sort_order: number
          status: string
          study_time: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          block_date: string
          color?: string | null
          created_at?: string | null
          discipline: string
          dod_url?: string | null
          id?: string
          notes?: string | null
          questions_url?: string | null
          schedule_id: string
          sort_order?: number
          status?: string
          study_time?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          block_date?: string
          color?: string | null
          created_at?: string | null
          discipline?: string
          dod_url?: string | null
          id?: string
          notes?: string | null
          questions_url?: string | null
          schedule_id?: string
          sort_order?: number
          status?: string
          study_time?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          access_type: string
          career: string | null
          color_theme: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          sort_order: number
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          access_type?: string
          career?: string | null
          color_theme?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          access_type?: string
          career?: string | null
          color_theme?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      student_planner_entries: {
        Row: {
          block_id: string
          created_at: string | null
          id: string
          is_completed: boolean
          planned_date: string | null
          planned_duration: string | null
          schedule_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          block_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean
          planned_date?: string | null
          planned_duration?: string | null
          schedule_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          block_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean
          planned_date?: string | null
          planned_duration?: string | null
          schedule_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_planner_entries_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "schedule_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_planner_entries_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      student_planner_settings: {
        Row: {
          created_at: string | null
          id: string
          schedule_id: string
          updated_at: string | null
          user_id: string
          weekly_hours: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          schedule_id: string
          updated_at?: string | null
          user_id: string
          weekly_hours?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          schedule_id?: string
          updated_at?: string | null
          user_id?: string
          weekly_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_planner_settings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
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
          public_id: number
          statement: string
          subject: string | null
          title: string
          year: number | null
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
          public_id?: number
          statement: string
          subject?: string | null
          title: string
          year?: number | null
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
          public_id?: number
          statement?: string
          subject?: string | null
          title?: string
          year?: number | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_absolute_admin: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      moderation_request_status: "pending" | "approved" | "rejected"
      moderation_request_type: "edit" | "delete"
      report_problem_type:
        | "gabarito_errado"
        | "correcao_inconsistente"
        | "problema_enunciado"
        | "materia_errada"
        | "barema_incoerente"
        | "erro_digitacao"
        | "outro"
      report_status:
        | "pendente"
        | "em_analise"
        | "procedente"
        | "improcedente"
        | "corrigido"
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
      moderation_request_status: ["pending", "approved", "rejected"],
      moderation_request_type: ["edit", "delete"],
      report_problem_type: [
        "gabarito_errado",
        "correcao_inconsistente",
        "problema_enunciado",
        "materia_errada",
        "barema_incoerente",
        "erro_digitacao",
        "outro",
      ],
      report_status: [
        "pendente",
        "em_analise",
        "procedente",
        "improcedente",
        "corrigido",
      ],
    },
  },
} as const
