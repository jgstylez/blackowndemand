export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          ad_type: string
          business_id: string | null
          clicks_count: number | null
          created_at: string | null
          cta_text: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          impressions_count: number | null
          is_active: boolean | null
          link_url: string | null
          name: string
          placement_area: string | null
          position: number | null
          priority: number | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          ad_type: string
          business_id?: string | null
          clicks_count?: number | null
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          link_url?: string | null
          name: string
          placement_area?: string | null
          position?: number | null
          priority?: number | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          ad_type?: string
          business_id?: string | null
          clicks_count?: number | null
          created_at?: string | null
          cta_text?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          impressions_count?: number | null
          is_active?: boolean | null
          link_url?: string | null
          name?: string
          placement_area?: string | null
          position?: number | null
          priority?: number | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      announcements: {
        Row: {
          background_color: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          message: string
          text_color: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message: string
          text_color?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          message?: string
          text_color?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      business_actions: {
        Row: {
          action_type: string
          business_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          action_type: string
          business_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          action_type?: string
          business_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_actions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      business_amenities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      business_images: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          url: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          url: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_images_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      business_payment_methods: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      business_views: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          referrer: string | null
          user_agent: string | null
          viewer_ip: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewer_ip?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          referrer?: string | null
          user_agent?: string | null
          viewer_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_views_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      businesses: {
        Row: {
          amenities: string[] | null
          analytics_data: Json | null
          business_hours: Json | null
          categories: string[] | null
          category: Database["public"]["Enums"]["business_category_enum"] | null
          city: string | null
          claimed_at: string | null
          country: string | null
          created_at: string | null
          description: string | null
          email: string | null
          featured_position: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_claimed: boolean | null
          is_featured: boolean | null
          is_resource: boolean | null
          is_verified: boolean | null
          last_payment_date: string | null
          last_viewed_at: string | null
          migration_source: string | null
          name: string
          next_billing_date: string | null
          nmi_customer_vault_id: string | null
          nmi_subscription_id: string | null
          owner_id: string | null
          payment_method_last_four: string | null
          payment_methods: string[] | null
          phone: string | null
          plan_name: string | null
          promo_video_url: string | null
          social_links: Json | null
          state: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_id: string | null
          subscription_status: string | null
          tagline: string | null
          tags: Database["public"]["Enums"]["business_tag_enum"][] | null
          total_actions: number | null
          updated_at: string | null
          views_count: number | null
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          amenities?: string[] | null
          analytics_data?: Json | null
          business_hours?: Json | null
          categories?: string[] | null
          category?:
            | Database["public"]["Enums"]["business_category_enum"]
            | null
          city?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured_position?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_claimed?: boolean | null
          is_featured?: boolean | null
          is_resource?: boolean | null
          is_verified?: boolean | null
          last_payment_date?: string | null
          last_viewed_at?: string | null
          migration_source?: string | null
          name: string
          next_billing_date?: string | null
          nmi_customer_vault_id?: string | null
          nmi_subscription_id?: string | null
          owner_id?: string | null
          payment_method_last_four?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          plan_name?: string | null
          promo_video_url?: string | null
          social_links?: Json | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          tagline?: string | null
          tags?: Database["public"]["Enums"]["business_tag_enum"][] | null
          total_actions?: number | null
          updated_at?: string | null
          views_count?: number | null
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          amenities?: string[] | null
          analytics_data?: Json | null
          business_hours?: Json | null
          categories?: string[] | null
          category?:
            | Database["public"]["Enums"]["business_category_enum"]
            | null
          city?: string | null
          claimed_at?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          featured_position?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_claimed?: boolean | null
          is_featured?: boolean | null
          is_resource?: boolean | null
          is_verified?: boolean | null
          last_payment_date?: string | null
          last_viewed_at?: string | null
          migration_source?: string | null
          name?: string
          next_billing_date?: string | null
          nmi_customer_vault_id?: string | null
          nmi_subscription_id?: string | null
          owner_id?: string | null
          payment_method_last_four?: string | null
          payment_methods?: string[] | null
          phone?: string | null
          plan_name?: string | null
          promo_video_url?: string | null
          social_links?: Json | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_id?: string | null
          subscription_status?: string | null
          tagline?: string | null
          tags?: Database["public"]["Enums"]["business_tag_enum"][] | null
          total_actions?: number | null
          updated_at?: string | null
          views_count?: number | null
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "business_subscription_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["subscription_id"]
          },
          {
            foreignKeyName: "businesses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applies_to_plan: string | null
          code: string
          created_at: string | null
          current_uses: number | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applies_to_plan?: string | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applies_to_plan?: string | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      image_migration_log: {
        Row: {
          business_id: string | null
          column_name: string
          created_at: string | null
          error_message: string | null
          id: string
          migrated_at: string | null
          new_url: string | null
          old_url: string
          status: string
          table_name: string
        }
        Insert: {
          business_id?: string | null
          column_name: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          migrated_at?: string | null
          new_url?: string | null
          old_url: string
          status?: string
          table_name: string
        }
        Update: {
          business_id?: string | null
          column_name?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          migrated_at?: string | null
          new_url?: string | null
          old_url?: string
          status?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "image_migration_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "image_migration_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_migration_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      migration_sources: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      newsletter_content_items: {
        Row: {
          ad_id: string | null
          ai_prompt: string | null
          business_id: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          is_ai_generated: boolean | null
          link_url: string | null
          newsletter_id: string | null
          position: number
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          ad_id?: string | null
          ai_prompt?: string | null
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          link_url?: string | null
          newsletter_id?: string | null
          position?: number
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          ad_id?: string | null
          ai_prompt?: string | null
          business_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          link_url?: string | null
          newsletter_id?: string | null
          position?: number
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_content_items_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_content_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "newsletter_content_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_content_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "newsletter_content_items_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issues: {
        Row: {
          created_at: string | null
          created_by: string | null
          html_content: string | null
          id: string
          preview_text: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          subject: string
          text_content: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string | null
          id?: string
          preview_text?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          text_content?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          html_content?: string | null
          id?: string
          preview_text?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          text_content?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          last_sent_at: string | null
          preferences: Json | null
          source: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_sent_at?: string | null
          preferences?: Json | null
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          last_sent_at?: string | null
          preferences?: Json | null
          source?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string | null
          id: string
          nmi_transaction_id: string | null
          response_text: string | null
          status: string
          type: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string | null
          id?: string
          nmi_transaction_id?: string | null
          response_text?: string | null
          status: string
          type: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string | null
          id?: string
          nmi_transaction_id?: string | null
          response_text?: string | null
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "payment_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          original_plan_id: string | null
          promotional_price: number
          start_date: string
          target_audience: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          original_plan_id?: string | null
          promotional_price: number
          start_date?: string
          target_audience?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          original_plan_id?: string | null
          promotional_price?: number
          start_date?: string
          target_audience?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_original_plan_id_fkey"
            columns: ["original_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          category_limit: number
          created_at: string | null
          features: Json
          id: string
          image_limit: number
          interval: string
          name: string
          price: number
          updated_at: string | null
        }
        Insert: {
          category_limit?: number
          created_at?: string | null
          features: Json
          id?: string
          image_limit?: number
          interval: string
          name: string
          price: number
          updated_at?: string | null
        }
        Update: {
          category_limit?: number
          created_at?: string | null
          features?: Json
          id?: string
          image_limit?: number
          interval?: string
          name?: string
          price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          business_id: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          payment_status: string
          plan_id: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          payment_status?: string
          plan_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          payment_status?: string
          plan_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "user_bookmarks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bookmarks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          business_id: string | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
        }
        Insert: {
          business_id?: string | null
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
        }
        Update: {
          business_id?: string | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "verification_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
      vip_member: {
        Row: {
          benefits: Json | null
          business_id: string
          created_at: string | null
          joined_at: string | null
        }
        Insert: {
          benefits?: Json | null
          business_id: string
          created_at?: string | null
          joined_at?: string | null
        }
        Update: {
          benefits?: Json | null
          business_id?: string
          created_at?: string | null
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "founder_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "founder_status_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
        ]
      }
    }
    Views: {
      business_analytics: {
        Row: {
          business_id: string | null
          created_at: string | null
          is_featured: boolean | null
          is_verified: boolean | null
          name: string | null
          subscription_status: string | null
          total_actions: number | null
          views_count: number | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          subscription_status?: string | null
          total_actions?: number | null
          views_count?: number | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          name?: string | null
          subscription_status?: string | null
          total_actions?: number | null
          views_count?: number | null
        }
        Relationships: []
      }
      business_category_enum_values: {
        Row: {
          category_value: unknown | null
          sort_order: number | null
        }
        Relationships: []
      }
      business_subscription_view: {
        Row: {
          business_id: string | null
          business_name: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string | null
          owner_id: string | null
          payment_status: string | null
          plan_id: string | null
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_email: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_analytics"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "paid_subscriptions_overview"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      paid_subscriptions_overview: {
        Row: {
          business_id: string | null
          business_name: string | null
          owner_email: string | null
          owner_id: string | null
          payment_status: string | null
          plan_id: string | null
          status: string | null
          subscription_created_at: string | null
          subscription_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_bookmark: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      apply_discount_code: {
        Args: { p_code: string }
        Returns: boolean
      }
      assign_user_role: {
        Args: {
          target_user_id: string
          role_name: string
          assigned_by_user_id?: string
        }
        Returns: undefined
      }
      bulk_update_business_status: {
        Args: { business_ids: string[]; new_status: boolean }
        Returns: undefined
      }
      check_image_limit: {
        Args: { business_id: string; max_images?: number }
        Returns: boolean
      }
      claim_business: {
        Args:
          | { business_id: string; user_id: string }
          | {
              business_id: string
              user_id: string
              new_subscription_id: string
            }
        Returns: undefined
      }
      debug_business_visibility: {
        Args: { business_uuid: string }
        Returns: {
          business_id: string
          business_name: string
          is_active: boolean
          is_verified: boolean
          migration_source: string
          claimed_at: string
          owner_id: string
          visible_to_public: boolean
          visibility_reason: string
        }[]
      }
      delete_user_account: {
        Args: { user_uuid?: string }
        Returns: undefined
      }
      fix_business_visibility: {
        Args: { business_uuid: string }
        Returns: string
      }
      get_active_announcement: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          title: string
          message: string
          link_url: string
          link_text: string
          background_color: string
          text_color: string
        }[]
      }
      get_active_promotion_for_plan: {
        Args: { plan_name: string }
        Returns: {
          id: string
          name: string
          description: string
          original_plan_id: string
          original_plan_name: string
          original_price: number
          promotional_price: number
          start_date: string
          end_date: string
          savings_amount: number
          savings_percentage: number
        }[]
      }
      get_active_promotions: {
        Args: { audience?: string }
        Returns: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          original_plan_id: string | null
          promotional_price: number
          start_date: string
          target_audience: string
          updated_at: string | null
        }[]
      }
      get_all_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: Json[]
      }
      get_business_categories_with_count: {
        Args: { p_active_only?: boolean; p_verified_only?: boolean }
        Returns: {
          category: string
          count: number
          label: string
        }[]
      }
      get_business_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_businesses: number
          active_businesses: number
          inactive_businesses: number
          verified_businesses: number
          featured_businesses: number
          founder_businesses: number
          unclaimed_businesses: number
        }[]
      }
      get_businesses_with_plan_details: {
        Args: {
          p_is_active?: boolean
          p_is_featured?: boolean
          p_subscription_plans?: string
          p_business_id?: string
          p_search_term?: string
          p_category?: string
          p_location?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          id: string
          name: string
          tagline: string
          description: string
          category: Database["public"]["Enums"]["business_category_enum"]
          is_verified: boolean
          is_featured: boolean
          is_active: boolean
          city: string
          state: string
          zip_code: string
          country: string
          website_url: string
          phone: string
          email: string
          image_url: string
          promo_video_url: string
          social_links: Json
          business_hours: Json
          amenities: string[]
          payment_methods: string[]
          categories: string[]
          tags: Database["public"]["Enums"]["business_tag_enum"][]
          created_at: string
          updated_at: string
          owner_id: string
          subscription_id: string
          is_claimed: boolean
          claimed_at: string
          migration_source: string
          is_resource: boolean
          subscription_status: string
          nmi_subscription_id: string
          nmi_customer_vault_id: string
          next_billing_date: string
          last_payment_date: string
          payment_method_last_four: string
          featured_position: number
          views_count: number
          last_viewed_at: string
          analytics_data: Json
          total_actions: number
          subscription_plans: string
          total_count: number
        }[]
      }
      get_businesses_with_plan_details_v2: {
        Args:
          | {
              p_is_featured?: boolean
              p_is_active?: boolean
              p_subscription_plans?: string
              p_limit?: number
            }
          | {
              p_subscription_plans?: string
              p_is_active?: boolean
              p_limit?: number
            }
        Returns: {
          id: string
          name: string
          tagline: string
          description: string
          category: Database["public"]["Enums"]["business_category_enum"]
          is_verified: boolean
          is_featured: boolean
          is_active: boolean
          city: string
          state: string
          zip_code: string
          country: string
          website_url: string
          phone: string
          email: string
          image_url: string
          promo_video_url: string
          social_links: Json
          business_hours: Json
          amenities: string[]
          payment_methods: string[]
          categories: string[]
          tags: Database["public"]["Enums"]["business_tag_enum"][]
          created_at: string
          updated_at: string
          owner_id: string
          subscription_id: string
          is_claimed: boolean
          claimed_at: string
          migration_source: string
          is_resource: boolean
          subscription_status: string
          nmi_subscription_id: string
          nmi_customer_vault_id: string
          next_billing_date: string
          last_payment_date: string
          payment_method_last_four: string
          featured_position: number
          views_count: number
          last_viewed_at: string
          analytics_data: Json
          total_actions: number
          subscription_plans: string
          total_count: number
        }[]
      }
      get_enum_values: {
        Args: { enum_name: string }
        Returns: string[]
      }
      get_feature_flag_status: {
        Args: { flag_name: string }
        Returns: boolean
      }
      get_subscription_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_subscriptions: number
          active_subscriptions: number
          revenue_this_month: number
          revenue_total: number
          starter_plan_count: number
          enhanced_plan_count: number
          vip_plan_count: number
        }[]
      }
      get_user_bookmarks: {
        Args: { p_user_id?: string }
        Returns: {
          business_id: string
          created_at: string
        }[]
      }
      get_user_profile: {
        Args: { user_uuid?: string }
        Returns: Json
      }
      has_role: {
        Args: { p_user_id: string; p_role_name: string }
        Returns: boolean
      }
      increment_ad_clicks: {
        Args: { ad_id: string }
        Returns: undefined
      }
      increment_ad_impressions: {
        Args: { ad_id: string }
        Returns: undefined
      }
      increment_business_actions: {
        Args: { business_id: string }
        Returns: undefined
      }
      increment_business_views: {
        Args: { business_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_bookmarked: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      is_editor: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      mark_migration_complete: {
        Args: { p_business_id: string; p_new_url: string }
        Returns: undefined
      }
      prepare_account_deletion: {
        Args: { user_uuid?: string }
        Returns: Json
      }
      record_business_action: {
        Args:
          | { business_id: string; action_type: string }
          | { business_id: string; action_type: string; action_data?: Json }
        Returns: undefined
      }
      remove_bookmark: {
        Args: { p_business_id: string }
        Returns: boolean
      }
      remove_user_role: {
        Args:
          | { p_user_id: string; p_role_name: string }
          | {
              target_user_id: string
              role_name: string
              removed_by_user_id?: string
            }
        Returns: boolean
      }
      subscribe_to_newsletter: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_source?: string
        }
        Returns: boolean
      }
      sync_user_profile_from_metadata: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      toggle_feature_flag: {
        Args: { flag_name: string; new_status: boolean }
        Returns: boolean
      }
      unsubscribe_from_newsletter: {
        Args: { p_email: string }
        Returns: boolean
      }
      validate_business_data: {
        Args: { business_id: string; business_name: string }
        Returns: boolean
      }
      validate_discount_code: {
        Args: { p_code: string; p_plan_name?: string }
        Returns: Json
      }
      verify_business_code: {
        Args: { p_business_id: string; p_email: string; p_code: string }
        Returns: boolean
      }
    }
    Enums: {
      business_category_enum:
        | "Arts, Crafts & Party Supplies"
        | "Auto, Tires & Industrial"
        | "Baby"
        | "Beauty & Cosmetics"
        | "Clothing, Shoes & Accessories"
        | "Electronics & Audio"
        | "Exercise & Fitness"
        | "Food & Beverage"
        | "Furniture & Appliances"
        | "Grocery"
        | "Home Improvements & Decor"
        | "Household Essentials"
        | "Jewelry & Watches"
        | "Miscellaneous"
        | "Music, Movies & Books"
        | "Patio & Garden"
        | "Personal Care"
        | "Pets"
        | "Pharmacy, Health & Wellness"
        | "Sports & Outdoors"
        | "Stationery & Office Supplies"
        | "Toys & Games"
        | "Travel & Transportation"
        | "Wine, Spirits & Liquor"
        | "Cell Phones & Accessories"
        | "Tools & Hardware"
        | "Digital Products"
        | "Luggage & Bags"
        | "Outdoor & Camping Equipment"
        | "Home Security & Smart Devices"
        | "Subscription Boxes"
        | "Event Tickets & Experiences"
        | "Seasonal & Holiday Items"
        | "Vintage & Collectibles"
        | "Craft Kits & DIY Projects"
        | "Religious & Spiritual"
        | "Office Furniture"
        | "Cleaning Supplies"
        | "Bedding & Linens"
        | "Kitchenware & Cookware"
        | "Mobile Apps & Software Licenses"
        | "Education"
        | "Gardening Tools & Supplies"
        | "Directory"
        | "Content Creation"
        | "Professional Services"
        | "Real Estate"
        | "Child Care & Day Care"
        | "Technology"
        | "Finance & Payments"
        | "Gifts & Greeting Cards"
        | "Restaurants, Bars & Lounge"
        | "Medical & Healthcare"
        | "Film & Production"
        | "Health & Wellness"
        | "Financial Institution"
        | "Merchant Services"
        | "Office Supplies"
        | "Nonprofit"
        | "Trade Association"
        | "Chamber"
        | "Influencer"
        | "Insurance"
      business_tag_enum:
        | "Art Supplies"
        | "Party Supplies"
        | "Custom Invitations"
        | "Kids Crafts"
        | "Seasonal Crafts"
        | "Paint Brushes"
        | "Canvas Boards"
        | "Glue Glitter"
        | "DIY Kits"
        | "Craft Classes"
        | "Car Parts"
        | "Auto Accessories"
        | "Motor Oil"
        | "Tire Services"
        | "Car Audio"
        | "Car Wash Kits"
        | "Garage Equipment"
        | "Repair Tools"
        | "Jump Starters"
        | "LED Headlights"
        | "Baby Clothes"
        | "Strollers Car Seats"
        | "Diapers Wipes"
        | "Nursery Decor"
        | "Baby Monitors"
        | "Feeding Sets"
        | "Teething Toys"
        | "Cribs Bassinets"
        | "Maternity Wear"
        | "Baby Books"
        | "Skincare Sets"
        | "Lipsticks"
        | "Fragrances Perfume"
        | "Hair Styling Tools"
        | "Nail Polish"
        | "Facial Masks"
        | "Makeup Brushes"
        | "Organic Beauty"
        | "Barber Kits"
        | "Eyebrow Kits"
        | "Womens Fashion"
        | "Menswear"
        | "Sneakers"
        | "Fashion Accessories"
        | "Designer Bags"
        | "Jewelry Sets"
        | "Plus Size Wear"
        | "Hats Scarves"
        | "Denim Wear"
        | "Kids Fashion"
        | "Laptops Computers"
        | "Smartphones"
        | "Bluetooth Speakers"
        | "TV Monitors"
        | "Home Security Cams"
        | "Video Doorbells"
        | "Gaming Consoles"
        | "Headphones"
        | "Charging Stations"
        | "Tech Accessories"
        | "Dumbbells"
        | "Yoga Mats"
        | "Resistance Bands"
        | "Stationary Bikes"
        | "Protein Shakes"
        | "Foam Rollers"
        | "Home Gyms"
        | "Fitness Timers"
        | "Gym Clothes"
        | "Bodyweight Bars"
        | "Gourmet Snacks"
        | "Meal Kits"
        | "Ethnic Foods"
        | "Coffee Blends"
        | "Vegan Treats"
        | "Cooking Ingredients"
        | "Artisan Bread"
        | "Spices Rubs"
        | "Shelf Stable Meals"
        | "Beverage Variety"
        | "Sofas"
        | "Dining Tables"
        | "Microwaves"
        | "Refrigerators"
        | "Bed Frames"
        | "Closet Organizers"
        | "TV Stands"
        | "Washer Dryer Sets"
        | "Ottomans"
        | "Futon Couches"
        | "Organic Veggies"
        | "Pantry Items"
        | "Frozen Goods"
        | "Deli Items"
        | "Dairy Eggs"
        | "Snack Packs"
        | "Baking Goods"
        | "Grocery Bundles"
        | "Cereal Boxes"
        | "Grains Legumes"
        | "Wall Paint"
        | "Light Fixtures"
        | "Wall Art"
        | "Floor Tiles"
        | "Toolkits"
        | "Faucets Fixtures"
        | "Kitchen Sinks"
        | "Window Blinds"
        | "Home Decor Bundles"
        | "Remodeling Services"
        | "Paper Towels"
        | "Toilet Paper"
        | "Cleaning Sprays"
        | "Laundry Detergents"
        | "Mops Brooms"
        | "Disinfectant Wipes"
        | "Trash Bags"
        | "Air Fresheners"
        | "Dish Soap"
        | "Bathroom Cleaners"
        | "Wedding Rings"
        | "Luxury Watches"
        | "Pendants"
        | "Bracelets"
        | "Custom Jewelry"
        | "Earrings"
        | "Engagement Rings"
        | "Gems"
        | "Jewelry Storage"
        | "Watch Batteries"
        | "Musical Instruments"
        | "Record Vinyl"
        | "Audiobooks"
        | "Book Club"
        | "Piano Lessons"
        | "Guitar Straps"
        | "MP3 Downloads"
        | "Movie Night Bundles"
        | "CD DVD"
        | "Blu Ray Collections"
        | "Outdoor Chairs"
        | "Garden Lights"
        | "Grills BBQ"
        | "Planters Pots"
        | "Patio Sets"
        | "Shade Umbrellas"
        | "Outdoor Rugs"
        | "Deck Tiles"
        | "Fire Pits"
        | "Gazebo Kits"
        | "Razors Shaving"
        | "Body Wash"
        | "Deodorants"
        | "Toothbrush Sets"
        | "Hair Removal Kits"
        | "Cotton Swabs"
        | "Face Rollers"
        | "Sunscreen Lotions"
        | "Nail Tools"
        | "Towel Sets"
        | "Pet Food"
        | "Dog Clothes"
        | "Cat Trees"
        | "Pet Beds"
        | "Collars Leashes"
        | "Aquarium Kits"
        | "Grooming Supplies"
        | "Pet Toys"
        | "Pet Treats"
        | "Litter Boxes"
        | "Vitamins Supplements"
        | "Pain Relievers"
        | "First Aid Kits"
        | "Thermometers"
        | "Personal Protection"
        | "Wellness Kits"
        | "Bandages"
        | "Heating Pads"
        | "Sleep Aids"
        | "Sanitizers"
        | "Camping Gear"
        | "Kayaks"
        | "Hiking Boots"
        | "Sportswear"
        | "Outdoor Tools"
        | "Tennis Rackets"
        | "Bikes Scooters"
        | "Golf Accessories"
        | "Winter Sports Gear"
        | "Fishing Equipment"
        | "Notebooks"
        | "Pens Pencils"
        | "Folders"
        | "Printer Paper"
        | "Filing Systems"
        | "Whiteboards"
        | "Labels Stickers"
        | "Office Gadgets"
        | "Envelopes"
        | "Stationery Sets"
        | "Board Games"
        | "Video Games"
        | "Puzzles"
        | "Dolls"
        | "RC Toys"
        | "Building Blocks"
        | "Kids Books"
        | "Outdoor Playsets"
        | "Science Kits"
        | "Toy Storage"
        | "Luggage Sets"
        | "Carry Ons"
        | "Packing Cubes"
        | "Travel Pillows"
        | "Adapters Converters"
        | "Passport Holders"
        | "Travel Backpacks"
        | "Travel Size Toiletries"
        | "Duffel Bags"
        | "Luggage Tags"
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
      business_category_enum: [
        "Arts, Crafts & Party Supplies",
        "Auto, Tires & Industrial",
        "Baby",
        "Beauty & Cosmetics",
        "Clothing, Shoes & Accessories",
        "Electronics & Audio",
        "Exercise & Fitness",
        "Food & Beverage",
        "Furniture & Appliances",
        "Grocery",
        "Home Improvements & Decor",
        "Household Essentials",
        "Jewelry & Watches",
        "Miscellaneous",
        "Music, Movies & Books",
        "Patio & Garden",
        "Personal Care",
        "Pets",
        "Pharmacy, Health & Wellness",
        "Sports & Outdoors",
        "Stationery & Office Supplies",
        "Toys & Games",
        "Travel & Transportation",
        "Wine, Spirits & Liquor",
        "Cell Phones & Accessories",
        "Tools & Hardware",
        "Digital Products",
        "Luggage & Bags",
        "Outdoor & Camping Equipment",
        "Home Security & Smart Devices",
        "Subscription Boxes",
        "Event Tickets & Experiences",
        "Seasonal & Holiday Items",
        "Vintage & Collectibles",
        "Craft Kits & DIY Projects",
        "Religious & Spiritual",
        "Office Furniture",
        "Cleaning Supplies",
        "Bedding & Linens",
        "Kitchenware & Cookware",
        "Mobile Apps & Software Licenses",
        "Education",
        "Gardening Tools & Supplies",
        "Directory",
        "Content Creation",
        "Professional Services",
        "Real Estate",
        "Child Care & Day Care",
        "Technology",
        "Finance & Payments",
        "Gifts & Greeting Cards",
        "Restaurants, Bars & Lounge",
        "Medical & Healthcare",
        "Film & Production",
        "Health & Wellness",
        "Financial Institution",
        "Merchant Services",
        "Office Supplies",
        "Nonprofit",
        "Trade Association",
        "Chamber",
        "Influencer",
        "Insurance",
      ],
      business_tag_enum: [
        "Art Supplies",
        "Party Supplies",
        "Custom Invitations",
        "Kids Crafts",
        "Seasonal Crafts",
        "Paint Brushes",
        "Canvas Boards",
        "Glue Glitter",
        "DIY Kits",
        "Craft Classes",
        "Car Parts",
        "Auto Accessories",
        "Motor Oil",
        "Tire Services",
        "Car Audio",
        "Car Wash Kits",
        "Garage Equipment",
        "Repair Tools",
        "Jump Starters",
        "LED Headlights",
        "Baby Clothes",
        "Strollers Car Seats",
        "Diapers Wipes",
        "Nursery Decor",
        "Baby Monitors",
        "Feeding Sets",
        "Teething Toys",
        "Cribs Bassinets",
        "Maternity Wear",
        "Baby Books",
        "Skincare Sets",
        "Lipsticks",
        "Fragrances Perfume",
        "Hair Styling Tools",
        "Nail Polish",
        "Facial Masks",
        "Makeup Brushes",
        "Organic Beauty",
        "Barber Kits",
        "Eyebrow Kits",
        "Womens Fashion",
        "Menswear",
        "Sneakers",
        "Fashion Accessories",
        "Designer Bags",
        "Jewelry Sets",
        "Plus Size Wear",
        "Hats Scarves",
        "Denim Wear",
        "Kids Fashion",
        "Laptops Computers",
        "Smartphones",
        "Bluetooth Speakers",
        "TV Monitors",
        "Home Security Cams",
        "Video Doorbells",
        "Gaming Consoles",
        "Headphones",
        "Charging Stations",
        "Tech Accessories",
        "Dumbbells",
        "Yoga Mats",
        "Resistance Bands",
        "Stationary Bikes",
        "Protein Shakes",
        "Foam Rollers",
        "Home Gyms",
        "Fitness Timers",
        "Gym Clothes",
        "Bodyweight Bars",
        "Gourmet Snacks",
        "Meal Kits",
        "Ethnic Foods",
        "Coffee Blends",
        "Vegan Treats",
        "Cooking Ingredients",
        "Artisan Bread",
        "Spices Rubs",
        "Shelf Stable Meals",
        "Beverage Variety",
        "Sofas",
        "Dining Tables",
        "Microwaves",
        "Refrigerators",
        "Bed Frames",
        "Closet Organizers",
        "TV Stands",
        "Washer Dryer Sets",
        "Ottomans",
        "Futon Couches",
        "Organic Veggies",
        "Pantry Items",
        "Frozen Goods",
        "Deli Items",
        "Dairy Eggs",
        "Snack Packs",
        "Baking Goods",
        "Grocery Bundles",
        "Cereal Boxes",
        "Grains Legumes",
        "Wall Paint",
        "Light Fixtures",
        "Wall Art",
        "Floor Tiles",
        "Toolkits",
        "Faucets Fixtures",
        "Kitchen Sinks",
        "Window Blinds",
        "Home Decor Bundles",
        "Remodeling Services",
        "Paper Towels",
        "Toilet Paper",
        "Cleaning Sprays",
        "Laundry Detergents",
        "Mops Brooms",
        "Disinfectant Wipes",
        "Trash Bags",
        "Air Fresheners",
        "Dish Soap",
        "Bathroom Cleaners",
        "Wedding Rings",
        "Luxury Watches",
        "Pendants",
        "Bracelets",
        "Custom Jewelry",
        "Earrings",
        "Engagement Rings",
        "Gems",
        "Jewelry Storage",
        "Watch Batteries",
        "Musical Instruments",
        "Record Vinyl",
        "Audiobooks",
        "Book Club",
        "Piano Lessons",
        "Guitar Straps",
        "MP3 Downloads",
        "Movie Night Bundles",
        "CD DVD",
        "Blu Ray Collections",
        "Outdoor Chairs",
        "Garden Lights",
        "Grills BBQ",
        "Planters Pots",
        "Patio Sets",
        "Shade Umbrellas",
        "Outdoor Rugs",
        "Deck Tiles",
        "Fire Pits",
        "Gazebo Kits",
        "Razors Shaving",
        "Body Wash",
        "Deodorants",
        "Toothbrush Sets",
        "Hair Removal Kits",
        "Cotton Swabs",
        "Face Rollers",
        "Sunscreen Lotions",
        "Nail Tools",
        "Towel Sets",
        "Pet Food",
        "Dog Clothes",
        "Cat Trees",
        "Pet Beds",
        "Collars Leashes",
        "Aquarium Kits",
        "Grooming Supplies",
        "Pet Toys",
        "Pet Treats",
        "Litter Boxes",
        "Vitamins Supplements",
        "Pain Relievers",
        "First Aid Kits",
        "Thermometers",
        "Personal Protection",
        "Wellness Kits",
        "Bandages",
        "Heating Pads",
        "Sleep Aids",
        "Sanitizers",
        "Camping Gear",
        "Kayaks",
        "Hiking Boots",
        "Sportswear",
        "Outdoor Tools",
        "Tennis Rackets",
        "Bikes Scooters",
        "Golf Accessories",
        "Winter Sports Gear",
        "Fishing Equipment",
        "Notebooks",
        "Pens Pencils",
        "Folders",
        "Printer Paper",
        "Filing Systems",
        "Whiteboards",
        "Labels Stickers",
        "Office Gadgets",
        "Envelopes",
        "Stationery Sets",
        "Board Games",
        "Video Games",
        "Puzzles",
        "Dolls",
        "RC Toys",
        "Building Blocks",
        "Kids Books",
        "Outdoor Playsets",
        "Science Kits",
        "Toy Storage",
        "Luggage Sets",
        "Carry Ons",
        "Packing Cubes",
        "Travel Pillows",
        "Adapters Converters",
        "Passport Holders",
        "Travel Backpacks",
        "Travel Size Toiletries",
        "Duffel Bags",
        "Luggage Tags",
      ],
    },
  },
} as const
