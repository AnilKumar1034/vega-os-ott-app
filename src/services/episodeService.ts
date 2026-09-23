import {EpisodeItem} from '../types/episode';
import {
  getEpisodesForContent,
  getNextEpisodeForContent,
  getNextEpisodesForContent,
  getAllEpisodesForContent,
} from '../data/episodes';

export const DEFAULT_NEXT_EPISODE_COUNTDOWN_SECONDS = 60;

const LAST_WATCHED_EPISODE_KEY_PREFIX = '@vega_last_watched_episode_';

const inMemoryLastWatchedCache: Record<string, string> = {};

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

/**
 * Returns whether autoplay is enabled for the current profile/user context.
 * Prioritizes active profile preference, falls back to auth user profile preference,
 * and defaults to true if neither is explicitly disabled.
 */
export function isAutoplayEnabled(
  userProfile?: {autoplayEnabled?: boolean} | null,
  activeProfile?: {autoplay?: boolean} | null,
): boolean {
  if (activeProfile?.autoplay !== undefined) {
    return Boolean(activeProfile.autoplay);
  }
  if (userProfile?.autoplayEnabled !== undefined) {
    return Boolean(userProfile.autoplayEnabled);
  }
  return true;
}

/**
 * Returns the next episode for a given content item.
 */
export function getNextEpisode(
  content: any,
  currentEpisodeId?: string,
): EpisodeItem | null {
  return getNextEpisodeForContent(content, currentEpisodeId);
}

/**
 * Formats season and episode into a standard label (e.g., "S1:E2").
 */
export function formatSeasonEpisodeLabel(
  seasonNumber?: number,
  episodeNumber?: number,
): string {
  const s = seasonNumber || 1;
  const e = episodeNumber || 1;
  return `S${s}:E${e}`;
}

/**
 * Persists the last watched episode ID for a given profile and series.
 */
export async function saveLastWatchedEpisode(
  profileId: string,
  seriesId: string,
  episodeId: string,
): Promise<void> {
  if (!profileId || !seriesId || !episodeId) {
    return;
  }
  const key = `${LAST_WATCHED_EPISODE_KEY_PREFIX}${profileId}_${seriesId}`;
  inMemoryLastWatchedCache[key] = episodeId;
  try {
    const storage = getAsyncStorage();
    if (storage) {
      await storage.setItem(key, episodeId);
    }
  } catch (error) {
    console.log('Error saving last watched episode:', error);
  }
}

/**
 * Retrieves the last watched episode ID for a given profile and series.
 */
export async function getLastWatchedEpisode(
  profileId: string,
  seriesId: string,
): Promise<string | null> {
  if (!profileId || !seriesId) {
    return null;
  }
  const key = `${LAST_WATCHED_EPISODE_KEY_PREFIX}${profileId}_${seriesId}`;
  if (inMemoryLastWatchedCache[key]) {
    return inMemoryLastWatchedCache[key];
  }
  try {
    const storage = getAsyncStorage();
    if (storage) {
      const val = await storage.getItem(key);
      if (val) {
        inMemoryLastWatchedCache[key] = val;
        return val;
      }
    }
  } catch (error) {
    console.log('Error getting last watched episode:', error);
  }
  return null;
}

export function clearLastWatchedEpisodeCache(): void {
  for (const key of Object.keys(inMemoryLastWatchedCache)) {
    delete inMemoryLastWatchedCache[key];
  }
}

/**
 * Returns upcoming episodes following the current episode.
 */
export function getNextEpisodes(
  content: any,
  currentEpisodeId?: string,
): EpisodeItem[] {
  return getNextEpisodesForContent(content, currentEpisodeId);
}

/**
 * Returns all episodes for the series or content.
 */
export function getAllEpisodes(
  content: any,
  currentEpisodeId?: string,
): EpisodeItem[] {
  return getAllEpisodesForContent(content, currentEpisodeId);
}

export {
  getEpisodesForContent,
  getNextEpisodeForContent,
  getNextEpisodesForContent,
  getAllEpisodesForContent,
};
