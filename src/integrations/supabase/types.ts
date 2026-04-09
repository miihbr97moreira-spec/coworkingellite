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
      api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          model: string | null
          provider: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          provider: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          model?: string | null
          provider?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cta_buttons: {
        Row: {
          active: boolean
          color: string
          created_at: string
          destination: string
          id: string
          label: string
          plan_messages: Json | null
          plan_specific: boolean | null
          position: number
          type: string
          whatsapp_message: string | null
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          destination?: string
          id?: string
          label: string
          plan_messages?: Json | null
          plan_specific?: boolean | null
          position?: number
          type?: string
          whatsapp_message?: string | null
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          destination?: string
          id?: string
          label?: string
          plan_messages?: Json | null
          plan_specific?: boolean | null
          position?: number
          type?: string
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      custom_domains: {
        Row: {
          content_id: string | null
          content_type: string
          created_at: string | null
          domain: string
          id: string
          is_active: boolean | null
          is_native: boolean | null
          slug: string | null
          ssl_status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          domain: string
          id?: string
          is_active?: boolean | null
          is_native?: boolean | null
          slug?: string | null
          ssl_status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          domain?: string
          id?: string
          is_active?: boolean | null
          is_native?: boolean | null
          slug?: string | null
          ssl_status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          answers: Json | null
          created_at: string
          email: string | null
          form_id: string
          id: string
          lead_id: string | null
          metadata: Json | null
          name: string | null
          phone: string | null
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          email?: string | null
          form_id: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          answers?: Json | null
          created_at?: string
          email?: string | null
          form_id?: string
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          created_by: string | null
          crm_funnel_id: string | null
          crm_stage_id: string | null
          description: string | null
          ga_id: string | null
          id: string
          logic_rules: Json | null
          logo_position: string | null
          logo_url: string | null
          meta_pixel_id: string | null
          questions: Json | null
          settings: Json | null
          slug: string
          source_tag: string | null
          status: string
          theme: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crm_funnel_id?: string | null
          crm_stage_id?: string | null
          description?: string | null
          ga_id?: string | null
          id?: string
          logic_rules?: Json | null
          logo_position?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          questions?: Json | null
          settings?: Json | null
          slug: string
          source_tag?: string | null
          status?: string
          theme?: Json | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crm_funnel_id?: string | null
          crm_stage_id?: string | null
          description?: string | null
          ga_id?: string | null
          id?: string
          logic_rules?: Json | null
          logo_position?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          questions?: Json | null
          settings?: Json | null
          slug?: string
          source_tag?: string | null
          status?: string
          theme?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_crm_funnel_id_fkey"
            columns: ["crm_funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_crm_stage_id_fkey"
            columns: ["crm_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_pages: {
        Row: {
          created_at: string
          created_by: string | null
          ga_id: string | null
          html_content: string
          id: string
          meta_pixel_id: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          ga_id?: string | null
          html_content?: string
          id?: string
          meta_pixel_id?: string | null
          slug: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          ga_id?: string | null
          html_content?: string
          id?: string
          meta_pixel_id?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      landing_page_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          deal_value: number | null
          email: string | null
          funnel_id: string
          id: string
          lead_score: number | null
          name: string
          notes: string | null
          phone: string | null
          sort_order: number
          source: string | null
          stage_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          funnel_id: string
          id?: string
          lead_score?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          sort_order?: number
          source?: string | null
          stage_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          deal_value?: number | null
          email?: string | null
          funnel_id?: string
          id?: string
          lead_score?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          sort_order?: number
          source?: string | null
          stage_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      logos: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      lp_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      omni_agent_config: {
        Row: {
          ai_api_key: string | null
          ai_model: string | null
          ai_provider: string | null
          ai_system_prompt: string | null
          created_at: string | null
          id: string
          tenant_id: string
          updated_at: string | null
          zapi_sync_enabled: boolean | null
        }
        Insert: {
          ai_api_key?: string | null
          ai_model?: string | null
          ai_provider?: string | null
          ai_system_prompt?: string | null
          created_at?: string | null
          id?: string
          tenant_id: string
          updated_at?: string | null
          zapi_sync_enabled?: boolean | null
        }
        Update: {
          ai_api_key?: string | null
          ai_model?: string | null
          ai_provider?: string | null
          ai_system_prompt?: string | null
          created_at?: string | null
          id?: string
          tenant_id?: string
          updated_at?: string | null
          zapi_sync_enabled?: boolean | null
        }
        Relationships: []
      }
      quiz_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          quiz_id: string
          session_id: string
          step_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          quiz_id: string
          session_id: string
          step_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          quiz_id?: string
          session_id?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_analytics_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_submissions: {
        Row: {
          answers: Json | null
          created_at: string
          email: string | null
          id: string
          lead_id: string | null
          name: string | null
          phone: string | null
          quiz_id: string
        }
        Insert: {
          answers?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          name?: string | null
          phone?: string | null
          quiz_id: string
        }
        Update: {
          answers?: Json | null
          created_at?: string
          email?: string | null
          id?: string
          lead_id?: string | null
          name?: string | null
          phone?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_submissions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          crm_funnel_id: string | null
          crm_stage_id: string | null
          description: string | null
          ga_id: string | null
          id: string
          logo_position: string | null
          logo_url: string | null
          meta_pixel_id: string | null
          questions: Json | null
          slug: string
          status: string
          theme: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crm_funnel_id?: string | null
          crm_stage_id?: string | null
          description?: string | null
          ga_id?: string | null
          id?: string
          logo_position?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          questions?: Json | null
          slug: string
          status?: string
          theme?: Json | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crm_funnel_id?: string | null
          crm_stage_id?: string | null
          description?: string | null
          ga_id?: string | null
          id?: string
          logo_position?: string | null
          logo_url?: string | null
          meta_pixel_id?: string | null
          questions?: Json | null
          slug?: string
          status?: string
          theme?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_crm_funnel_id_fkey"
            columns: ["crm_funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_crm_stage_id_fkey"
            columns: ["crm_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          role: string
          sort_order: number
          stars: number
          text: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          role: string
          sort_order?: number
          stars?: number
          text: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          role?: string
          sort_order?: number
          stars?: number
          text?: string
        }
        Relationships: []
      }
      stages: {
        Row: {
          color: string
          created_at: string
          funnel_id: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          color?: string
          created_at?: string
          funnel_id: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          color?: string
          created_at?: string
          funnel_id?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      user_management: {
        Row: {
          allowed_modules: string[] | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          max_domains: number | null
          max_pages: number | null
          max_quizzes: number | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allowed_modules?: string[] | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          max_domains?: number | null
          max_pages?: number | null
          max_quizzes?: number | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allowed_modules?: string[] | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          max_domains?: number | null
          max_pages?: number | null
          max_quizzes?: number | null
          role?: string | null
          updated_at?: string | null
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
      webhook_configs: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          tenant_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          tenant_id: string
          updated_at: string | null
          webhook_secret: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id: string
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          webhook_secret?: string | null
          webhook_url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          endpoint_id: string | null
          id: string
          payload: Json | null
          received_at: string | null
          status_code: number | null
          tenant_id: string
        }
        Insert: {
          endpoint_id?: string | null
          id?: string
          payload?: Json | null
          received_at?: string | null
          status_code?: number | null
          tenant_id: string
        }
        Update: {
          endpoint_id?: string | null
          id?: string
          payload?: Json | null
          received_at?: string | null
          status_code?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_configs: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          provider: string | null
          tenant_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          provider?: string | null
          tenant_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          provider?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      zapi_instances: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          instance_token: string | null
          phone_number: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          instance_token?: string | null
          phone_number?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          instance_token?: string | null
          phone_number?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
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
      app_role: "super_admin" | "editor"
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
      app_role: ["super_admin", "editor"],
    },
  },
} as const
