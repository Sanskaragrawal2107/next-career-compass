export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      generated_resumes: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          job_match_id: string
          optimized_content: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          job_match_id: string
          optimized_content: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          job_match_id?: string
          optimized_content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_resumes_job_match_id_fkey"
            columns: ["job_match_id"]
            isOneToOne: false
            referencedRelation: "job_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      job_matches: {
        Row: {
          company_name: string | null
          created_at: string
          id: string
          job_description: string | null
          job_search_id: string
          job_title: string
          job_url: string | null
          location: string | null
          match_percentage: number | null
          requirements: Json | null
          salary_range: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_search_id: string
          job_title: string
          job_url?: string | null
          location?: string | null
          match_percentage?: number | null
          requirements?: Json | null
          salary_range?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          id?: string
          job_description?: string | null
          job_search_id?: string
          job_title?: string
          job_url?: string | null
          location?: string | null
          match_percentage?: number | null
          requirements?: Json | null
          salary_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_job_search_id_fkey"
            columns: ["job_search_id"]
            isOneToOne: false
            referencedRelation: "job_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      job_searches: {
        Row: {
          created_at: string
          id: string
          resume_id: string | null
          roadmap: Json | null
          search_status: string | null
          selected_job_titles: string[]
          skill_gaps: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resume_id?: string | null
          roadmap?: Json | null
          search_status?: string | null
          selected_job_titles: string[]
          skill_gaps?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resume_id?: string | null
          roadmap?: Json | null
          search_status?: string | null
          selected_job_titles?: string[]
          skill_gaps?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_searches_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          extracted_skills: Json | null
          file_name: string
          file_url: string
          id: string
          parsed_content: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_skills?: Json | null
          file_name: string
          file_url: string
          id?: string
          parsed_content?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_skills?: Json | null
          file_name?: string
          file_url?: string
          id?: string
          parsed_content?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          day: number
          id: string
          job_title: string
          task_index: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          day: number
          id?: string
          job_title: string
          task_index: number
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          day?: number
          id?: string
          job_title?: string
          task_index?: number
          user_id?: string
        }
        Relationships: []
      }
      skill_roadmaps: {
        Row: {
          created_at: string
          estimated_weeks: number
          id: string
          job_title: string
          roadmap_data: Json
          skill_gaps: Json
          total_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_weeks?: number
          id?: string
          job_title: string
          roadmap_data?: Json
          skill_gaps?: Json
          total_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_weeks?: number
          id?: string
          job_title?: string
          roadmap_data?: Json
          skill_gaps?: Json
          total_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
