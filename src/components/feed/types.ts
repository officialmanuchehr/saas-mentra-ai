export interface AuthorInfo {
  full_name: string | null;
  avatar_url: string | null;
}

export interface FeedPostImage {
  id: string;
  url: string;
  sort_order: number;
}

export interface FeedPost {
  id: string;
  community_id: string;
  author_id: string;
  category_id: string | null;
  title: string;
  content: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles: AuthorInfo | null;
  post_images: FeedPostImage[];
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  profiles: AuthorInfo | null;
}

export interface FeedCategory {
  id: string;
  name: string;
  emoji: string | null;
}
