import {HomeContentItem} from '../data/home';
import {UserProfile} from '../profiles/types/Profile';
import {ViewingHistoryItem} from './history';
import {ContinueWatchRecord} from '../services/watchProgressService';
import {WatchlistItem} from './watchlist';

export type RecommendationSource =
  | 'genre_match'
  | 'viewing_history'
  | 'watchlist_affinity'
  | 'profile_preference'
  | 'trending'
  | 'top_picks'
  | 'recently_added';

export interface RecommendationScoringOptions {
  activeProfile?: UserProfile | null;
  catalog: HomeContentItem[];
  viewingHistory?: ViewingHistoryItem[];
  continueWatching?: ContinueWatchRecord[];
  watchlist?: WatchlistItem[];
  limit?: number;
}

export interface RecommendationSectionResult {
  recommendedForYou: HomeContentItem[];
  becauseYouWatched: {
    sourceTitle: string;
    items: HomeContentItem[];
  } | null;
  recentlyAdded: HomeContentItem[];
}
