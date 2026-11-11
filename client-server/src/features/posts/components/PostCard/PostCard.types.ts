import type { ReactNode } from "react";

export interface PostAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface PostStats {
  likes: number;
  saves: number;
  views: number;
}

export interface PostCardData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  image?: string;
  category: string;
  author: PostAuthor;
  publishedAt: string;
  readingTimeMinutes: number;
  stats: PostStats;
  featured?: boolean;
}

export interface PostCardProps {
  post: PostCardData;

  liked?: boolean;
  saved?: boolean;

  onLikeChange?: (
    post: PostCardData,
    nextValue: boolean,
  ) => void;

  onSaveChange?: (
    post: PostCardData,
    nextValue: boolean,
  ) => void;

  onPostClick?: (post: PostCardData) => void;

  className?: string;
  actions?: ReactNode;
}