export type ShortsContentStatus = 'published' | 'unpublished';

export type ShortsAspectRatio = '9:16' | '16:9' | '1:1';

export interface ShortsCreator {
  id: string;
  name: string;
  avatarUrl?: string;
  handle?: string;
  verified?: boolean;
}

export interface ShortsItem {
  id: string;
  title: string;
  description: string;

  thumbnailUrl: string;
  videoUrl: string;

  durationSeconds: number;

  aspectRatio: ShortsAspectRatio;

  creator?: ShortsCreator;

  category?: string;
  tags?: string[];

  publishedAt: string;

  isLiked: boolean;
  likeCount: number;
  viewCount: number;

  isSaved: boolean;

  status: ShortsContentStatus;

  isPremium: boolean;
  ageRating?: string;
  maturityRating?: string;

  availableForProfiles?: string[];
}

export interface ShortsPagination {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
}

export interface ShortsListResponse {
  success: boolean;
  data: ShortsItem[];
  pagination: ShortsPagination;
  message?: string;
}

export interface ShortsApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type MockScenarioType =
  | 'default'
  | 'empty'
  | 'network_error'
  | 'server_error'
  | 'delayed';

export interface ShortsFeedParams {
  page?: number;
  limit?: number;
  category?: string;
  profileId?: string;
  searchQuery?: string;
}

export interface ShortsSearchParams {
  q: string;
  page?: number;
  limit?: number;
  profileId?: string;
}

export interface ShortsRecommendationsParams {
  shortId: string;
  limit?: number;
  profileId?: string;
}
