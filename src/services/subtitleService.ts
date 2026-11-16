import {SubtitleCue, SubtitleTrack} from '../types/subtitles';

const SUBTITLE_PREF_KEY_PREFIX = '@vegaott/subtitle-pref-';
const SUBTITLE_APPEARANCE_KEY_PREFIX = '@vegaott/subtitle-appearance-';

const inMemorySubtitlePrefCache: Record<string, string> = {};
const inMemorySubtitleAppearanceCache: Record<string, any> = {};

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
 * Parses timestamp strings such as "00:01:23.456" or "01:23.456" into total seconds.
 */
export function parseVttTimestamp(timeStr: string): number {
  if (!timeStr) {
    return 0;
  }

  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }
  return parseFloat(timeStr) || 0;
}

/**
 * Robust parser for WebVTT and SRT caption text into structured subtitle cues.
 */
export function parseWebVTT(rawText: string): SubtitleCue[] {
  if (!rawText || typeof rawText !== 'string') {
    return [];
  }

  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      continue;
    }

    // Skip WebVTT header blocks (e.g. "WEBVTT", "NOTE", "STYLE")
    if (
      lines[0].startsWith('WEBVTT') ||
      lines[0].startsWith('NOTE') ||
      lines[0].startsWith('STYLE') ||
      lines[0].startsWith('REGION')
    ) {
      continue;
    }

    let timeLineIndex = 0;
    let cueId: string | undefined;

    if (
      !lines[0].includes('-->') &&
      lines.length > 1 &&
      lines[1].includes('-->')
    ) {
      cueId = lines[0];
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) {
      continue;
    }

    const [startStr, endStrAndSettings] = timeLine.split('-->');
    if (!startStr || !endStrAndSettings) {
      continue;
    }

    const endStr = endStrAndSettings.trim().split(/\s+/)[0];
    const startTime = parseVttTimestamp(startStr);
    const endTime = parseVttTimestamp(endStr);

    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '') // strip HTML/VTT formatting tags like <v Voice>, <b>, <i>, <c>
      .trim();

    if (
      text &&
      Number.isFinite(startTime) &&
      Number.isFinite(endTime) &&
      endTime > startTime
    ) {
      cues.push({
        id: cueId || cues.length + 1,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues;
}

/**
 * Finds the currently active subtitle cue for a given playback time in seconds.
 * Supports continuous rolling playback for live TV channels.
 */
export function findActiveSubtitleCue(
  cues: SubtitleCue[] | undefined,
  currentTime: number,
): SubtitleCue | null {
  if (
    !Array.isArray(cues) ||
    cues.length === 0 ||
    !Number.isFinite(currentTime)
  ) {
    return null;
  }

  // 1. Direct range search [startTime, endTime]
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (currentTime >= cue.startTime && currentTime <= cue.endTime) {
      return cue;
    }
  }

  // 2. Rolling live broadcast modulo search if currentTime is beyond last cue
  const lastCue = cues[cues.length - 1];
  if (lastCue && currentTime > lastCue.endTime && lastCue.endTime > 0) {
    const cycleDuration = lastCue.endTime;
    const effectiveTime = currentTime % cycleDuration;
    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (effectiveTime >= cue.startTime && effectiveTime <= cue.endTime) {
        return cue;
      }
    }
  }

  return null;
}

/**
 * Reads preferred subtitle track ID from local storage for a specific profile.
 */
export async function getSavedSubtitlePreference(
  profileId?: string,
): Promise<string | null> {
  const key = `${SUBTITLE_PREF_KEY_PREFIX}${profileId || 'global'}`;
  try {
    const storage = getAsyncStorage();
    if (storage) {
      const value = await storage.getItem(key);
      if (value) {
        inMemorySubtitlePrefCache[key] = value;
        return value;
      }
    }
  } catch (error) {
    console.log('Error reading subtitle preference:', error);
  }
  return inMemorySubtitlePrefCache[key] || null;
}

/**
 * Reads preferred subtitle appearance settings (fontSize, contrast) for a specific profile.
 */
export async function getSavedSubtitleAppearancePreference(
  profileId?: string,
): Promise<{fontSize?: 'small' | 'medium' | 'large'; contrast?: 'standard' | 'high' | 'translucent'}> {
  const key = `${SUBTITLE_APPEARANCE_KEY_PREFIX}${profileId || 'global'}`;
  try {
    const storage = getAsyncStorage();
    if (storage) {
      const raw = await storage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        inMemorySubtitleAppearanceCache[key] = parsed;
        return parsed;
      }
    }
  } catch (error) {
    console.log('Error reading subtitle appearance preference:', error);
  }
  return inMemorySubtitleAppearanceCache[key] || {fontSize: 'medium', contrast: 'standard'};
}

/**
 * Saves subtitle appearance settings to local storage for a specific profile.
 */
export async function saveSubtitleAppearancePreference(
  profileId: string | undefined,
  settings: {fontSize?: 'small' | 'medium' | 'large'; contrast?: 'standard' | 'high' | 'translucent'},
): Promise<void> {
  const key = `${SUBTITLE_APPEARANCE_KEY_PREFIX}${profileId || 'global'}`;
  inMemorySubtitleAppearanceCache[key] = settings;
  try {
    const storage = getAsyncStorage();
    if (storage && settings) {
      await storage.setItem(key, JSON.stringify(settings));
    }
  } catch (error) {
    console.log('Error saving subtitle appearance preference:', error);
  }
}

/**
 * Returns font size and capsule background styling for given appearance preferences.
 */
export function getSubtitleStyleForAppearance(appearance?: {
  fontSize?: 'small' | 'medium' | 'large';
  contrast?: 'standard' | 'high' | 'translucent';
}) {
  let fontSize = 12;
  let lineHeight = 18;
  if (appearance?.fontSize === 'small') {
    fontSize = 10;
    lineHeight = 15;
  } else if (appearance?.fontSize === 'large') {
    fontSize = 15;
    lineHeight = 22;
  }

  let backgroundColor = 'rgba(0, 0, 0, 0.82)';
  let borderColor = 'rgba(255, 255, 255, 0.15)';
  let textColor = '#FFFFFF';

  if (appearance?.contrast === 'high') {
    backgroundColor = '#000000';
    borderColor = '#FFFF00';
    textColor = '#FFFF00';
  } else if (appearance?.contrast === 'translucent') {
    backgroundColor = 'rgba(0, 0, 0, 0.50)';
    borderColor = 'transparent';
  }

  return {fontSize, lineHeight, backgroundColor, borderColor, textColor};
}

/**
 * Loads and resolves subtitle cues for a track (supporting static cues or remote WebVTT URLs).
 */
export async function loadSubtitleTrackCues(
  track: SubtitleTrack | null | undefined,
): Promise<SubtitleCue[]> {
  if (!track) {
    return [];
  }
  if (Array.isArray(track.cues) && track.cues.length > 0) {
    return track.cues;
  }
  if (track.uri) {
    try {
      const response = await fetch(track.uri);
      if (response.ok) {
        const text = await response.text();
        const parsed = parseWebVTT(text);
        track.cues = parsed;
        return parsed;
      }
    } catch (e) {
      console.log('Error fetching remote WebVTT track:', e);
    }
  }
  return [];
}

/**
 * Saves preferred subtitle track ID to local storage for a specific profile.
 */
export async function saveSubtitlePreference(
  profileId: string | undefined,
  trackId: string,
): Promise<void> {
  const key = `${SUBTITLE_PREF_KEY_PREFIX}${profileId || 'global'}`;
  inMemorySubtitlePrefCache[key] = trackId;
  try {
    const storage = getAsyncStorage();
    if (storage && trackId) {
      await storage.setItem(key, trackId);
    }
  } catch (error) {
    console.log('Error saving subtitle preference:', error);
  }
}

/**
 * Clears the in-memory subtitle caches (primarily for unit tests).
 */
export function clearSubtitlePrefCache(): void {
  for (const k of Object.keys(inMemorySubtitlePrefCache)) {
    delete inMemorySubtitlePrefCache[k];
  }
  for (const k of Object.keys(inMemorySubtitleAppearanceCache)) {
    delete inMemorySubtitleAppearanceCache[k];
  }
}
