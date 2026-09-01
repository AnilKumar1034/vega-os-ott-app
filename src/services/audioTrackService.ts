import {AudioTrack} from '../types/audioTracks';

const AUDIO_PREF_KEY_PREFIX = '@vegaott/audio-track-pref-';

const inMemoryAudioPrefCache: Record<string, string> = {};

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
 * Reads preferred audio track ID / language from local storage for a specific profile.
 */
export async function getSavedAudioPreference(
  profileId?: string,
): Promise<string | null> {
  const key = `${AUDIO_PREF_KEY_PREFIX}${profileId || 'global'}`;
  try {
    const storage = getAsyncStorage();
    if (storage) {
      const value = await storage.getItem(key);
      if (value) {
        inMemoryAudioPrefCache[key] = value;
        return value;
      }
    }
  } catch (error) {
    console.log('Error reading audio track preference:', error);
  }
  return inMemoryAudioPrefCache[key] || null;
}

/**
 * Saves preferred audio track ID / language to local storage for a specific profile.
 */
export async function saveAudioPreference(
  profileId: string | undefined,
  trackId: string,
): Promise<void> {
  const key = `${AUDIO_PREF_KEY_PREFIX}${profileId || 'global'}`;
  inMemoryAudioPrefCache[key] = trackId;
  try {
    const storage = getAsyncStorage();
    if (storage && trackId) {
      await storage.setItem(key, trackId);
    }
  } catch (error) {
    console.log('Error saving audio track preference:', error);
  }
}

/**
 * Finds the best matching audio track from an available list by track ID or language code.
 */
export function findMatchingAudioTrack(
  tracks: AudioTrack[],
  targetIdOrLanguage?: string | null,
): AudioTrack | null {
  if (!Array.isArray(tracks) || tracks.length === 0 || !targetIdOrLanguage) {
    return null;
  }

  // 1. Exact ID match
  const byId = tracks.find((t) => t.id === targetIdOrLanguage);
  if (byId) {
    return byId;
  }

  // 2. Exact Language match (e.g. 'en', 'te', 'hi')
  const byLang = tracks.find(
    (t) =>
      t.language.toLowerCase() === targetIdOrLanguage.toLowerCase() ||
      targetIdOrLanguage.toLowerCase().startsWith(t.language.toLowerCase()),
  );
  if (byLang) {
    return byLang;
  }

  // 3. Fallback to default or first track
  return tracks.find((t) => t.isDefault) || tracks[0] || null;
}
