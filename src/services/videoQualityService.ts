import {AUTO_QUALITY_ID, VideoQualityOption} from '../types/videoQuality';

const QUALITY_PREF_KEY_PREFIX = '@vegaott/video-quality-pref-';

const inMemoryQualityPrefCache: Record<string, string> = {};

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
 * Reads preferred video quality ID from local storage for a specific profile.
 */
export async function getSavedQualityPreference(
  profileId?: string,
): Promise<string | null> {
  const key = `${QUALITY_PREF_KEY_PREFIX}${profileId || 'global'}`;
  try {
    const storage = getAsyncStorage();
    if (storage) {
      const value = await storage.getItem(key);
      if (value) {
        inMemoryQualityPrefCache[key] = value;
        return value;
      }
    }
  } catch (error) {
    console.log('Error reading video quality preference:', error);
  }
  return inMemoryQualityPrefCache[key] || null;
}

/**
 * Saves preferred video quality ID to local storage for a specific profile.
 */
export async function saveQualityPreference(
  profileId: string | undefined,
  qualityId: string,
): Promise<void> {
  const key = `${QUALITY_PREF_KEY_PREFIX}${profileId || 'global'}`;
  inMemoryQualityPrefCache[key] = qualityId;
  try {
    const storage = getAsyncStorage();
    if (storage && qualityId) {
      await storage.setItem(key, qualityId);
    }
  } catch (error) {
    console.log('Error saving video quality preference:', error);
  }
}

/**
 * Clears the in-memory cache (primarily for test resets).
 */
export function clearQualityPrefCache(): void {
  for (const key of Object.keys(inMemoryQualityPrefCache)) {
    delete inMemoryQualityPrefCache[key];
  }
}

/**
 * Finds matching video quality option by ID or resolution/height.
 */
export function findMatchingQuality(
  qualities: VideoQualityOption[],
  targetIdOrHeight?: string | number | null,
): VideoQualityOption | null {
  if (!Array.isArray(qualities) || qualities.length === 0) {
    return null;
  }

  if (!targetIdOrHeight || targetIdOrHeight === AUTO_QUALITY_ID) {
    return (
      qualities.find((q) => q.id === AUTO_QUALITY_ID) ||
      qualities.find((q) => q.isDefault) ||
      qualities[0]
    );
  }

  const queryStr = String(targetIdOrHeight).toLowerCase();

  // 1. Exact ID match
  const byId = qualities.find((q) => q.id.toLowerCase() === queryStr);
  if (byId) {
    return byId;
  }

  // 2. Match by height number (e.g. 1080, 720, 2160, 480)
  const numHeight = parseInt(queryStr.replace(/\D/g, ''), 10);
  if (!isNaN(numHeight) && numHeight > 0) {
    const byHeight = qualities.find((q) => q.height === numHeight);
    if (byHeight) {
      return byHeight;
    }
  }

  // 3. Match by partial label or badge
  const byLabel = qualities.find(
    (q) =>
      q.label.toLowerCase().includes(queryStr) ||
      (q.badge && q.badge.toLowerCase().includes(queryStr)) ||
      (q.shortLabel && q.shortLabel.toLowerCase().includes(queryStr)),
  );
  if (byLabel) {
    return byLabel;
  }

  // Fallback to default / auto
  return (
    qualities.find((q) => q.id === AUTO_QUALITY_ID) ||
    qualities.find((q) => q.isDefault) ||
    qualities[0]
  );
}
