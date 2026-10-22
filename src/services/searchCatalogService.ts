import {ImageSourcePropType} from 'react-native';
import {
  homeContentRows,
  homeHeroSlides,
  HomeContentItem,
  HomeContentRow,
  SeekbarType,
} from '../data/home';
import {curatedEpisodesMap} from '../data/episodes';
import {EpisodeItem} from '../types/episode';
import {liveChannels} from '../features/live-tv/data/freeLiveChannels';
import {LiveChannel} from '../features/live-tv/models/LiveChannel';
import {UserProfile} from '../profiles/types/Profile';
import {ContentMaturityRating} from '../types/maturity';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {
  matchesLanguage,
  parseGenres,
  parseRatingNumber,
  parseReleaseYear,
} from './recommendationService';

export type SearchContentType = 'all' | 'movie' | 'series' | 'episode' | 'live';
export type SearchSortOption = 'relevance' | 'newest' | 'rating';

export interface SearchCatalogItem extends HomeContentItem {
  id: string;
  title: string;
  description?: string;
  contentType: 'movie' | 'series' | 'episode' | 'live';
  genre?: string;
  genres: string[];
  cast?: string;
  director?: string;
  language?: string;
  releaseYear?: number;
  rating?: string;
  ratingScore: number;
  maturityRating?: ContentMaturityRating;
  image: ImageSourcePropType;
  badge?: string;
  videoUrl?: string;
  seekbarType?: SeekbarType;
  matchScore?: number;
  liveChannel?: LiveChannel;
  episodeItem?: EpisodeItem;
  seriesId?: string;
  seriesTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface SearchFilterState {
  contentType: SearchContentType;
  genre: string;
  language: string;
  year: string;
  sortBy: SearchSortOption;
}

export const DEFAULT_SEARCH_FILTERS: SearchFilterState = {
  contentType: 'all',
  genre: 'all',
  language: 'all',
  year: 'all',
  sortBy: 'relevance',
};

export interface SearchQueryParams {
  query?: string;
  filters?: Partial<SearchFilterState>;
  activeProfile?: UserProfile | null;
}

export interface SearchResultsPayload {
  totalCount: number;
  items: SearchCatalogItem[];
  rows: HomeContentRow[];
  query: string;
  normalizedQuery: string;
  isQueryTooLong: boolean;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

const MAX_QUERY_LENGTH = 100;
const RECENT_SEARCHES_STORAGE_PREFIX = '@vega_recent_searches_';
const MAX_RECENT_SEARCHES = 8;
const MAX_SUGGESTIONS = 6;

const defaultArtwork: ImageSourcePropType = require('../assets/background.png');

const getAsyncStorage = () => {
  try {
    return require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
      .default;
  } catch {
    try {
      return require('@react-native-async-storage/async-storage').default;
    } catch {
      return null;
    }
  }
};

const inMemoryRecentSearchesCache: Record<string, string[]> = {};

/**
 * Normalizes query string: strips accents, trims, collapses whitespace, lowercases.
 */
export const normalizeSearchQuery = (query?: string): string => {
  if (!query || typeof query !== 'string') {
    return '';
  }
  return query
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

/**
 * Builds and caches a unified catalog of movies, series, episodes, and live TV channels.
 */
let cachedUnifiedCatalog: SearchCatalogItem[] | null = null;

export const buildUnifiedCatalog = (): SearchCatalogItem[] => {
  if (cachedUnifiedCatalog) {
    return cachedUnifiedCatalog;
  }

  const seenIds = new Set<string>();
  const catalog: SearchCatalogItem[] = [];

  // 1. Hero slides (flagship movies and editions)
  for (const slide of homeHeroSlides) {
    if (!seenIds.has(slide.id)) {
      seenIds.add(slide.id);
      const year = parseReleaseYear(slide.meta);
      const ratingNum = parseRatingNumber(slide.rating);
      const genres = parseGenres(slide.genre);
      const isSeries =
        slide.title.toLowerCase().includes('star trek') ||
        slide.title.toLowerCase().includes('season') ||
        (Array.isArray(slide.meta) &&
          slide.meta.some((m) => String(m).toLowerCase().includes('series')));

      catalog.push({
        id: slide.id,
        title: slide.title,
        description: slide.description || '',
        contentType: isSeries ? 'series' : 'movie',
        genre: slide.genre,
        genres,
        cast: slide.cast,
        director: slide.director,
        language: extractLanguage(slide),
        releaseYear: year,
        rating: slide.rating,
        ratingScore: ratingNum,
        maturityRating: slide.maturityRating || '13_PLUS',
        image: slide.image || defaultArtwork,
        badge: slide.badge,
        videoUrl: slide.videoUrl,
        seekbarType: slide.seekbarType,
        meta: slide.meta,
      });
    }
  }

  // 2. Row items (catalog rows: trending, regional cinema, global blockbusters, kids)
  for (const row of homeContentRows) {
    if (
      row.id === 'continue-watching' ||
      row.id === 'favourites' ||
      row.id === 'my-list'
    ) {
      continue;
    }
    for (const item of row.items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        const year = parseReleaseYear(item.meta);
        const ratingNum = parseRatingNumber(item.rating);
        const genres = parseGenres(item.genre);
        const isSeries =
          item.title.toLowerCase().includes('star trek') ||
          item.title.toLowerCase().includes('chapter') ||
          (Array.isArray(item.meta) &&
            item.meta.some((m) => String(m).toLowerCase().includes('series')));

        catalog.push({
          id: item.id,
          title: item.title,
          description: item.description || '',
          contentType: isSeries ? 'series' : 'movie',
          genre: item.genre,
          genres,
          cast: item.cast,
          director: item.director,
          language: extractLanguage(item),
          releaseYear: year,
          rating: item.rating,
          ratingScore: ratingNum,
          maturityRating: item.maturityRating || '13_PLUS',
          image: item.image || defaultArtwork,
          badge: item.badge,
          videoUrl: item.videoUrl,
          seekbarType: item.seekbarType,
          meta: item.meta,
        });
      }
    }
  }

  // 3. Curated episodes (e.g. Star Trek, Lion King episodes)
  for (const [seriesId, episodes] of Object.entries(curatedEpisodesMap)) {
    for (const ep of episodes) {
      if (!seenIds.has(ep.id)) {
        seenIds.add(ep.id);
        const genres = parseGenres(ep.genre);
        const ratingNum = parseRatingNumber(ep.rating);
        catalog.push({
          id: ep.id,
          title: `${ep.seriesTitle ? ep.seriesTitle + ': ' : ''}${ep.title}`,
          description: ep.description || '',
          contentType: 'episode',
          genre: ep.genre,
          genres,
          cast: 'Ensemble Cast',
          director: 'Television Director',
          language: 'English',
          releaseYear: 2024,
          rating: ep.rating,
          ratingScore: ratingNum,
          maturityRating: ep.maturityRating || '13_PLUS',
          image: ep.image || defaultArtwork,
          badge: ep.badge || `EP ${ep.episodeNumber}`,
          videoUrl: ep.videoUrl,
          seekbarType: ep.seekbarType,
          seriesId: ep.seriesId || seriesId,
          seriesTitle: ep.seriesTitle,
          seasonNumber: ep.seasonNumber,
          episodeNumber: ep.episodeNumber,
          episodeItem: ep,
          meta: [
            ep.durationFormatted || '45m',
            `S${ep.seasonNumber || 1}:E${ep.episodeNumber || 1}`,
            'Series Episode',
          ],
        });
      }
    }
  }

  // 4. Live TV channels (news, entertainment, demo channels)
  for (const ch of liveChannels) {
    if (!seenIds.has(ch.id)) {
      seenIds.add(ch.id);
      const isAnimation =
        ch.category === 'Animation' || ch.name.toLowerCase().includes('bunny');
      catalog.push({
        id: ch.id,
        title: ch.name,
        description: `${ch.name} - Channel ${ch.number}. ${
          ch.category
        } live broadcast in ${ch.language || 'English'}.`,
        contentType: 'live',
        genre: ch.category || 'Live TV',
        genres: [ch.category.toLowerCase(), 'live', 'live tv'],
        cast: 'Live Broadcast Team',
        director: 'Channel Producer',
        language: ch.language || 'English',
        releaseYear: 2024,
        rating: '⭐ 8.0 / 10',
        ratingScore: 8.0,
        maturityRating: isAnimation ? 'KIDS' : '13_PLUS',
        image: defaultArtwork,
        badge: `LIVE • CH ${ch.number}`,
        videoUrl: ch.streamUrl,
        liveChannel: ch,
        meta: [`CH ${ch.number}`, ch.category.toUpperCase(), 'LIVE STREAM'],
      });
    }
  }

  cachedUnifiedCatalog = catalog;
  return catalog;
};

/**
 * Clears the unified catalog cache (useful for testing or profile switches).
 */
export const clearCatalogCache = (): void => {
  cachedUnifiedCatalog = null;
};

/**
 * Helper to extract language from badge, meta, or audio attributes.
 */
function extractLanguage(item: HomeContentItem): string {
  const badgeLower = String(item.badge || '').toLowerCase();
  if (badgeLower.includes('telugu')) return 'Telugu';
  if (badgeLower.includes('hindi')) return 'Hindi';
  if (badgeLower.includes('english')) return 'English';
  if (badgeLower.includes('tamil')) return 'Tamil';
  if (badgeLower.includes('kannada')) return 'Kannada';
  if (badgeLower.includes('malayalam')) return 'Malayalam';

  if (Array.isArray(item.meta)) {
    for (const m of item.meta) {
      const s = String(m).toLowerCase();
      if (s === 'telugu') return 'Telugu';
      if (s === 'hindi') return 'Hindi';
      if (s === 'english') return 'English';
    }
  }

  return 'English';
}

/**
 * Computes a relevance match score for an item against a normalized query string.
 * Returns 0 if there is no match.
 */
export const calculateMatchScore = (
  item: SearchCatalogItem,
  normalizedQuery: string,
): number => {
  if (!normalizedQuery) {
    return 1;
  }

  const titleLower = item.title.toLowerCase();
  const castLower = (item.cast || '').toLowerCase();
  const directorLower = (item.director || '').toLowerCase();
  const genreLower = (item.genre || '').toLowerCase();
  const descLower = (item.description || '').toLowerCase();
  const badgeLower = (item.badge || '').toLowerCase();
  const langLower = (item.language || '').toLowerCase();
  const yearStr = item.releaseYear ? String(item.releaseYear) : '';
  const typeStr = item.contentType.toLowerCase();

  // Multi-token support: all tokens must match at least one field
  const tokens = normalizedQuery.split(' ').filter((t) => t.length > 0);
  if (tokens.length > 1) {
    let allTokensMatched = true;
    let score = 0;
    for (const token of tokens) {
      let tokenMatched = false;
      if (titleLower.includes(token)) {
        score += titleLower.startsWith(token) ? 30 : 20;
        tokenMatched = true;
      }
      if (castLower.includes(token)) {
        score += 15;
        tokenMatched = true;
      }
      if (directorLower.includes(token)) {
        score += 12;
        tokenMatched = true;
      }
      if (genreLower.includes(token) || item.genres.some((g) => g.includes(token))) {
        score += 10;
        tokenMatched = true;
      }
      if (langLower.includes(token) || badgeLower.includes(token)) {
        score += 8;
        tokenMatched = true;
      }
      if (yearStr === token) {
        score += 15;
        tokenMatched = true;
      }
      if (descLower.includes(token)) {
        score += 5;
        tokenMatched = true;
      }
      if (typeStr === token) {
        score += 8;
        tokenMatched = true;
      }
      if (!tokenMatched) {
        allTokensMatched = false;
        break;
      }
    }
    return allTokensMatched ? score : 0;
  }

  // Single-token matching
  const q = normalizedQuery;
  let score = 0;

  // Exact title match (highest relevance)
  if (titleLower === q) {
    score += 100;
  } else if (titleLower.startsWith(q)) {
    score += 80;
  } else if (titleLower.includes(` ${q}`)) {
    score += 65;
  } else if (titleLower.includes(q)) {
    score += 45;
  }

  // Cast match
  if (castLower.includes(q)) {
    score += castLower.startsWith(q) || castLower.includes(` ${q}`) ? 35 : 20;
  }

  // Director match
  if (directorLower.includes(q)) {
    score += directorLower.startsWith(q) || directorLower.includes(` ${q}`) ? 30 : 18;
  }

  // Genre match
  if (item.genres.some((g) => g === q)) {
    score += 30;
  } else if (genreLower.includes(q)) {
    score += 20;
  }

  // Language match
  if (langLower === q || badgeLower.includes(q)) {
    score += 25;
  }

  // Release year match
  if (yearStr === q) {
    score += 25;
  }

  // Content type match
  if (typeStr === q || (q === 'series' && item.contentType === 'episode')) {
    score += 15;
  }

  // Description match
  if (descLower.includes(q)) {
    score += 10;
  }

  return score;
};

/**
 * Checks whether an item satisfies the chosen discovery filter options.
 */
export const matchesFilters = (
  item: SearchCatalogItem,
  filters: SearchFilterState,
): boolean => {
  // 1. Content Type filter
  if (filters.contentType !== 'all') {
    if (filters.contentType === 'series') {
      if (item.contentType !== 'series' && item.contentType !== 'episode') {
        return false;
      }
    } else if (item.contentType !== filters.contentType) {
      return false;
    }
  }

  // 2. Genre filter
  if (filters.genre && filters.genre !== 'all') {
    const targetGenre = filters.genre.toLowerCase();
    const hasGenre =
      item.genres.some((g) => g.includes(targetGenre)) ||
      (item.genre && item.genre.toLowerCase().includes(targetGenre));
    if (!hasGenre) {
      return false;
    }
  }

  // 3. Language filter
  if (filters.language && filters.language !== 'all') {
    const targetLang = filters.language.toLowerCase();
    const hasLang =
      (item.language && item.language.toLowerCase().includes(targetLang)) ||
      matchesLanguage(item, filters.language);
    if (!hasLang) {
      return false;
    }
  }

  // 4. Release year filter
  if (filters.year && filters.year !== 'all') {
    if (filters.year === 'older') {
      if (!item.releaseYear || item.releaseYear > 2021) {
        return false;
      }
    } else {
      const yearNum = parseInt(filters.year, 10);
      if (item.releaseYear !== yearNum) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Searches the catalog with query scoring, discovery filtering, sorting,
 * and profile-restricted access enforcement.
 */
export const searchCatalog = (params: SearchQueryParams): SearchResultsPayload => {
  const {query = '', filters = {}, activeProfile} = params;
  const mergedFilters: SearchFilterState = {
    ...DEFAULT_SEARCH_FILTERS,
    ...filters,
  };

  const rawQuery = String(query);
  const isQueryTooLong = rawQuery.length > MAX_QUERY_LENGTH;
  const normalizedQuery = isQueryTooLong
    ? normalizeSearchQuery(rawQuery.substring(0, MAX_QUERY_LENGTH))
    : normalizeSearchQuery(rawQuery);

  const catalog = buildUnifiedCatalog();

  // Step 1: Profile access restriction (Kids profile strictly limited to KIDS rating)
  const profileAllowedCatalog = catalog.filter((item) =>
    canProfileAccessContent(activeProfile, item),
  );

  // Step 2: Scoring & Query Matching
  const scoredItems: SearchCatalogItem[] = [];
  for (const item of profileAllowedCatalog) {
    const matchScore = calculateMatchScore(item, normalizedQuery);
    if (matchScore > 0) {
      scoredItems.push({
        ...item,
        matchScore,
      });
    }
  }

  // Step 3: Discovery Filtering
  const filteredItems = scoredItems.filter((item) =>
    matchesFilters(item, mergedFilters),
  );

  // Step 4: Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (mergedFilters.sortBy === 'newest') {
      const yearDiff = (b.releaseYear || 0) - (a.releaseYear || 0);
      if (yearDiff !== 0) return yearDiff;
      return (b.ratingScore || 0) - (a.ratingScore || 0);
    }
    if (mergedFilters.sortBy === 'rating') {
      const ratingDiff = (b.ratingScore || 0) - (a.ratingScore || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.releaseYear || 0) - (a.releaseYear || 0);
    }
    // Default 'relevance'
    if (normalizedQuery) {
      const scoreDiff = (b.matchScore || 0) - (a.matchScore || 0);
      if (scoreDiff !== 0) return scoreDiff;
    }
    return (b.ratingScore || 0) - (a.ratingScore || 0);
  });

  // Step 5: Group results into TV content rows
  const rows = groupSearchResultsIntoRows(sortedItems, normalizedQuery, mergedFilters);

  const hasActiveFilters =
    mergedFilters.contentType !== 'all' ||
    mergedFilters.genre !== 'all' ||
    mergedFilters.language !== 'all' ||
    mergedFilters.year !== 'all' ||
    mergedFilters.sortBy !== 'relevance';

  let activeFiltersCount = 0;
  if (mergedFilters.contentType !== 'all') activeFiltersCount++;
  if (mergedFilters.genre !== 'all') activeFiltersCount++;
  if (mergedFilters.language !== 'all') activeFiltersCount++;
  if (mergedFilters.year !== 'all') activeFiltersCount++;
  if (mergedFilters.sortBy !== 'relevance') activeFiltersCount++;

  return {
    totalCount: sortedItems.length,
    items: sortedItems,
    rows,
    query: rawQuery,
    normalizedQuery,
    isQueryTooLong,
    hasActiveFilters,
    activeFiltersCount,
  };
};

/**
 * Organizes search results into structured, categorized TV rows for horizontal D-pad navigation.
 */
export const groupSearchResultsIntoRows = (
  items: SearchCatalogItem[],
  query: string,
  filters: SearchFilterState,
): HomeContentRow[] => {
  if (items.length === 0) {
    return [];
  }

  // If specific contentType is selected, render a single categorized row
  if (filters.contentType !== 'all') {
    const typeLabel =
      filters.contentType === 'movie'
        ? 'Movies'
        : filters.contentType === 'series'
        ? 'Series & Episodes'
        : filters.contentType === 'episode'
        ? 'Episodes'
        : 'Live TV Channels';
    return [
      {
        id: `search-row-${filters.contentType}`,
        title: query ? `${typeLabel} matching "${query}"` : `${typeLabel}`,
        layout: 'horizontal',
        items,
      },
    ];
  }

  const movies = items.filter((i) => i.contentType === 'movie');
  const seriesAndEpisodes = items.filter(
    (i) => i.contentType === 'series' || i.contentType === 'episode',
  );
  const liveChannelsList = items.filter((i) => i.contentType === 'live');

  const rows: HomeContentRow[] = [];

  if (movies.length > 0) {
    rows.push({
      id: 'search-movies-row',
      title: query ? `Movies (${movies.length})` : 'Movies & Blockbusters',
      layout: 'horizontal',
      items: movies,
    });
  }

  if (seriesAndEpisodes.length > 0) {
    rows.push({
      id: 'search-series-row',
      title: query
        ? `Series & Episodes (${seriesAndEpisodes.length})`
        : 'TV Series & Episodes',
      layout: 'horizontal',
      items: seriesAndEpisodes,
    });
  }

  if (liveChannelsList.length > 0) {
    rows.push({
      id: 'search-live-row',
      title: query
        ? `Live TV Channels (${liveChannelsList.length})`
        : 'Live TV Channels',
      layout: 'horizontal',
      items: liveChannelsList,
    });
  }

  // Fallback if no categorized rows produced
  if (rows.length === 0) {
    rows.push({
      id: 'search-all-results',
      title: `Search Results (${items.length})`,
      layout: 'horizontal',
      items,
    });
  }

  return rows;
};

/**
 * Returns dynamic, bounded suggestions matching the current query prefix.
 * Excludes restricted titles for Kids profile.
 */
export const getSearchSuggestions = (
  query: string,
  activeProfile?: UserProfile | null,
  maxCount: number = MAX_SUGGESTIONS,
): string[] => {
  const normalized = normalizeSearchQuery(query);
  if (!normalized || normalized.length < 2) {
    return [];
  }

  const catalog = buildUnifiedCatalog();
  const profileAllowed = catalog.filter((item) =>
    canProfileAccessContent(activeProfile, item),
  );

  const seen = new Set<string>();
  const suggestions: string[] = [];

  // 1. Title matches
  for (const item of profileAllowed) {
    const t = item.title;
    const tLower = t.toLowerCase();
    if (tLower.startsWith(normalized) || tLower.includes(` ${normalized}`)) {
      if (!seen.has(tLower)) {
        seen.add(tLower);
        suggestions.push(t);
        if (suggestions.length >= maxCount) {
          return suggestions;
        }
      }
    }
  }

  // 2. Cast and director matches
  for (const item of profileAllowed) {
    if (item.cast) {
      const actors = item.cast.split(',').map((a) => a.trim());
      for (const actor of actors) {
        const aLower = actor.toLowerCase();
        if (aLower.startsWith(normalized) || aLower.includes(` ${normalized}`)) {
          if (!seen.has(aLower)) {
            seen.add(aLower);
            suggestions.push(actor);
            if (suggestions.length >= maxCount) {
              return suggestions;
            }
          }
        }
      }
    }
    if (item.director) {
      const dLower = item.director.toLowerCase();
      if (dLower.startsWith(normalized) || dLower.includes(` ${normalized}`)) {
        if (!seen.has(dLower)) {
          seen.add(dLower);
          suggestions.push(item.director);
          if (suggestions.length >= maxCount) {
            return suggestions;
          }
        }
      }
    }
  }

  // 3. Genre matches
  for (const item of profileAllowed) {
    for (const g of item.genres) {
      if (g.startsWith(normalized)) {
        const capitalized = g.charAt(0).toUpperCase() + g.slice(1);
        if (!seen.has(g)) {
          seen.add(g);
          suggestions.push(capitalized);
          if (suggestions.length >= maxCount) {
            return suggestions;
          }
        }
      }
    }
  }

  return suggestions;
};

// ==========================================
// RECENT SEARCHES (PROFILE-ISOLATED PERSISTENCE)
// ==========================================

const getStorageKey = (profileId?: string): string => {
  const safeProfileId = profileId ? String(profileId).trim() : 'default';
  return `${RECENT_SEARCHES_STORAGE_PREFIX}${safeProfileId}`;
};

/**
 * Retrieves recent searches for a specific profile.
 */
export const getRecentSearches = async (
  profileId?: string,
): Promise<string[]> => {
  const key = getStorageKey(profileId);
  if (inMemoryRecentSearchesCache[key]) {
    return [...inMemoryRecentSearchesCache[key]];
  }

  try {
    const storage = getAsyncStorage();
    if (storage) {
      const raw = await storage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, MAX_RECENT_SEARCHES);
          inMemoryRecentSearchesCache[key] = valid;
          return valid;
        }
      }
    }
  } catch {
    // Graceful fallback to memory or empty array
  }

  inMemoryRecentSearchesCache[key] = [];
  return [];
};

/**
 * Adds a search query to the profile's recent searches, maintaining bound and deduplication.
 */
export const addRecentSearch = async (
  profileId: string | undefined,
  query: string,
): Promise<string[]> => {
  const trimmed = (query || '').trim();
  if (!trimmed || trimmed.length > MAX_QUERY_LENGTH) {
    return getRecentSearches(profileId);
  }

  const key = getStorageKey(profileId);
  const current = await getRecentSearches(profileId);
  const normalizedLower = trimmed.toLowerCase();

  // Remove duplicate if already present (case-insensitive check)
  const filtered = current.filter((item) => item.toLowerCase() !== normalizedLower);
  // Add new query to the top
  const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);

  inMemoryRecentSearchesCache[key] = updated;

  try {
    const storage = getAsyncStorage();
    if (storage) {
      await storage.setItem(key, JSON.stringify(updated));
    }
  } catch {
    // Non-fatal, cached in memory
  }

  return updated;
};

/**
 * Removes a single entry from a profile's recent searches.
 */
export const removeRecentSearch = async (
  profileId: string | undefined,
  query: string,
): Promise<string[]> => {
  const key = getStorageKey(profileId);
  const current = await getRecentSearches(profileId);
  const normalizedLower = (query || '').trim().toLowerCase();

  const updated = current.filter((item) => item.toLowerCase() !== normalizedLower);
  inMemoryRecentSearchesCache[key] = updated;

  try {
    const storage = getAsyncStorage();
    if (storage) {
      await storage.setItem(key, JSON.stringify(updated));
    }
  } catch {
    // Non-fatal
  }

  return updated;
};

/**
 * Clears all recent searches for a profile.
 */
export const clearRecentSearches = async (
  profileId?: string,
): Promise<void> => {
  const key = getStorageKey(profileId);
  inMemoryRecentSearchesCache[key] = [];

  try {
    const storage = getAsyncStorage();
    if (storage) {
      await storage.removeItem(key);
    }
  } catch {
    // Non-fatal
  }
};

/**
 * Clears all in-memory caches (for testing and isolation).
 */
export const resetRecentSearchesCache = (): void => {
  for (const k of Object.keys(inMemoryRecentSearchesCache)) {
    delete inMemoryRecentSearchesCache[k];
  }
};
