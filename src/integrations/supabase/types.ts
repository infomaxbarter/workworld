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
      ad_creatives: {
        Row: {
          active: boolean
          advertiser: string | null
          body: string | null
          clicks: number
          created_at: string
          cta_label: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          impressions: number
          link_url: string | null
          slot_id: string
          starts_at: string | null
          title: string
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          advertiser?: string | null
          body?: string | null
          clicks?: number
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          slot_id: string
          starts_at?: string | null
          title: string
          updated_at?: string
          weight?: number
        }
        Update: {
          active?: boolean
          advertiser?: string | null
          body?: string | null
          clicks?: number
          created_at?: string
          cta_label?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          slot_id?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_creatives_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "ad_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_slots: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          height: number | null
          id: string
          name: string
          page_key: string
          placement: string
          updated_at: string
          width: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          name: string
          page_key?: string
          placement?: string
          updated_at?: string
          width?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          name?: string
          page_key?: string
          placement?: string
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      ambassador_levels: {
        Row: {
          badges: string | null
          code: string
          created_at: string
          id: string
          motivation: string | null
          requirements: string | null
          rights: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          badges?: string | null
          code: string
          created_at?: string
          id?: string
          motivation?: string | null
          requirements?: string | null
          rights?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          badges?: string | null
          code?: string
          created_at?: string
          id?: string
          motivation?: string | null
          requirements?: string | null
          rights?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          content_i18n: Json | null
          created_at: string
          id: string
          status: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          content: string
          content_i18n?: Json | null
          created_at?: string
          id?: string
          status?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          content?: string
          content_i18n?: Json | null
          created_at?: string
          id?: string
          status?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          channel: string | null
          city: string | null
          code: string | null
          created_at: string
          current_title: string | null
          full_name: string
          id: string
          last_contact_at: string | null
          notes: string | null
          owner: string | null
          quality_score: number
          region: string | null
          stage: string
          target_role: string | null
          tier: string | null
          updated_at: string
          vertical: string | null
        }
        Insert: {
          channel?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          current_title?: string | null
          full_name: string
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          owner?: string | null
          quality_score?: number
          region?: string | null
          stage?: string
          target_role?: string | null
          tier?: string | null
          updated_at?: string
          vertical?: string | null
        }
        Update: {
          channel?: string | null
          city?: string | null
          code?: string | null
          created_at?: string
          current_title?: string | null
          full_name?: string
          id?: string
          last_contact_at?: string | null
          notes?: string | null
          owner?: string | null
          quality_score?: number
          region?: string | null
          stage?: string
          target_role?: string | null
          tier?: string | null
          updated_at?: string
          vertical?: string | null
        }
        Relationships: []
      }
      donation_tiers: {
        Row: {
          active: boolean
          badge_color: string
          badge_icon: string
          badge_label: string | null
          code: string
          created_at: string
          currency: string
          description: string | null
          description_i18n: Json | null
          highlight_days: number
          id: string
          min_amount: number
          name: string
          name_i18n: Json | null
          perks: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          badge_color?: string
          badge_icon?: string
          badge_label?: string | null
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          description_i18n?: Json | null
          highlight_days?: number
          id?: string
          min_amount?: number
          name: string
          name_i18n?: Json | null
          perks?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          badge_color?: string
          badge_icon?: string
          badge_label?: string | null
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          description_i18n?: Json | null
          highlight_days?: number
          id?: string
          min_amount?: number
          name?: string
          name_i18n?: Json | null
          perks?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          admin_note: string | null
          amount: number
          channel: string
          created_at: string
          currency: string
          donated_at: string | null
          donor_name: string
          email: string | null
          id: string
          message: string | null
          profile_id: string | null
          show_publicly: boolean
          status: string
          tier_id: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          channel?: string
          created_at?: string
          currency?: string
          donated_at?: string | null
          donor_name: string
          email?: string | null
          id?: string
          message?: string | null
          profile_id?: string | null
          show_publicly?: boolean
          status?: string
          tier_id?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          channel?: string
          created_at?: string
          currency?: string
          donated_at?: string | null
          donor_name?: string
          email?: string | null
          id?: string
          message?: string | null
          profile_id?: string | null
          show_publicly?: boolean
          status?: string
          tier_id?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "donation_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_badges: {
        Row: {
          active: boolean
          color: string
          created_at: string
          display_name: string | null
          donation_id: string | null
          expires_at: string | null
          featured: boolean
          icon: string
          id: string
          label: string
          note: string | null
          profile_id: string | null
          starts_at: string
          tier_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          display_name?: string | null
          donation_id?: string | null
          expires_at?: string | null
          featured?: boolean
          icon?: string
          id?: string
          label: string
          note?: string | null
          profile_id?: string | null
          starts_at?: string
          tier_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          display_name?: string | null
          donation_id?: string | null
          expires_at?: string | null
          featured?: boolean
          icon?: string
          id?: string
          label?: string
          note?: string | null
          profile_id?: string | null
          starts_at?: string
          tier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_badges_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_badges_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_badges_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "donation_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_gallery: {
        Row: {
          caption: string | null
          created_at: string
          event_id: string
          id: string
          sort_order: number | null
          type: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          event_id: string
          id?: string
          sort_order?: number | null
          type?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          event_id?: string
          id?: string
          sort_order?: number | null
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_gallery_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_markers: {
        Row: {
          capacity: number | null
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          date: string | null
          description: string | null
          description_i18n: Json | null
          end_date: string | null
          external_url: string | null
          id: string
          lat: number
          lng: number
          slug: string | null
          start_date: string | null
          status: string
          title: string
          title_i18n: Json | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          description_i18n?: Json | null
          end_date?: string | null
          external_url?: string | null
          id?: string
          lat?: number
          lng?: number
          slug?: string | null
          start_date?: string | null
          status?: string
          title: string
          title_i18n?: Json | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          description_i18n?: Json | null
          end_date?: string | null
          external_url?: string | null
          id?: string
          lat?: number
          lng?: number
          slug?: string | null
          start_date?: string | null
          status?: string
          title?: string
          title_i18n?: Json | null
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          active: boolean
          answer: string
          answer_i18n: Json | null
          category: string
          created_at: string
          id: string
          keywords: string[]
          link_label: string | null
          link_url: string | null
          question: string
          question_i18n: Json | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          answer_i18n?: Json | null
          category?: string
          created_at?: string
          id?: string
          keywords?: string[]
          link_label?: string | null
          link_url?: string | null
          question: string
          question_i18n?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          answer_i18n?: Json | null
          category?: string
          created_at?: string
          id?: string
          keywords?: string[]
          link_label?: string | null
          link_url?: string | null
          question?: string
          question_i18n?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_label: string | null
          cta_url: string | null
          id: string
          image_url: string | null
          sort_order: number
          subtitle: string | null
          subtitle_i18n: Json | null
          title: string
          title_i18n: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          subtitle_i18n?: Json | null
          title: string
          title_i18n?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          subtitle?: string | null
          subtitle_i18n?: Json | null
          title?: string
          title_i18n?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      mci_cities: {
        Row: {
          admin_notes: string | null
          ai_index: number
          approved: boolean
          b_rate: number
          city: string
          country_code: string
          cp_final: number | null
          created_at: string
          created_by: string | null
          data_quality_score: number | null
          data_version: number | null
          delta_pulse: number
          e_ratio: number
          esg_score: number
          exp_billion_usd: number
          f_firms: number
          g_gdp_per_capita: number
          h_vc_access: number
          id: string
          imp_billion_usd: number
          last_computed_at: string | null
          m_loc: number
          n_population: number
          net_syn: number
          notes: string | null
          p_search: number
          s_industrial_zones: number
          seat_quota: number | null
          sigma: number
          slug: string | null
          t_flow: number
          t_tech_parks: number
          u_universities: number
          updated_at: string
          verification_status: string | null
          y_ratio: number
        }
        Insert: {
          admin_notes?: string | null
          ai_index?: number
          approved?: boolean
          b_rate?: number
          city: string
          country_code: string
          cp_final?: number | null
          created_at?: string
          created_by?: string | null
          data_quality_score?: number | null
          data_version?: number | null
          delta_pulse?: number
          e_ratio?: number
          esg_score?: number
          exp_billion_usd?: number
          f_firms?: number
          g_gdp_per_capita?: number
          h_vc_access?: number
          id?: string
          imp_billion_usd?: number
          last_computed_at?: string | null
          m_loc?: number
          n_population?: number
          net_syn?: number
          notes?: string | null
          p_search?: number
          s_industrial_zones?: number
          seat_quota?: number | null
          sigma?: number
          slug?: string | null
          t_flow?: number
          t_tech_parks?: number
          u_universities?: number
          updated_at?: string
          verification_status?: string | null
          y_ratio?: number
        }
        Update: {
          admin_notes?: string | null
          ai_index?: number
          approved?: boolean
          b_rate?: number
          city?: string
          country_code?: string
          cp_final?: number | null
          created_at?: string
          created_by?: string | null
          data_quality_score?: number | null
          data_version?: number | null
          delta_pulse?: number
          e_ratio?: number
          esg_score?: number
          exp_billion_usd?: number
          f_firms?: number
          g_gdp_per_capita?: number
          h_vc_access?: number
          id?: string
          imp_billion_usd?: number
          last_computed_at?: string | null
          m_loc?: number
          n_population?: number
          net_syn?: number
          notes?: string | null
          p_search?: number
          s_industrial_zones?: number
          seat_quota?: number | null
          sigma?: number
          slug?: string | null
          t_flow?: number
          t_tech_parks?: number
          u_universities?: number
          updated_at?: string
          verification_status?: string | null
          y_ratio?: number
        }
        Relationships: [
          {
            foreignKeyName: "mci_cities_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "pilot_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      mci_city_history: {
        Row: {
          change_type: string
          changed_at: string
          changed_by: string | null
          city_id: string
          diff: Json | null
          id: string
          reason: string | null
          snapshot: Json
        }
        Insert: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          city_id: string
          diff?: Json | null
          id?: string
          reason?: string | null
          snapshot: Json
        }
        Update: {
          change_type?: string
          changed_at?: string
          changed_by?: string | null
          city_id?: string
          diff?: Json | null
          id?: string
          reason?: string | null
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "mci_city_history_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "mci_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      mci_city_representatives: {
        Row: {
          appointed_at: string | null
          appointed_by: string | null
          city_id: string
          created_at: string
          id: string
          notes: string | null
          profession_id: string
          profile_id: string | null
          slot_index: number
          updated_at: string
        }
        Insert: {
          appointed_at?: string | null
          appointed_by?: string | null
          city_id: string
          created_at?: string
          id?: string
          notes?: string | null
          profession_id: string
          profile_id?: string | null
          slot_index?: number
          updated_at?: string
        }
        Update: {
          appointed_at?: string | null
          appointed_by?: string | null
          city_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          profession_id?: string
          profile_id?: string | null
          slot_index?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mci_city_representatives_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "mci_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mci_city_representatives_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mci_city_representatives_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mci_metric_sources: {
        Row: {
          city_id: string
          confidence: number | null
          created_at: string
          data_date: string | null
          id: string
          metric_key: string
          notes: string | null
          source_name: string
          source_url: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          city_id: string
          confidence?: number | null
          created_at?: string
          data_date?: string | null
          id?: string
          metric_key: string
          notes?: string | null
          source_name: string
          source_url?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          city_id?: string
          confidence?: number | null
          created_at?: string
          data_date?: string | null
          id?: string
          metric_key?: string
          notes?: string | null
          source_name?: string
          source_url?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mci_metric_sources_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "mci_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      mci_seat_applications: {
        Row: {
          city_id: string
          created_at: string
          id: string
          message: string | null
          profession_id: string | null
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          message?: string | null
          profession_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          message?: string | null
          profession_id?: string | null
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mci_seat_applications_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "mci_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mci_seat_applications_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
        ]
      }
      mci_submissions: {
        Row: {
          action: string
          city_id: string | null
          created_at: string
          id: string
          payload: Json
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action?: string
          city_id?: string | null
          created_at?: string
          id?: string
          payload: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          city_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mci_submissions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "mci_cities"
            referencedColumns: ["id"]
          },
        ]
      }
      media_content: {
        Row: {
          author_id: string | null
          body: string | null
          body_i18n: Json | null
          cover_url: string | null
          created_at: string
          description: string | null
          description_i18n: Json | null
          duration_seconds: number | null
          id: string
          media_url: string | null
          published_at: string | null
          reject_reason: string | null
          slug: string | null
          status: string
          tags: string[] | null
          title: string
          title_i18n: Json | null
          type: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          body_i18n?: Json | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          duration_seconds?: number | null
          id?: string
          media_url?: string | null
          published_at?: string | null
          reject_reason?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title: string
          title_i18n?: Json | null
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          body_i18n?: Json | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          duration_seconds?: number | null
          id?: string
          media_url?: string | null
          published_at?: string | null
          reject_reason?: string | null
          slug?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          title_i18n?: Json | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      outreach_templates: {
        Row: {
          audience: string
          body: string | null
          channel: string | null
          code: string
          created_at: string
          id: string
          sort_order: number
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience: string
          body?: string | null
          channel?: string | null
          code: string
          created_at?: string
          id?: string
          sort_order?: number
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string | null
          channel?: string | null
          code?: string
          created_at?: string
          id?: string
          sort_order?: number
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pilot_countries: {
        Row: {
          active: boolean
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          name: string
          name_i18n: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name: string
          name_i18n?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          name?: string
          name_i18n?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          content: string
          content_i18n: Json | null
          created_at: string
          id: string
          media: Json
          slug: string | null
          status: string
          target_id: string | null
          target_type: string
          title: string
          title_i18n: Json | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          content_i18n?: Json | null
          created_at?: string
          id?: string
          media?: Json
          slug?: string | null
          status?: string
          target_id?: string | null
          target_type?: string
          title: string
          title_i18n?: Json | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          content_i18n?: Json | null
          created_at?: string
          id?: string
          media?: Json
          slug?: string | null
          status?: string
          target_id?: string | null
          target_type?: string
          title?: string
          title_i18n?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      professions: {
        Row: {
          country_code: string | null
          created_at: string
          description: string | null
          description_i18n: Json | null
          icon: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          name_i18n: Json | null
          slug: string | null
          status: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          icon?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          name_i18n?: Json | null
          slug?: string | null
          status?: string
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          icon?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          name_i18n?: Json | null
          slug?: string | null
          status?: string
        }
        Relationships: []
      }
      profile_edit_requests: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          new_data: Json
          old_data: Json
          profile_id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          new_data?: Json
          old_data?: Json
          profile_id: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          new_data?: Json
          old_data?: Json
          profile_id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_edit_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_professions: {
        Row: {
          id: string
          profession_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          profession_id: string
          profile_id: string
        }
        Update: {
          id?: string
          profession_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_professions_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_professions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          bio: string | null
          bio_i18n: Json | null
          city: string | null
          country: string | null
          created_at: string
          display_name: string
          github: string | null
          id: string
          instagram: string | null
          lat: number | null
          linkedin: string | null
          lng: number | null
          location: string | null
          slug: string | null
          status: string
          telegram: string | null
          twitter: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          bio_i18n?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          github?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          location?: string | null
          slug?: string | null
          status?: string
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          bio_i18n?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          display_name?: string
          github?: string | null
          id?: string
          instagram?: string | null
          lat?: number | null
          linkedin?: string | null
          lng?: number | null
          location?: string | null
          slug?: string | null
          status?: string
          telegram?: string | null
          twitter?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          created_by: string
          id: string
          reason: string
          target_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          reason: string
          target_id: string
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          target_id?: string
          type?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          canonical_path: string | null
          created_at: string
          description: string | null
          description_i18n: Json | null
          id: string
          keywords: string | null
          no_index: boolean
          og_image: string | null
          page_key: string
          title: string | null
          title_i18n: Json | null
          updated_at: string
        }
        Insert: {
          canonical_path?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          id?: string
          keywords?: string | null
          no_index?: boolean
          og_image?: string | null
          page_key: string
          title?: string | null
          title_i18n?: Json | null
          updated_at?: string
        }
        Update: {
          canonical_path?: string | null
          created_at?: string
          description?: string | null
          description_i18n?: Json | null
          id?: string
          keywords?: string | null
          no_index?: boolean
          og_image?: string | null
          page_key?: string
          title?: string | null
          title_i18n?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      social_links: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          label: string | null
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          label?: string | null
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          label?: string | null
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      tr_provinces: {
        Row: {
          active: boolean
          community_channels: string | null
          created_at: string
          focus_sectors: string | null
          id: string
          lat: number | null
          lng: number | null
          local_hubs: string | null
          name: string
          name_i18n: Json | null
          plate_no: number
          region: string
          slug: string | null
          target_representatives: number
          tier: string
          updated_at: string
          value_proposition: string | null
          value_proposition_i18n: Json | null
        }
        Insert: {
          active?: boolean
          community_channels?: string | null
          created_at?: string
          focus_sectors?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          local_hubs?: string | null
          name: string
          name_i18n?: Json | null
          plate_no: number
          region: string
          slug?: string | null
          target_representatives?: number
          tier: string
          updated_at?: string
          value_proposition?: string | null
          value_proposition_i18n?: Json | null
        }
        Update: {
          active?: boolean
          community_channels?: string | null
          created_at?: string
          focus_sectors?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          local_hubs?: string | null
          name?: string
          name_i18n?: Json | null
          plate_no?: number
          region?: string
          slug?: string | null
          target_representatives?: number
          tier?: string
          updated_at?: string
          value_proposition?: string | null
          value_proposition_i18n?: Json | null
        }
        Relationships: []
      }
      tr_verticals: {
        Row: {
          active: boolean
          barter_supply: string | null
          code: string
          created_at: string
          discovery_channels: string | null
          id: string
          ideal_representative: string | null
          name: string
          name_i18n: Json | null
          slug: string | null
          sort_order: number
          target_roles: string | null
          typical_demand: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          barter_supply?: string | null
          code: string
          created_at?: string
          discovery_channels?: string | null
          id?: string
          ideal_representative?: string | null
          name: string
          name_i18n?: Json | null
          slug?: string | null
          sort_order?: number
          target_roles?: string | null
          typical_demand?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          barter_supply?: string | null
          code?: string
          created_at?: string
          discovery_channels?: string | null
          id?: string
          ideal_representative?: string | null
          name?: string
          name_i18n?: Json | null
          slug?: string | null
          sort_order?: number
          target_roles?: string | null
          typical_demand?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_marker_professions: {
        Row: {
          id: string
          profession_id: string
          user_marker_id: string
        }
        Insert: {
          id?: string
          profession_id: string
          user_marker_id: string
        }
        Update: {
          id?: string
          profession_id?: string
          user_marker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_marker_professions_profession_id_fkey"
            columns: ["profession_id"]
            isOneToOne: false
            referencedRelation: "professions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_marker_professions_user_marker_id_fkey"
            columns: ["user_marker_id"]
            isOneToOne: false
            referencedRelation: "user_markers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_markers: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          name: string
          name_i18n: Json | null
          slug: string | null
          status: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name: string
          name_i18n?: Json | null
          slug?: string | null
          status?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          name_i18n?: Json | null
          slug?: string | null
          status?: string
        }
        Relationships: []
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
      waitlist_entries: {
        Row: {
          city: string | null
          community: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          invite_code: string | null
          list_id: string
          notes: string | null
          profession: string | null
          referral_code: string
          referral_count: number
          referred_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          community?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          invite_code?: string | null
          list_id: string
          notes?: string | null
          profession?: string | null
          referral_code?: string
          referral_count?: number
          referred_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          community?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          invite_code?: string | null
          list_id?: string
          notes?: string | null
          profession?: string | null
          referral_code?: string
          referral_count?: number
          referred_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "waitlist_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_lists: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          invite_required: boolean
          is_default: boolean
          mode: string
          name: string
          show_counter: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          invite_required?: boolean
          is_default?: boolean
          mode?: string
          name: string
          show_counter?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          invite_required?: boolean
          is_default?: boolean
          mode?: string
          name?: string
          show_counter?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ad_track: {
        Args: { _creative_id: string; _kind: string }
        Returns: undefined
      }
      create_notification: {
        Args: {
          _link?: string
          _message?: string
          _title: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      generate_slug: { Args: { input: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mci_compute_quality: { Args: { _city_id: string }; Returns: undefined }
      mci_compute_row: { Args: { row_id: string }; Returns: undefined }
      notify_admins: {
        Args: {
          _link?: string
          _message?: string
          _title: string
          _type: string
        }
        Returns: undefined
      }
      waitlist_count: { Args: { _list_slug: string }; Returns: number }
      waitlist_join: {
        Args: {
          _city?: string
          _community?: string
          _country?: string
          _email: string
          _full_name: string
          _list_slug: string
          _profession?: string
          _ref?: string
        }
        Returns: Json
      }
      waitlist_position: { Args: { _entry_id: string }; Returns: number }
      waitlist_redeem_invite: {
        Args: { _email: string; _invite_code: string }
        Returns: boolean
      }
      waitlist_status: { Args: { _referral_code: string }; Returns: Json }
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
