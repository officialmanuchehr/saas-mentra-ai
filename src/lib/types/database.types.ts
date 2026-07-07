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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_private: boolean
          member_count: number
          name: string
          owner_id: string
          price_monthly: number | null
          slug: string
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name: string
          owner_id: string
          price_monthly?: number | null
          slug: string
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_private?: boolean
          member_count?: number
          name?: string
          owner_id?: string
          price_monthly?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          community_id: string
          cover_url: string | null
          description: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
        }
        Insert: {
          community_id: string
          cover_url?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          community_id?: string
          cover_url?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          duration_min: number | null
          id: string
          module_id: string
          sort_order: number
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          duration_min?: number | null
          id?: string
          module_id: string
          sort_order?: number
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          duration_min?: number | null
          id?: string
          module_id?: string
          sort_order?: number
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          id: string
          target_id: string
          target_type: Database["public"]["Enums"]["like_target_type"]
          user_id: string
        }
        Insert: {
          id?: string
          target_id: string
          target_type: Database["public"]["Enums"]["like_target_type"]
          user_id: string
        }
        Update: {
          id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["like_target_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          points: number
          role: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          points?: number
          role?: Database["public"]["Enums"]["membership_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          points?: number
          role?: Database["public"]["Enums"]["membership_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_id: string
          id?: string
          sort_order?: number
          title: string
        }
        Update: {
          course_id?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          community_id: string
          created_at: string
          id: string
          is_read: boolean
          post_id: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          community_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          community_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          post_id?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      points_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["points_event_type"]
          id: string
          membership_id: string
          points: number
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["points_event_type"]
          id?: string
          membership_id: string
          points: number
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["points_event_type"]
          id?: string
          membership_id?: string
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: "points_events_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      post_categories: {
        Row: {
          community_id: string
          emoji: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          community_id: string
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          community_id?: string
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_categories_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      post_images: {
        Row: {
          id: string
          post_id: string
          sort_order: number
          url: string
        }
        Insert: {
          id?: string
          post_id: string
          sort_order?: number
          url: string
        }
        Update: {
          id?: string
          post_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category_id: string | null
          comments_count: number
          community_id: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          likes_count: number
          title: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          comments_count?: number
          community_id: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          title: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          comments_count?: number
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          title?: string
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
            foreignKeyName: "posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "post_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarded_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarded_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarded_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          community_id: string
          currency: string
          expires_at: string | null
          id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Insert: {
          amount: number
          community_id: string
          currency?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status: Database["public"]["Enums"]["subscription_status"]
          user_id: string
        }
        Update: {
          amount?: number
          community_id?: string
          currency?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_community: { Args: { p_community_id: string }; Returns: boolean }
      is_admin: {
        Args: { p_community_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_member: {
        Args: { p_community_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_open_community: { Args: { p_community_id: string }; Returns: boolean }
      level_from_points: { Args: { points: number }; Returns: number }
    }
    Enums: {
      like_target_type: "post" | "comment"
      membership_role: "owner" | "admin" | "member"
      notification_type:
        | "comment_on_post"
        | "reply_to_comment"
        | "like_post"
        | "like_comment"
      points_event_type:
        | "post_created"
        | "comment_created"
        | "like_received"
        | "lesson_completed"
        | "daily_login"
      subscription_status: "active" | "canceled" | "past_due"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      like_target_type: ["post", "comment"],
      membership_role: ["owner", "admin", "member"],
      notification_type: [
        "comment_on_post",
        "reply_to_comment",
        "like_post",
        "like_comment",
      ],
      points_event_type: [
        "post_created",
        "comment_created",
        "like_received",
        "lesson_completed",
        "daily_login",
      ],
      subscription_status: ["active", "canceled", "past_due"],
    },
  },
} as const
