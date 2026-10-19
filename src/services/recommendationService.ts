import {homeContentRows, homeHeroSlides, HomeContentItem} from '../data/home';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {findContentById} from '../utils/deeplink';
import {
  RecommendationScoringOptions,
  RecommendationSectionResult,
} from '../types/recommendations';

/**
 * Parses genres from a genre string (e.g. "Action • Sci-Fi • Drama" -> ["action", "sci-fi", "drama"]).
 */
export const parseGenres = (genreStr?: string): string[] => {
  if (!genreStr || typeof genreStr !== 'string') {
    return [];
  }
  return genreStr
    .split(/[•,/|]/)
    .map((g) => g.trim().toLowerCase())
    .filter((g) => g.length > 0);
};

/**
 * Extracts a numeric rating from strings like "⭐ 8.9 / 10" -> 8.9.
 */
export const parseRatingNumber = (ratingStr?: string): number => {
  if (!ratingStr || typeof ratingStr !== 'string') {
    return 0;
  }
  const match = ratingStr.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
};

/**
 * Extracts the 4-digit release year from a movie's meta tags (e.g. ["2024", "4K UHD"] -> 2024).
 */
export const parseReleaseYear = (meta?: string | string[]): number => {
  if (!meta) {
    return 0;
  }
  if (typeof meta === 'string') {
    const match = meta.match(/\b(19\d\d|20\d\d)\b/);
    return match ? parseInt(match[1], 10) : 0;
  }
  if (Array.isArray(meta)) {
    for (const m of meta) {
      const match = String(m).match(/\b(19\d\d|20\d\d)\b/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
  }
  return 0;
};

/**
 * Checks if a content item matches the specified language in badge, genre, or meta tags.
 */
export const matchesLanguage = (
  item: HomeContentItem,
  language?: string,
): boolean => {
  if (!language || typeof language !== 'string') {
    return false;
  }
  const langLower = language.trim().toLowerCase();
  if (!langLower) {
    return false;
  }

  if (item.badge && item.badge.toLowerCase().includes(langLower)) {
    return true;
  }
  if (item.genre && item.genre.toLowerCase().includes(langLower)) {
    return true;
  }
  const metaVal = item.meta as any;
  if (typeof metaVal === 'string' && metaVal.toLowerCase().includes(langLower)) {
    return true;
  } else if (
    Array.isArray(metaVal) &&
    metaVal.some((m: any) => typeof m === 'string' && m.toLowerCase().includes(langLower))
  ) {
    return true;
  }
  if (Array.isArray((item as any).audioTracks)) {
    const hasAudioMatch = (item as any).audioTracks.some(
      (track: any) =>
        (track.language && track.language.toLowerCase() === langLower) ||
        (track.label && track.label.toLowerCase().includes(langLower)),
    );
    if (hasAudioMatch) {
      return true;
    }
  }
  return false;
};

/**
 * Returns a deduplicated catalog of all available content items from hero slides and rows.
 */
export const getAllCatalogItems = (): HomeContentItem[] => {
  const seenIds = new Set<string>();
  const items: HomeContentItem[] = [];

  // Hero slides as catalog items
  for (const slide of homeHeroSlides) {
    if (!seenIds.has(slide.id)) {
      seenIds.add(slide.id);
      items.push({
        id: slide.id,
        title: slide.title,
        maturityRating: slide.maturityRating,
        image: slide.image,
        description: slide.description,
        meta: slide.meta,
        badge: slide.badge,
        rating: slide.rating,
        genre: slide.genre,
        cast: slide.cast,
        director: slide.director,
        videoUrl: slide.videoUrl,
        seekbarType: slide.seekbarType,
        thumbnails: slide.thumbnails,
        contentType: 'movie',
      });
    }
  }

  // Row items (excluding mock continue-watching, favourites, and my-list)
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
        items.push(item);
      }
    }
  }

  return items;
};

/**
 * In-memory cache for recommendation results per profile.
 */
const recommendationsCache = new Map<string, RecommendationSectionResult>();

const getCacheKey = (
  profileId: string,
  history: any[],
  cw: any[],
  wl: any[],
): string => {
  const latestHistory = history[0]?.contentId || '';
  const latestHistoryTime = history[0]?.watchedAt || '';
  const latestCw = cw[0]?.contentId || '';
  const latestCwTime = cw[0]?.updatedAt || '';
  return `${profileId}_h:${history.length}_${latestHistory}_${latestHistoryTime}_cw:${cw.length}_${latestCw}_${latestCwTime}_wl:${wl.length}`;
};

export const clearRecommendationCache = (profileId?: string): void => {
  if (profileId) {
    for (const key of recommendationsCache.keys()) {
      if (key.startsWith(profileId)) {
        recommendationsCache.delete(key);
      }
    }
  } else {
    recommendationsCache.clear();
  }
};

/**
 * Computes personalized recommendations based on profile signals and catalog metadata.
 */
export const getPersonalizedRecommendations = (
  options: RecommendationScoringOptions,
): RecommendationSectionResult => {
  const {
    activeProfile,
    catalog,
    viewingHistory = [],
    continueWatching = [],
    watchlist = [],
    limit = 15,
  } = options;

  const cacheKey = activeProfile?.id
    ? getCacheKey(activeProfile.id, viewingHistory, continueWatching, watchlist)
    : null;

  if (cacheKey && recommendationsCache.has(cacheKey)) {
    return recommendationsCache.get(cacheKey)!;
  }

  // Set of content IDs currently in Continue Watching (to avoid duplicate recommendations)
  const continueWatchingIds = new Set<string>(
    continueWatching.map((cw) => cw.contentId),
  );

  // Filter catalog items accessible to the active profile
  const accessibleCatalog = catalog.filter((item) =>
    canProfileAccessContent(activeProfile, item),
  );

  // 1. Calculate genre frequency from Viewing History
  const historyGenreWeights: Record<string, number> = {};
  for (const item of viewingHistory) {
    const genres = parseGenres(item.genre);
    const weight = Math.max(1, item.watchCount || 1);
    for (const g of genres) {
      historyGenreWeights[g] = (historyGenreWeights[g] || 0) + weight;
    }
  }

  // 2. Calculate genre frequency from Watchlist
  const watchlistGenreWeights: Record<string, number> = {};
  for (const item of watchlist) {
    const genres = parseGenres(item.genre);
    for (const g of genres) {
      watchlistGenreWeights[g] = (watchlistGenreWeights[g] || 0) + 1;
    }
  }

  // 3. User preferred genres
  const preferredGenres = new Set<string>(
    (activeProfile?.preferredGenres || []).map((g) => g.trim().toLowerCase()),
  );

  // 4. Preferred language
  const preferredLanguage = activeProfile?.language;

  // Determine if profile has any viewing signals
  const hasHistory = viewingHistory.length > 0;
  const hasWatchlist = watchlist.length > 0;
  const hasPreferences = preferredGenres.size > 0 || Boolean(preferredLanguage);
  const hasSignals = hasHistory || hasWatchlist || hasPreferences;

  // --- A. Compute "Recommended for You" ---
  let recommendedForYou: HomeContentItem[] = [];

  if (hasSignals) {
    const scoredItems: {item: HomeContentItem; score: number}[] = [];

    for (const item of accessibleCatalog) {
      // Exclude items currently in Continue Watching
      if (continueWatchingIds.has(item.id)) {
        continue;
      }

      let score = 0;
      const itemGenres = parseGenres(item.genre);

      // Viewing history overlap
      for (const g of itemGenres) {
        if (historyGenreWeights[g]) {
          score += historyGenreWeights[g] * 3;
        }
      }

      // Watchlist overlap
      for (const g of itemGenres) {
        if (watchlistGenreWeights[g]) {
          score += watchlistGenreWeights[g] * 2;
        }
      }

      // Preferred genres overlap
      for (const g of itemGenres) {
        if (preferredGenres.has(g)) {
          score += 3;
        }
      }

      // Language match
      if (preferredLanguage && matchesLanguage(item, preferredLanguage)) {
        score += 2;
      }

      // Quality / rating tie-breaker
      const ratingNum = parseRatingNumber(item.rating);
      if (ratingNum > 0) {
        score += ratingNum / 10;
      }

      if (score > 0) {
        scoredItems.push({item, score});
      }
    }

    scoredItems.sort((a, b) => b.score - a.score);
    recommendedForYou = scoredItems.map((s) => s.item).slice(0, limit);
  }

  // If insufficient items, pad with top-rated accessible catalog items
  if (recommendedForYou.length < limit) {
    const selectedIds = new Set<string>(recommendedForYou.map((i) => i.id));
    const fallbackCandidates = accessibleCatalog.filter(
      (item) => !continueWatchingIds.has(item.id) && !selectedIds.has(item.id),
    );

    // Sort fallback candidates by rating DESC, then release year DESC
    fallbackCandidates.sort((a, b) => {
      const ratingDiff = parseRatingNumber(b.rating) - parseRatingNumber(a.rating);
      if (ratingDiff !== 0) {
        return ratingDiff;
      }
      return parseReleaseYear(b.meta) - parseReleaseYear(a.meta);
    });

    const needed = limit - recommendedForYou.length;
    recommendedForYou.push(...fallbackCandidates.slice(0, needed));
  }

  // --- B. Compute "Because You Watched {Title}" ---
  let becauseYouWatched: {sourceTitle: string; items: HomeContentItem[]} | null =
    null;

  // Find latest watched reference title (from viewing history or continue watching)
  let referenceItem: HomeContentItem | null = null;
  if (viewingHistory.length > 0) {
    const latest = viewingHistory[0];
    referenceItem = findContentById(latest.contentId);
    if (!referenceItem && latest.title) {
      // Find in catalog by title if ID was dynamic
      referenceItem =
        accessibleCatalog.find(
          (c) => c.title.toLowerCase() === latest.title.toLowerCase(),
        ) || null;
    }
  } else if (continueWatching.length > 0) {
    const latest = continueWatching[0];
    referenceItem = findContentById(latest.contentId);
  }

  if (referenceItem) {
    const refGenres = parseGenres(referenceItem.genre);
    if (refGenres.length > 0) {
      const matchingCandidates: {item: HomeContentItem; matchCount: number}[] =
        [];

      for (const item of accessibleCatalog) {
        // Never recommend the same item or items in Continue Watching
        if (item.id === referenceItem.id || continueWatchingIds.has(item.id)) {
          continue;
        }

        const itemGenres = parseGenres(item.genre);
        let matchCount = 0;
        for (const rg of refGenres) {
          if (itemGenres.includes(rg)) {
            matchCount++;
          }
        }

        if (matchCount > 0) {
          matchingCandidates.push({item, matchCount});
        }
      }

      const recommendedIds = new Set<string>(recommendedForYou.map((i) => i.id));

      matchingCandidates.sort((a, b) => {
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount;
        }
        // Avoid duplicate content across sections where practical
        const aInRec = recommendedIds.has(a.item.id) ? 1 : 0;
        const bInRec = recommendedIds.has(b.item.id) ? 1 : 0;
        if (aInRec !== bInRec) {
          return aInRec - bInRec;
        }
        return parseRatingNumber(b.item.rating) - parseRatingNumber(a.item.rating);
      });

      // Show "Because You Watched" only if at least 2 distinct matching items exist
      if (matchingCandidates.length >= 2) {
        becauseYouWatched = {
          sourceTitle: referenceItem.title,
          items: matchingCandidates.map((c) => c.item).slice(0, limit),
        };
      }
    }
  }

  // --- C. Compute "Recently Added" ---
  const recommendedIds = new Set<string>(recommendedForYou.map((i) => i.id));
  const recentlyAddedCandidates = accessibleCatalog.filter(
    (item) => !continueWatchingIds.has(item.id),
  );

  recentlyAddedCandidates.sort((a, b) => {
    // Avoid duplicate content across sections where practical
    const aInRec = recommendedIds.has(a.id) ? 1 : 0;
    const bInRec = recommendedIds.has(b.id) ? 1 : 0;
    if (aInRec !== bInRec) {
      return aInRec - bInRec;
    }
    const yearA = parseReleaseYear(a.meta);
    const yearB = parseReleaseYear(b.meta);
    if (yearB !== yearA) {
      return yearB - yearA;
    }
    return parseRatingNumber(b.rating) - parseRatingNumber(a.rating);
  });

  const recentlyAdded = recentlyAddedCandidates.slice(0, limit);

  const result: RecommendationSectionResult = {
    recommendedForYou,
    becauseYouWatched,
    recentlyAdded,
  };

  if (cacheKey) {
    recommendationsCache.set(cacheKey, result);
  }

  return result;
};
