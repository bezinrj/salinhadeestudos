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
      configuracoes_site: {
        Row: {
          chave: string
          descricao: string | null
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      cronograma_matriz: {
        Row: {
          assunto: string | null
          cor: string | null
          created_at: string
          cronograma_id: string
          fonte_legal: string | null
          fontes: Json | null
          horas_estimadas: number
          id: number
          link_dod: string | null
          link_questoes: string | null
          materia: string
          ordem: number
        }
        Insert: {
          assunto?: string | null
          cor?: string | null
          created_at?: string
          cronograma_id: string
          fonte_legal?: string | null
          fontes?: Json | null
          horas_estimadas?: number
          id?: number
          link_dod?: string | null
          link_questoes?: string | null
          materia: string
          ordem?: number
        }
        Update: {
          assunto?: string | null
          cor?: string | null
          created_at?: string
          cronograma_id?: string
          fonte_legal?: string | null
          fontes?: Json | null
          horas_estimadas?: number
          id?: number
          link_dod?: string | null
          link_questoes?: string | null
          materia?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_matriz_cronograma_id_fkey"
            columns: ["cronograma_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      cronogramas: {
        Row: {
          categoria: string | null
          created_at: string
          id: string
          imagem_url: string | null
          nome: string
          premium: boolean
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome: string
          premium?: boolean
        }
        Update: {
          categoria?: string | null
          created_at?: string
          id?: string
          imagem_url?: string | null
          nome?: string
          premium?: boolean
        }
        Relationships: []
      }
      discipline_change_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          discipline_id: string
          id: string
          justification: string
          proposed_data: Json | null
          request_type: Database["public"]["Enums"]["discipline_request_type"]
          requester_id: string
          status: Database["public"]["Enums"]["discipline_request_status"]
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          discipline_id: string
          id?: string
          justification: string
          proposed_data?: Json | null
          request_type: Database["public"]["Enums"]["discipline_request_type"]
          requester_id: string
          status?: Database["public"]["Enums"]["discipline_request_status"]
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          discipline_id?: string
          id?: string
          justification?: string
          proposed_data?: Json | null
          request_type?: Database["public"]["Enums"]["discipline_request_type"]
          requester_id?: string
          status?: Database["public"]["Enums"]["discipline_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "discipline_change_requests_discipline_id_fkey"
            columns: ["discipline_id"]
            isOneToOne: false
            referencedRelation: "disciplines"
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
      disciplines: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
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
      feedbacks: {
        Row: {
          aprovado: boolean
          avatar_url: string | null
          cargo: string
          created_at: string | null
          estrelas: number
          exibir_carrossel: boolean
          id: string
          nome: string
          publico: boolean
          texto: string
          user_id: string | null
        }
        Insert: {
          aprovado?: boolean
          avatar_url?: string | null
          cargo: string
          created_at?: string | null
          estrelas: number
          exibir_carrossel?: boolean
          id?: string
          nome: string
          publico?: boolean
          texto: string
          user_id?: string | null
        }
        Update: {
          aprovado?: boolean
          avatar_url?: string | null
          cargo?: string
          created_at?: string | null
          estrelas?: number
          exibir_carrossel?: boolean
          id?: string
          nome?: string
          publico?: boolean
          texto?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      free_plan_usage: {
        Row: {
          id: string
          question_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          question_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          question_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hotmart_pendentes: {
        Row: {
          album_ids: string[]
          created_at: string | null
          email: string
          hotmart_transaction: string | null
          id: string
          meses_assinatura: number
          processado_at: string | null
          produto_codigo: string
          status: string
        }
        Insert: {
          album_ids?: string[]
          created_at?: string | null
          email: string
          hotmart_transaction?: string | null
          id?: string
          meses_assinatura?: number
          processado_at?: string | null
          produto_codigo: string
          status?: string
        }
        Update: {
          album_ids?: string[]
          created_at?: string | null
          email?: string
          hotmart_transaction?: string | null
          id?: string
          meses_assinatura?: number
          processado_at?: string | null
          produto_codigo?: string
          status?: string
        }
        Relationships: []
      }
      hotmart_produtos: {
        Row: {
          album_ids: string[]
          created_at: string | null
          descricao: string | null
          id: string
          is_active: boolean
          meses_assinatura: number
          produto_codigo: string
        }
        Insert: {
          album_ids?: string[]
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean
          meses_assinatura?: number
          produto_codigo: string
        }
        Update: {
          album_ids?: string[]
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean
          meses_assinatura?: number
          produto_codigo?: string
        }
        Relationships: []
      }
      juris_assuntos: {
        Row: {
          created_at: string
          id: string
          materia_id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          materia_id: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          materia_id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "juris_assuntos_materia_id_fkey"
            columns: ["materia_id"]
            isOneToOne: false
            referencedRelation: "juris_materias"
            referencedColumns: ["id"]
          },
        ]
      }
      juris_chat_usage: {
        Row: {
          count: number
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      juris_julgados: {
        Row: {
          abertura: string | null
          antes: string | null
          area: string | null
          assunto: string | null
          casos_concretos: Json
          conceitual: string | null
          conclusoes: string | null
          created_at: string
          created_by: string | null
          data: string | null
          depois: string | null
          doutrina: string | null
          id: string
          info: string | null
          integra_ref: string | null
          integra_texto: string | null
          jurisprudencia: string | null
          nocoes: Json
          numero: string | null
          principios: string | null
          problema: string | null
          published: boolean
          relator: string | null
          solucao: string | null
          tese: string | null
          titulo: string
          tribunal: string | null
          updated_at: string
        }
        Insert: {
          abertura?: string | null
          antes?: string | null
          area?: string | null
          assunto?: string | null
          casos_concretos?: Json
          conceitual?: string | null
          conclusoes?: string | null
          created_at?: string
          created_by?: string | null
          data?: string | null
          depois?: string | null
          doutrina?: string | null
          id?: string
          info?: string | null
          integra_ref?: string | null
          integra_texto?: string | null
          jurisprudencia?: string | null
          nocoes?: Json
          numero?: string | null
          principios?: string | null
          problema?: string | null
          published?: boolean
          relator?: string | null
          solucao?: string | null
          tese?: string | null
          titulo: string
          tribunal?: string | null
          updated_at?: string
        }
        Update: {
          abertura?: string | null
          antes?: string | null
          area?: string | null
          assunto?: string | null
          casos_concretos?: Json
          conceitual?: string | null
          conclusoes?: string | null
          created_at?: string
          created_by?: string | null
          data?: string | null
          depois?: string | null
          doutrina?: string | null
          id?: string
          info?: string | null
          integra_ref?: string | null
          integra_texto?: string | null
          jurisprudencia?: string | null
          nocoes?: Json
          numero?: string | null
          principios?: string | null
          problema?: string | null
          published?: boolean
          relator?: string | null
          solucao?: string | null
          tese?: string | null
          titulo?: string
          tribunal?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      juris_materias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
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
          banco_geral_expires_at: string | null
          bio: string | null
          comment_score: number | null
          created_at: string | null
          id: string
          likes_count: number | null
          name: string | null
          phone: string | null
          price_id: string | null
          rank_position: number | null
          streak: number | null
          subscription_end: string | null
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
          banco_geral_expires_at?: string | null
          bio?: string | null
          comment_score?: number | null
          created_at?: string | null
          id: string
          likes_count?: number | null
          name?: string | null
          phone?: string | null
          price_id?: string | null
          rank_position?: number | null
          streak?: number | null
          subscription_end?: string | null
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
          banco_geral_expires_at?: string | null
          bio?: string | null
          comment_score?: number | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          name?: string | null
          phone?: string | null
          price_id?: string | null
          rank_position?: number | null
          streak?: number | null
          subscription_end?: string | null
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
      study_sessions: {
        Row: {
          acertos: number | null
          created_at: string
          data: string
          id: number
          percentual_acerto: number | null
          questoes: number | null
          tempo_estudado: string | null
          topico_id: number
          user_id: string
        }
        Insert: {
          acertos?: number | null
          created_at?: string
          data?: string
          id?: number
          percentual_acerto?: number | null
          questoes?: number | null
          tempo_estudado?: string | null
          topico_id: number
          user_id: string
        }
        Update: {
          acertos?: number | null
          created_at?: string
          data?: string
          id?: number
          percentual_acerto?: number | null
          questoes?: number | null
          tempo_estudado?: string | null
          topico_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "cronograma_matriz"
            referencedColumns: ["id"]
          },
        ]
      }
      study_timer_sessions: {
        Row: {
          accumulated_seconds: number
          adjusted_at: string | null
          adjusted_total_seconds: number | null
          adjustment_reason: string | null
          created_at: string
          discipline: string | null
          end_time: string | null
          id: string
          original_calculated_seconds: number | null
          paused_at: string | null
          resumed_at: string | null
          start_time: string
          status: Database["public"]["Enums"]["timer_session_status"]
          total_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accumulated_seconds?: number
          adjusted_at?: string | null
          adjusted_total_seconds?: number | null
          adjustment_reason?: string | null
          created_at?: string
          discipline?: string | null
          end_time?: string | null
          id?: string
          original_calculated_seconds?: number | null
          paused_at?: string | null
          resumed_at?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["timer_session_status"]
          total_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accumulated_seconds?: number
          adjusted_at?: string | null
          adjusted_total_seconds?: number | null
          adjustment_reason?: string | null
          created_at?: string
          discipline?: string | null
          end_time?: string | null
          id?: string
          original_calculated_seconds?: number | null
          paused_at?: string | null
          resumed_at?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["timer_session_status"]
          total_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      turmas_acessos: {
        Row: {
          album_id: string
          assinatura_id: string | null
          created_at: string | null
          id: string
          is_manual: boolean
          notas: string | null
          user_id: string
        }
        Insert: {
          album_id: string
          assinatura_id?: string | null
          created_at?: string | null
          id?: string
          is_manual?: boolean
          notas?: string | null
          user_id: string
        }
        Update: {
          album_id?: string
          assinatura_id?: string | null
          created_at?: string | null
          id?: string
          is_manual?: boolean
          notas?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_acessos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "turmas_albuns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_acessos_assinatura_id_fkey"
            columns: ["assinatura_id"]
            isOneToOne: false
            referencedRelation: "turmas_assinaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_acessos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas_albuns: {
        Row: {
          capa_url: string | null
          categoria_id: string | null
          cor: string
          created_at: string | null
          created_by: string | null
          data_inicio: string
          descricao: string | null
          id: string
          intervalo_dias: number
          is_active: boolean
          questoes_por_liberacao: number
          titulo: string
          updated_at: string | null
          whatsapp_ativo: boolean
          whatsapp_url: string | null
        }
        Insert: {
          capa_url?: string | null
          categoria_id?: string | null
          cor?: string
          created_at?: string | null
          created_by?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          intervalo_dias?: number
          is_active?: boolean
          questoes_por_liberacao?: number
          titulo: string
          updated_at?: string | null
          whatsapp_ativo?: boolean
          whatsapp_url?: string | null
        }
        Update: {
          capa_url?: string | null
          categoria_id?: string | null
          cor?: string
          created_at?: string | null
          created_by?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          intervalo_dias?: number
          is_active?: boolean
          questoes_por_liberacao?: number
          titulo?: string
          updated_at?: string | null
          whatsapp_ativo?: boolean
          whatsapp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turmas_albuns_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "turmas_categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_albuns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas_assinaturas: {
        Row: {
          banco_geral_expires_at: string | null
          created_at: string | null
          id: string
          plano_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banco_geral_expires_at?: string | null
          created_at?: string | null
          id?: string
          plano_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banco_geral_expires_at?: string | null
          created_at?: string | null
          id?: string
          plano_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "turmas_planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_assinaturas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas_categorias: {
        Row: {
          cor: string
          created_at: string | null
          icone: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string
          created_at?: string | null
          icone?: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string
          created_at?: string | null
          icone?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      turmas_gabarito_downloads: {
        Row: {
          album_id: string
          downloaded_at: string | null
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          album_id: string
          downloaded_at?: string | null
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          album_id?: string
          downloaded_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_gabarito_downloads_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "turmas_albuns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_gabarito_downloads_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_gabarito_downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas_planos: {
        Row: {
          album_ids: string[]
          created_at: string | null
          descricao: string | null
          id: string
          is_active: boolean
          meses_banco_geral: number
          nome: string
          price_id_stripe: string
          valor: number
        }
        Insert: {
          album_ids?: string[]
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean
          meses_banco_geral?: number
          nome: string
          price_id_stripe: string
          valor: number
        }
        Update: {
          album_ids?: string[]
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean
          meses_banco_geral?: number
          nome?: string
          price_id_stripe?: string
          valor?: number
        }
        Relationships: []
      }
      turmas_questoes: {
        Row: {
          album_id: string
          created_at: string | null
          id: string
          liberado_em: string
          ordem: number
          question_id: string
        }
        Insert: {
          album_id: string
          created_at?: string | null
          id?: string
          liberado_em?: string
          ordem?: number
          question_id: string
        }
        Update: {
          album_id?: string
          created_at?: string | null
          id?: string
          liberado_em?: string
          ordem?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_questoes_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "turmas_albuns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_questoes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas_respostas: {
        Row: {
          album_id: string
          created_at: string | null
          gabarito_baixado_antes: boolean
          id: string
          is_study_attempt: boolean
          question_id: string
          resposta: string
          score: number | null
          user_id: string
        }
        Insert: {
          album_id: string
          created_at?: string | null
          gabarito_baixado_antes?: boolean
          id?: string
          is_study_attempt?: boolean
          question_id: string
          resposta: string
          score?: number | null
          user_id: string
        }
        Update: {
          album_id?: string
          created_at?: string | null
          gabarito_baixado_antes?: boolean
          id?: string
          is_study_attempt?: boolean
          question_id?: string
          resposta?: string
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_respostas_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "turmas_albuns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_respostas_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "weekly_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_respostas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_calendar_events: {
        Row: {
          concluido: boolean
          created_at: string
          data: string
          horas_dia: number
          id: number
          is_revisao: boolean
          topico_id: number
          user_id: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          data: string
          horas_dia?: number
          id?: number
          is_revisao?: boolean
          topico_id: number
          user_id: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          data?: string
          horas_dia?: number
          id?: number
          is_revisao?: boolean
          topico_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendar_events_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "cronograma_matriz"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contact_info: {
        Row: {
          created_at: string
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_fonte_progress: {
        Row: {
          concluido: boolean
          id: number
          sigla: string
          topico_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          id?: never
          sigla: string
          topico_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          id?: never
          sigla?: string
          topico_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fonte_progress_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "cronograma_matriz"
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
      user_topico_progress: {
        Row: {
          concluido: boolean
          id: number
          para_revisao: boolean
          topico_id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          concluido?: boolean
          id?: number
          para_revisao?: boolean
          topico_id: number
          updated_at?: string
          user_id: string
        }
        Update: {
          concluido?: boolean
          id?: number
          para_revisao?: boolean
          topico_id?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_topico_progress_topico_id_fkey"
            columns: ["topico_id"]
            isOneToOne: false
            referencedRelation: "cronograma_matriz"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_artigos: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          lei_id: string
          numero: string
          ordem: number
          rotulo: string
          texto: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          lei_id: string
          numero: string
          ordem?: number
          rotulo?: string
          texto: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          lei_id?: string
          numero?: string
          ordem?: number
          rotulo?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "vm_artigos_lei_id_fkey"
            columns: ["lei_id"]
            isOneToOne: false
            referencedRelation: "vm_leis"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_comentarios: {
        Row: {
          artigo_id: string
          autor_cargo: string | null
          autor_nome: string
          criado_em: string
          fixado: boolean
          id: string
          moderado_por: string | null
          texto: string
          tipo: string
          upvotes: number
          user_id: string
          visivel: boolean
        }
        Insert: {
          artigo_id: string
          autor_cargo?: string | null
          autor_nome: string
          criado_em?: string
          fixado?: boolean
          id?: string
          moderado_por?: string | null
          texto: string
          tipo?: string
          upvotes?: number
          user_id: string
          visivel?: boolean
        }
        Update: {
          artigo_id?: string
          autor_cargo?: string | null
          autor_nome?: string
          criado_em?: string
          fixado?: boolean
          id?: string
          moderado_por?: string | null
          texto?: string
          tipo?: string
          upvotes?: number
          user_id?: string
          visivel?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vm_comentarios_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_highlights: {
        Row: {
          artigo_id: string
          cor: string
          criado_em: string
          id: string
          offset_fim: number
          offset_inicio: number
          trecho: string
          user_id: string
        }
        Insert: {
          artigo_id: string
          cor?: string
          criado_em?: string
          id?: string
          offset_fim: number
          offset_inicio: number
          trecho: string
          user_id: string
        }
        Update: {
          artigo_id?: string
          cor?: string
          criado_em?: string
          id?: string
          offset_fim?: number
          offset_inicio?: number
          trecho?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vm_highlights_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_incidencias: {
        Row: {
          artigo_id: string
          cargo: string
          concursos: string[]
          id: string
          quantidade: number
        }
        Insert: {
          artigo_id: string
          cargo: string
          concursos?: string[]
          id?: string
          quantidade?: number
        }
        Update: {
          artigo_id?: string
          cargo?: string
          concursos?: string[]
          id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "vm_incidencias_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_leis: {
        Row: {
          atualizado_em: string
          categoria: string
          criado_em: string
          criado_por: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number
          publicada: boolean
          sigla: string
        }
        Insert: {
          atualizado_em?: string
          categoria: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          publicada?: boolean
          sigla: string
        }
        Update: {
          atualizado_em?: string
          categoria?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          publicada?: boolean
          sigla?: string
        }
        Relationships: []
      }
      vm_notas: {
        Row: {
          artigo_id: string
          atualizado_em: string
          conteudo: string
          cor: string
          criado_em: string
          id: string
          user_id: string
        }
        Insert: {
          artigo_id: string
          atualizado_em?: string
          conteudo: string
          cor?: string
          criado_em?: string
          id?: string
          user_id: string
        }
        Update: {
          artigo_id?: string
          atualizado_em?: string
          conteudo?: string
          cor?: string
          criado_em?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vm_notas_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_paragrafos: {
        Row: {
          artigo_id: string
          id: string
          ordem: number
          rotulo: string
          texto: string
          tipo: string
        }
        Insert: {
          artigo_id: string
          id?: string
          ordem?: number
          rotulo?: string
          texto: string
          tipo: string
        }
        Update: {
          artigo_id?: string
          id?: string
          ordem?: number
          rotulo?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "vm_paragrafos_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_progresso: {
        Row: {
          artigo_id: string
          data_leitura: string | null
          id: string
          lido: boolean
          marcado: boolean
          user_id: string
        }
        Insert: {
          artigo_id: string
          data_leitura?: string | null
          id?: string
          lido?: boolean
          marcado?: boolean
          user_id: string
        }
        Update: {
          artigo_id?: string
          data_leitura?: string | null
          id?: string
          lido?: boolean
          marcado?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vm_progresso_artigo_id_fkey"
            columns: ["artigo_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      vm_remissoes: {
        Row: {
          artigo_destino_id: string
          artigo_origem_id: string
          criado_em: string
          id: string
          texto_exibido: string
        }
        Insert: {
          artigo_destino_id: string
          artigo_origem_id: string
          criado_em?: string
          id?: string
          texto_exibido: string
        }
        Update: {
          artigo_destino_id?: string
          artigo_origem_id?: string
          criado_em?: string
          id?: string
          texto_exibido?: string
        }
        Relationships: [
          {
            foreignKeyName: "vm_remissoes_artigo_destino_id_fkey"
            columns: ["artigo_destino_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vm_remissoes_artigo_origem_id_fkey"
            columns: ["artigo_origem_id"]
            isOneToOne: false
            referencedRelation: "vm_artigos"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_answers: {
        Row: {
          answer_text: string
          created_at: string
          direct_correction_used: boolean
          handwriting_legibility_level: string | null
          handwriting_legibility_note: string | null
          id: string
          ocr_confidence: number | null
          ocr_text: string | null
          processing_status: string | null
          question_id: string
          score: number
          submission_type: string
          transcription_reviewed_text: string | null
          uploaded_file_name: string | null
          uploaded_file_url: string | null
          user_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          direct_correction_used?: boolean
          handwriting_legibility_level?: string | null
          handwriting_legibility_note?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_text?: string | null
          processing_status?: string | null
          question_id: string
          score?: number
          submission_type?: string
          transcription_reviewed_text?: string | null
          uploaded_file_name?: string | null
          uploaded_file_url?: string | null
          user_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          direct_correction_used?: boolean
          handwriting_legibility_level?: string | null
          handwriting_legibility_note?: string | null
          id?: string
          ocr_confidence?: number | null
          ocr_text?: string | null
          processing_status?: string | null
          question_id?: string
          score?: number
          submission_type?: string
          transcription_reviewed_text?: string | null
          uploaded_file_name?: string | null
          uploaded_file_url?: string | null
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
          album_id: string | null
          banca: string | null
          barema: Json | null
          career: string
          created_at: string | null
          created_by: string | null
          deadline: string | null
          difficulty: string
          discipline: string
          disciplines: string[]
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
          subjects: string[]
          title: string
          year: number | null
        }
        Insert: {
          album_id?: string | null
          banca?: string | null
          barema?: Json | null
          career: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          difficulty?: string
          discipline: string
          disciplines?: string[]
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
          subjects?: string[]
          title: string
          year?: number | null
        }
        Update: {
          album_id?: string | null
          banca?: string | null
          barema?: Json | null
          career?: string
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          difficulty?: string
          discipline?: string
          disciplines?: string[]
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
          subjects?: string[]
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_questions_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "turmas_albuns"
            referencedColumns: ["id"]
          },
        ]
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
      get_general_ranking: {
        Args: never
        Returns: {
          total_score: number
          user_id: string
        }[]
      }
      get_my_billing: {
        Args: never
        Returns: {
          banco_geral_expires_at: string
          price_id: string
          subscription_end: string
          subscription_tier: string
        }[]
      }
      get_my_phone: { Args: never; Returns: string }
      get_turma_ranking_geral: {
        Args: { p_album_id: string }
        Returns: {
          questoes_respondidas: number
          respondeu_sem_gabarito: boolean
          total_score: number
          user_id: string
        }[]
      }
      get_turma_ranking_por_questao: {
        Args: { p_album_id: string; p_question_id: string }
        Returns: {
          respondeu_sem_gabarito: boolean
          score: number
          user_id: string
        }[]
      }
      get_turma_ranking_semanal: {
        Args: { p_album_id: string }
        Returns: {
          questoes_respondidas: number
          respondeu_sem_gabarito: boolean
          total_score: number
          user_id: string
        }[]
      }
      get_weekly_ranking: {
        Args: { _question_id: string }
        Returns: {
          score: number
          user_id: string
        }[]
      }
      get_weekly_waitlist_count: { Args: never; Returns: number }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
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
      recompute_turma_liberacoes: {
        Args: { p_album_id: string }
        Returns: undefined
      }
      sync_expired_subscriptions: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      discipline_request_status: "pending" | "approved" | "rejected"
      discipline_request_type: "edit" | "delete"
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
      timer_session_status: "running" | "paused" | "completed" | "cancelled"
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
      discipline_request_status: ["pending", "approved", "rejected"],
      discipline_request_type: ["edit", "delete"],
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
      timer_session_status: ["running", "paused", "completed", "cancelled"],
    },
  },
} as const
