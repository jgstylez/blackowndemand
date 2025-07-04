export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ads: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          link_url: string
          cta_text: string
          background_color: string
          text_color: string
          is_active: boolean
          position: number
          size: string
          target_audience: string
          budget: number
          start_date: string
          end_date: string
          impressions: number
          clicks: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          link_url: string
          cta_text?: string
          background_color?: string
          text_color?: string
          is_active?: boolean
          position?: number
          size?: string
          target_audience?: string
          budget?: number
          start_date?: string
          end_date?: string
          impressions?: number
          clicks?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          link_url?: string
          cta_text?: string
          background_color?: string
          text_color?: string
          is_active?: boolean
          position?: number
          size?: string
          target_audience?: string
          budget?: number
          start_date?: string
          end_date?: string
          impressions?: number
          clicks?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string | null
          message: string
          link_url: string | null
          link_text: string | null
          is_active: boolean | null
          background_color: string | null
          text_color: string | null
          created_at: string | null
          updated_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          message: string
          link_url?: string | null
          link_text?: string | null
          is_active?: boolean | null
          background_color?: string | null
          text_color?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          message?: string
          link_url?: string | null
          link_text?: string | null
          is_active?: boolean | null
          background_color?: string | null
          text_color?: string | null
          created_at?: string | null
          updated_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      newsletter_issues: {
        Row: {
          id: string
          subject: string
          preview_text: string | null
          status: string
          scheduled_for: string | null
          sent_at: string | null
          html_content: string | null
          text_content: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          subject: string
          preview_text?: string | null
          status?: string
          scheduled_for?: string | null
          sent_at?: string | null
          html_content?: string | null
          text_content?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          subject?: string
          preview_text?: string | null
          status?: string
          scheduled_for?: string | null
          sent_at?: string | null
          html_content?: string | null
          text_content?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_issues_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      newsletter_content_items: {
        Row: {
          id: string
          newsletter_id: string
          type: string
          position: number
          title: string | null
          content: string | null
          image_url: string | null
          link_url: string | null
          business_id: string | null
          ad_id: string | null
          is_ai_generated: boolean | null
          ai_prompt: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          newsletter_id: string
          type: string
          position?: number
          title?: string | null
          content?: string | null
          image_url?: string | null
          link_url?: string | null
          business_id?: string | null
          ad_id?: string | null
          is_ai_generated?: boolean | null
          ai_prompt?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          newsletter_id?: string
          type?: string
          position?: number
          title?: string | null
          content?: string | null
          image_url?: string | null
          link_url?: string | null
          business_id?: string | null
          ad_id?: string | null
          is_ai_generated?: boolean | null
          ai_prompt?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_content_items_newsletter_id_fkey"
            columns: ["newsletter_id"]
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_content_items_business_id_fkey"
            columns: ["business_id"]
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_content_items_ad_id_fkey"
            columns: ["ad_id"]
            referencedRelation: "ads"
            referencedColumns: ["id"]
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          status: string
          source: string | null
          preferences: Json | null
          last_sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          first_name?: string | null
          last_name?: string | null
          status?: string
          source?: string | null
          preferences?: Json | null
          last_sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          status?: string
          source?: string | null
          preferences?: Json | null
          last_sent_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      // Other tables omitted for brevity
    }
    Views: {
      // Views omitted for brevity
    }
    Functions: {
      subscribe_to_newsletter: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_source?: string
        }
        Returns: boolean
      }
      unsubscribe_from_newsletter: {
        Args: {
          p_email: string
        }
        Returns: boolean
      }
      // Other functions omitted for brevity
    }
    Enums: {
      // Enums omitted for brevity
    }
    CompositeTypes: {
      // Composite types omitted for brevity
    }
  }
}