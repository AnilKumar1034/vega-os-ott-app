import {SubtitleCue, SubtitleTrack} from '../types/subtitles';

const SUBTITLE_PREF_KEY_PREFIX = '@vegaott/subtitle-pref-';

const inMemorySubtitlePrefCache: Record<string, string> = {};

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
