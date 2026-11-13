import {HomeContentItem, homeHeroSlides, homeContentRows} from '../data/home';
import {EpisodeItem} from '../types/episode';
import {UserProfile} from '../profiles/types/Profile';
import {canProfileAccessContent} from '../utils/contentAccessPolicy';
import {findContentById} from '../utils/deeplink';
import {buildUnifiedCatalog} from './searchCatalogService';
import {
  getAllEpisodesForContent,
  getEpisodesForContent,
  getLastWatchedEpisode,
} from './episodeService';
import {fetchContinueWatchForContent} from './watchProgressService';
import {parseGenres} from './recommendationService';
import {strings} from '../constants/strings';

export interface CastMember {
  id: string;
  name: string;
  role: string;
}

export interface ContentDetailsPayload {
  content: HomeContentItem;
  isSeries: boolean;
  seasons: number[];
  episodes: EpisodeItem[];
  castMembers: CastMember[];
  relatedContent: HomeContentItem[];
  resumableProgress: number | null;
  resumableEpisode: EpisodeItem | null;
  primaryActionLabel: string;
  isResumable: boolean;
}

/**
 * Resolves full content metadata for a given contentId or fallback object.
 * Searches across hero slides, content rows, unified search catalog, and curated episodes.
 */
export const resolveContentDetails = async (
  contentId?: string,
  fallbackMovie?: any,
): Promise<HomeContentItem | null> => {
  if (fallbackMovie && fallbackMovie.id && fallbackMovie.title) {
    return fallbackMovie;
  }

  const idToSearch = contentId || fallbackMovie?.id || fallbackMovie?.movieId;
  if (!idToSearch) {
    return null;
  }

  // 1. Check home hero slides and content rows via findContentById
  const foundInHome = findContentById(idToSearch);
  if (foundInHome) {
    return foundInHome;
  }

  // 2. Search in unified catalog (includes episodes and channels)
  const unifiedCatalog = buildUnifiedCatalog();
  const foundInCatalog = unifiedCatalog.find((item) => item.id === idToSearch);
  if (foundInCatalog) {
    return foundInCatalog;
  }

  // 3. Check curated episodes map for matching key or episode ID
  const allCuratedEpisodes = getEpisodesForContent(idToSearch);
  if (allCuratedEpisodes && allCuratedEpisodes.length > 0) {
    const firstEp = allCuratedEpisodes[0];
    const seriesTitle = firstEp.seriesTitle || firstEp.title;
    return {
      id: firstEp.seriesId || idToSearch,
      title: seriesTitle,
      description: firstEp.description,
      image: firstEp.image || require('../assets/background.png'),
      genre: firstEp.genre,
      rating: firstEp.rating,
      maturityRating: firstEp.maturityRating,
      videoUrl: firstEp.videoUrl,
      contentType: 'series',
      badge: `${allCuratedEpisodes.length} EPISODES`,
      meta: ['2024', `${allCuratedEpisodes.length} Episodes`, 'Series'],
    };
  }

  // 4. If fallbackMovie has at least a title or id, use as partial item
  if (fallbackMovie && (fallbackMovie.title || fallbackMovie.id)) {
    return {
      id: fallbackMovie.id || idToSearch,
      title: fallbackMovie.title || 'Untitled',
      description: fallbackMovie.description || '',
      image: fallbackMovie.image || require('../assets/background.png'),
      genre: fallbackMovie.genre,
      rating: fallbackMovie.rating,
      maturityRating: fallbackMovie.maturityRating || '13_PLUS',
      videoUrl: fallbackMovie.videoUrl,
      contentType: fallbackMovie.contentType || 'movie',
      meta: fallbackMovie.meta,
      badge: fallbackMovie.badge,
    };
  }

  return null;
};

/**
 * Determines whether a content item is episodic series content.
 */
export const isSeriesContent = (content: HomeContentItem): boolean => {
  if (!content) return false;
  if (content.contentType === 'series') return true;
  if (content.contentType === 'movie') {
    // If explicitly marked as movie, check if it has multiple curated episodes
    const episodes = getEpisodesForContent(content.id, content.title);
    return episodes.length > 1;
  }
  if (Boolean(content.seriesId) && content.contentType !== 'episode') return true;

  if (Array.isArray(content.meta)) {
    const hasSeriesTag = content.meta.some((m) =>
      String(m).toLowerCase().includes('series'),
    );
    if (hasSeriesTag) return true;
  }

  const episodes = getEpisodesForContent(content.id, content.title);
  return episodes.length > 0;
};

/**
 * Extracts unique sorted season numbers for a given series content item.
 */
export const getSeriesSeasons = (content: HomeContentItem): number[] => {
  if (!content) return [1];

  const episodes = getAllEpisodesForContent(content);
  if (!episodes || episodes.length === 0) {
    return [1];
  }

  const seasonSet = new Set<number>();
  episodes.forEach((ep) => {
    seasonSet.add(ep.seasonNumber || 1);
  });

  return Array.from(seasonSet).sort((a, b) => a - b);
};

/**
 * Returns episodes for a series, optionally filtered by season number.
 */
export const getEpisodesForSeries = (
  content: HomeContentItem,
  seasonNumber?: number,
): EpisodeItem[] => {
  if (!content) return [];

  const episodes = getAllEpisodesForContent(content);
  if (!seasonNumber) {
    return episodes;
  }

  return episodes.filter((ep) => (ep.seasonNumber || 1) === seasonNumber);
};

/**
 * Parses cast and director into structured CastMember items.
 */
export const parseCastAndCrew = (content: HomeContentItem): CastMember[] => {
  if (!content) return [];

  const members: CastMember[] = [];
  const seenNames = new Set<string>();

  if (content.director && typeof content.director === 'string') {
    const directorNames = content.director
      .split(/[,/•]/)
      .map((n) => n.trim())
      .filter(Boolean);
    directorNames.forEach((name) => {
      const lower = name.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        members.push({
          id: `director-${lower.replace(/\s+/g, '-')}`,
          name,
          role: 'Director',
        });
      }
    });
  }

  if (content.cast && typeof content.cast === 'string') {
    const castNames = content.cast
      .split(/[,/•]/)
      .map((n) => n.trim())
      .filter(Boolean);
    castNames.forEach((name) => {
      const lower = name.toLowerCase();
      if (!seenNames.has(lower)) {
        seenNames.add(lower);
        members.push({
          id: `cast-${lower.replace(/\s+/g, '-')}`,
          name,
          role: 'Cast',
        });
      }
    });
  }

  return members;
};

/**
 * Returns related content items for the current content item.
 * Excludes current item, filters by profile maturity, and deduplicates.
 */
export const getRelatedContent = (
  content: HomeContentItem,
  activeProfile?: UserProfile | null,
  limit = 10,
): HomeContentItem[] => {
  if (!content) return [];

  const currentId = content.id;
  const currentGenres = parseGenres(content.genre);

  const allItems: HomeContentItem[] = [
    ...homeHeroSlides.map((slide) => ({
      id: slide.id,
      maturityRating: slide.maturityRating,
      title: slide.title,
      image: slide.image,
      badge: slide.badge,
      rating: slide.rating,
      genre: slide.genre,
      cast: slide.cast,
      director: slide.director,
      videoUrl: slide.videoUrl,
      description: slide.description,
      meta: slide.meta,
      seekbarType: slide.seekbarType,
      thumbnails: slide.thumbnails,
      contentType: 'movie' as const,
    })),
    ...homeContentRows.flatMap((r) => r.items),
  ];

  const seenIds = new Set<string>();
  seenIds.add(currentId);

  const filtered = allItems.filter((item) => {
    if (!item?.id || seenIds.has(item.id)) {
      return false;
    }
    seenIds.add(item.id);
    return canProfileAccessContent(activeProfile, item);
  });

  filtered.sort((a, b) => {
    const aGenres = parseGenres(a.genre);
    const bGenres = parseGenres(b.genre);
    const aOverlap = aGenres.filter((g) => currentGenres.includes(g)).length;
    const bOverlap = bGenres.filter((g) => currentGenres.includes(g)).length;
    return bOverlap - aOverlap;
  });

  return filtered.slice(0, limit);
};

/**
 * Resolves viewing progress and resumable episode for a movie or series.
 */
export const getResumeStateForContent = async (
  content: HomeContentItem,
  profileId?: string,
): Promise<{
  isResumable: boolean;
  progress: number | null;
  resumableEpisode: EpisodeItem | null;
  primaryActionLabel: string;
}> => {
  if (!content || !profileId) {
    return {
      isResumable: false,
      progress: null,
      resumableEpisode: null,
      primaryActionLabel: strings.actions.watchWithIcon,
    };
  }

  const isSeries = isSeriesContent(content);

  if (isSeries) {
    const episodes = getAllEpisodesForContent(content);

    // 1. Check if user watched a specific episode in this series
    const lastWatchedEpId = await getLastWatchedEpisode(profileId, content.id);
    if (lastWatchedEpId && episodes.length > 0) {
      const ep = episodes.find((e) => e.id === lastWatchedEpId);
      if (ep) {
        const epProgress = await fetchContinueWatchForContent(profileId, ep.id);
        const progressVal =
          epProgress && epProgress.progress > 0 && epProgress.progress < 1
            ? epProgress.progress
            : null;
        return {
          isResumable: Boolean(progressVal),
          progress: progressVal,
          resumableEpisode: ep,
          primaryActionLabel: progressVal
            ? `▶ Resume S${ep.seasonNumber || 1}:E${ep.episodeNumber || 1}`
            : `▶ Play S${ep.seasonNumber || 1}:E${ep.episodeNumber || 1}`,
        };
      }
    }

    // 2. Check if series overall has progress record
    const seriesProgress = await fetchContinueWatchForContent(
      profileId,
      content.id,
    );
    if (
      seriesProgress &&
      seriesProgress.progress > 0 &&
      seriesProgress.progress < 1
    ) {
      const firstEp = episodes[0] || null;
      return {
        isResumable: true,
        progress: seriesProgress.progress,
        resumableEpisode: firstEp,
        primaryActionLabel: '▶ Resume Watching',
      };
    }

    // 3. Default for series: Play S1:E1 or Play
    const firstEp = episodes[0] || null;
    return {
      isResumable: false,
      progress: null,
      resumableEpisode: firstEp,
      primaryActionLabel: firstEp
        ? `▶ Play S${firstEp.seasonNumber || 1}:E${firstEp.episodeNumber || 1}`
        : strings.actions.watchWithIcon,
    };
  } else {
    // Movie
    const progressRecord = await fetchContinueWatchForContent(
      profileId,
      content.id,
    );
    if (
      progressRecord &&
      progressRecord.progress > 0 &&
      progressRecord.progress < 1
    ) {
      return {
        isResumable: true,
        progress: progressRecord.progress,
        resumableEpisode: null,
        primaryActionLabel: '▶ Resume',
      };
    }
    return {
      isResumable: false,
      progress: null,
      resumableEpisode: null,
      primaryActionLabel: strings.actions.watchWithIcon,
    };
  }
};
