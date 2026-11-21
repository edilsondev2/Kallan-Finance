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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          balance: number
          balance_updated_at: string
          connection_id: string | null
          created_at: string
          currency: string
          external_id: string | null
          id: string
          institution_name: string | null
          name: string
          source: Database["public"]["Enums"]["data_source"]
          type: Database["public"]["Enums"]["account_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          balance_updated_at?: string
          connection_id?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          institution_name?: string | null
          name: string
          source?: Database["public"]["Enums"]["data_source"]
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          balance_updated_at?: string
          connection_id?: string | null
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          institution_name?: string | null
          name?: string
          source?: Database["public"]["Enums"]["data_source"]
          type?: Database["public"]["Enums"]["account_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "of_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_steps: {
        Row: {
          description: string | null
          done: boolean
          done_at: string | null
          id: string
          plan_id: string
          position: number
          title: string
          user_id: string
        }
        Insert: {
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: string
          plan_id: string
          position?: number
          title: string
          user_id: string
        }
        Update: {
          description?: string | null
          done?: boolean
          done_at?: string | null
          id?: string
          plan_id?: string
          position?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_steps_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          created_at: string
          diagnostic_id: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          diagnostic_id?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          diagnostic_id?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "diagnostics"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          agent: string
          business_id: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent?: string
          business_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent?: string
          business_id?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          payload: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          payload?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          payload?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          metadata: Json
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      balance_snapshots: {
        Row: {
          account_id: string
          balance: number
          captured_at: string
          id: string
          user_id: string
        }
        Insert: {
          account_id: string
          balance: number
          captured_at?: string
          id?: string
          user_id: string
        }
        Update: {
          account_id?: string
          balance?: number
          captured_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "balance_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_entries: {
        Row: {
          amount: number
          business_id: string
          category_id: string | null
          created_at: string
          description: string
          id: string
          kind: Database["public"]["Enums"]["entry_kind"]
          notes: string | null
          occurred_on: string
          recurrence: Database["public"]["Enums"]["recurrence"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          business_id: string
          category_id?: string | null
          created_at?: string
          description: string
          id?: string
          kind: Database["public"]["Enums"]["entry_kind"]
          notes?: string | null
          occurred_on?: string
          recurrence?: Database["public"]["Enums"]["recurrence"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["entry_kind"]
          notes?: string | null
          occurred_on?: string
          recurrence?: Database["public"]["Enums"]["recurrence"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_entries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          business_type: string | null
          category: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          instagram: string | null
          is_public: boolean
          name: string
          owner_id: string
          region: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          business_type?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instagram?: string | null
          is_public?: boolean
          name: string
          owner_id: string
          region?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_type?: string | null
          category?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          instagram?: string | null
          is_public?: boolean
          name?: string
          owner_id?: string
          region?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      card_invoices: {
        Row: {
          amount: number
          card_id: string
          created_at: string
          due_date: string | null
          external_id: string | null
          id: string
          reference_month: string
          source: Database["public"]["Enums"]["data_source"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          card_id: string
          created_at?: string
          due_date?: string | null
          external_id?: string | null
          id?: string
          reference_month: string
          source?: Database["public"]["Enums"]["data_source"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          card_id?: string
          created_at?: string
          due_date?: string | null
          external_id?: string | null
          id?: string
          reference_month?: string
          source?: Database["public"]["Enums"]["data_source"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_invoices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          business_id: string | null
          color: string
          created_at: string
          icon: string
          id: string
          kind: Database["public"]["Enums"]["category_kind"]
          name: string
          scope: Database["public"]["Enums"]["category_scope"]
          user_id: string | null
        }
        Insert: {
          business_id?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind?: Database["public"]["Enums"]["category_kind"]
          name: string
          scope?: Database["public"]["Enums"]["category_scope"]
          user_id?: string | null
        }
        Update: {
          business_id?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          kind?: Database["public"]["Enums"]["category_kind"]
          name?: string
          scope?: Database["public"]["Enums"]["category_scope"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_cards: {
        Row: {
          available_limit: number | null
          brand: string | null
          closing_day: number | null
          connection_id: string | null
          created_at: string
          credit_limit: number | null
          due_day: number | null
          external_id: string | null
          id: string
          institution_name: string | null
          last_four: string | null
          name: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          available_limit?: number | null
          brand?: string | null
          closing_day?: number | null
          connection_id?: string | null
          created_at?: string
          credit_limit?: number | null
          due_day?: number | null
          external_id?: string | null
          id?: string
          institution_name?: string | null
          last_four?: string | null
          name: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          available_limit?: number | null
          brand?: string | null
          closing_day?: number | null
          connection_id?: string | null
          created_at?: string
          credit_limit?: number | null
          due_day?: number | null
          external_id?: string | null
          id?: string
          institution_name?: string | null
          last_four?: string | null
          name?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_cards_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "of_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnostics: {
        Row: {
          conversation_id: string | null
          created_at: string
          data_quality: Json
          explanation: string | null
          id: string
          kind: string
          metrics: Json
          reference_date: string
          title: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          data_quality?: Json
          explanation?: string | null
          id?: string
          kind: string
          metrics?: Json
          reference_date?: string
          title: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          data_quality?: Json
          explanation?: string | null
          id?: string
          kind?: string
          metrics?: Json
          reference_date?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_hidden: boolean
          is_online: boolean
          kind: Database["public"]["Enums"]["event_kind"]
          link: string | null
          location: string | null
          starts_at: string | null
          title: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          is_online?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          link?: string | null
          location?: string | null
          starts_at?: string | null
          title: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          is_online?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          link?: string | null
          location?: string | null
          starts_at?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          contributed_on: string
          created_at: string
          goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contributed_on?: string
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          contributed_on?: string
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          business_id: string | null
          completed_at: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          icon: string
          id: string
          scope: Database["public"]["Enums"]["goal_scope"]
          status: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          icon?: string
          id?: string
          scope?: Database["public"]["Enums"]["goal_scope"]
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          icon?: string
          id?: string
          scope?: Database["public"]["Enums"]["goal_scope"]
          status?: Database["public"]["Enums"]["goal_status"]
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          products: string[]
          provider: string
          provider_institution_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          products?: string[]
          provider: string
          provider_institution_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          products?: string[]
          provider?: string
          provider_institution_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          connection_id: string | null
          created_at: string
          external_id: string | null
          id: string
          institution_name: string | null
          invested_amount: number | null
          kind: string
          name: string
          position_date: string
          source: Database["public"]["Enums"]["data_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          connection_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          institution_name?: string | null
          invested_amount?: number | null
          kind?: string
          name: string
          position_date?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          connection_id?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          institution_name?: string | null
          invested_amount?: number | null
          kind?: string
          name?: string
          position_date?: string
          source?: Database["public"]["Enums"]["data_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "of_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      of_connections: {
        Row: {
          created_at: string
          id: string
          institution_id: string | null
          institution_name: string
          last_sync_at: string | null
          provider: string
          provider_item_id: string | null
          status: Database["public"]["Enums"]["connection_status"]
          status_detail: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name: string
          last_sync_at?: string | null
          provider: string
          provider_item_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          status_detail?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string | null
          institution_name?: string
          last_sync_at?: string | null
          provider?: string
          provider_item_id?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          status_detail?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "of_connections_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      of_consents: {
        Row: {
          connection_id: string
          created_at: string
          expires_at: string | null
          granted_at: string | null
          id: string
          permissions: string[]
          provider_consent_id: string | null
          purpose: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          permissions?: string[]
          provider_consent_id?: string | null
          purpose?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string | null
          id?: string
          permissions?: string[]
          provider_consent_id?: string | null
          purpose?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "of_consents_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "of_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          kind: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kind?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          business_id: string | null
          comments_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_hidden: boolean
          kind: Database["public"]["Enums"]["post_kind"]
          likes_count: number
          shared_post_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          business_id?: string | null
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          kind?: Database["public"]["Enums"]["post_kind"]
          likes_count?: number
          shared_post_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          business_id?: string | null
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_hidden?: boolean
          kind?: Database["public"]["Enums"]["post_kind"]
          likes_count?: number
          shared_post_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_shared_post_id_fkey"
            columns: ["shared_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          display_name: string
          id: string
          segment: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id: string
          segment?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          display_name?: string
          id?: string
          segment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string | null
          amount: number
          card_id: string | null
          category_id: string | null
          created_at: string
          description: string
          direction: Database["public"]["Enums"]["tx_direction"]
          external_id: string | null
          id: string
          institution_name: string | null
          notes: string | null
          occurred_on: string
          source: Database["public"]["Enums"]["data_source"]
          type: Database["public"]["Enums"]["tx_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          description: string
          direction: Database["public"]["Enums"]["tx_direction"]
          external_id?: string | null
          id?: string
          institution_name?: string | null
          notes?: string | null
          occurred_on?: string
          source?: Database["public"]["Enums"]["data_source"]
          type?: Database["public"]["Enums"]["tx_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          card_id?: string | null
          category_id?: string | null
          created_at?: string
          description?: string
          direction?: Database["public"]["Enums"]["tx_direction"]
          external_id?: string | null
          id?: string
          institution_name?: string | null
          notes?: string | null
          occurred_on?: string
          source?: Database["public"]["Enums"]["data_source"]
          type?: Database["public"]["Enums"]["tx_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      user_settings: {
        Row: {
          hide_values: boolean
          main_goal: Database["public"]["Enums"]["main_goal"] | null
          notify_community: boolean
          notify_insights: boolean
          onboarding_completed: boolean
          plan: string
          show_demo: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          hide_values?: boolean
          main_goal?: Database["public"]["Enums"]["main_goal"] | null
          notify_community?: boolean
          notify_insights?: boolean
          onboarding_completed?: boolean
          plan?: string
          show_demo?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          hide_values?: boolean
          main_goal?: Database["public"]["Enums"]["main_goal"] | null
          notify_community?: boolean
          notify_insights?: boolean
          onboarding_completed?: boolean
          plan?: string
          show_demo?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_my_data: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked_between: { Args: { _a: string; _b: string }; Returns: boolean }
      is_moderator: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_type: "checking" | "savings" | "wallet" | "other"
      app_role: "admin" | "moderator" | "user"
      category_kind: "expense" | "income"
      category_scope: "personal" | "business"
      connection_status:
        | "preparing"
        | "awaiting_authorization"
        | "connecting"
        | "syncing"
        | "verifying"
        | "completed"
        | "failed"
        | "consent_expired"
        | "revoked"
      data_source: "manual" | "open_finance"
      entry_kind: "revenue" | "expense"
      event_kind: "event" | "course" | "fair" | "partnership" | "opportunity"
      goal_scope: "personal" | "business"
      goal_status: "active" | "completed" | "archived"
      main_goal:
        | "organize"
        | "understand_spending"
        | "investments"
        | "business"
        | "all"
      post_kind: "general" | "business" | "question" | "experience" | "news"
      recurrence: "none" | "weekly" | "monthly" | "yearly"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      tx_direction: "in" | "out"
      tx_type:
        | "income"
        | "expense"
        | "payment"
        | "card_purchase"
        | "transfer"
        | "other"
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
    Enums: {
      account_type: ["checking", "savings", "wallet", "other"],
      app_role: ["admin", "moderator", "user"],
      category_kind: ["expense", "income"],
      category_scope: ["personal", "business"],
      connection_status: [
        "preparing",
        "awaiting_authorization",
        "connecting",
        "syncing",
        "verifying",
        "completed",
        "failed",
        "consent_expired",
        "revoked",
      ],
      data_source: ["manual", "open_finance"],
      entry_kind: ["revenue", "expense"],
      event_kind: ["event", "course", "fair", "partnership", "opportunity"],
      goal_scope: ["personal", "business"],
      goal_status: ["active", "completed", "archived"],
      main_goal: [
        "organize",
        "understand_spending",
        "investments",
        "business",
        "all",
      ],
      post_kind: ["general", "business", "question", "experience", "news"],
      recurrence: ["none", "weekly", "monthly", "yearly"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      tx_direction: ["in", "out"],
      tx_type: [
        "income",
        "expense",
        "payment",
        "card_purchase",
        "transfer",
        "other",
      ],
    },
  },
} as const
