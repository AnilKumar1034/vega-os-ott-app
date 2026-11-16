import {
  PlaybackSpeed,
  SUPPORTED_PLAYBACK_SPEEDS,
  DEFAULT_PLAYBACK_SPEED,
} from '../types/playerFeatures';

export {SUPPORTED_PLAYBACK_SPEEDS, DEFAULT_PLAYBACK_SPEED};
export type {PlaybackSpeed};

export const MAX_RECOVERY_ATTEMPTS = 3;
export const BASE_RECOVERY_DELAY_MS = 1000;
export const MAX_RECOVERY_DELAY_MS = 4000;

/**
 * Validates a start-end time interval.
 * Returns { start, end } if valid, or null if missing, non-finite, negative, or reversed.
 */
export function validateInterval(
  interval?: {start?: number; end?: number} | null,
): {start: number; end: number} | null {
  if (!interval || typeof interval !== 'object') {
    return null;
  }
  const start = Number(interval.start);
  const end = Number(interval.end);

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  if (start < 0 || end <= start) {
    return null;
  }
  return {start, end};
}

/**
 * Checks whether the given playback position is within a time interval.
 */
export function isPositionInInterval(
  position: number,
  interval?: {start?: number; end?: number} | null,
): boolean {
  if (!Number.isFinite(position) || position < 0) {
    return false;
  }
  const valid = validateInterval(interval);
  if (!valid) {
    return false;
  }
  return position >= valid.start && position < valid.end;
}

/**
 * Extracts intro start and end timestamps from content metadata.
 */
export function extractIntroInterval(
  content?: any,
): {start: number; end: number} | null {
  if (!content || typeof content !== 'object') {
    return null;
  }
  // 1. Direct intro object { start, end }
  if (content.intro && typeof content.intro === 'object') {
    const valid = validateInterval(content.intro);
    if (valid) {
      return valid;
    }
  }

  // 2. introStart and introEnd numbers
  if (content.introStart !== undefined && content.introEnd !== undefined) {
    const valid = validateInterval({
      start: content.introStart,
      end: content.introEnd,
    });
    if (valid) {
      return valid;
    }
  }

  // 3. Markers list with type 'intro'
  if (Array.isArray(content.markers)) {
    const introMarker = content.markers.find(
      (m: any) =>
        m &&
        (m.type === 'intro' || String(m.label || '').toLowerCase().includes('intro')),
    );
    if (introMarker) {
      const valid = validateInterval({
        start: introMarker.start ?? introMarker.position,
        end: introMarker.end ?? (introMarker.start ?? introMarker.position) + (introMarker.duration || 0),
      });
      if (valid) {
        return valid;
      }
    }
  }

  return null;
}

/**
 * Extracts recap start and end timestamps from content metadata.
 */
export function extractRecapInterval(
  content?: any,
): {start: number; end: number} | null {
  if (!content || typeof content !== 'object') {
    return null;
  }
  // 1. Direct recap object { start, end }
  if (content.recap && typeof content.recap === 'object') {
    const valid = validateInterval(content.recap);
    if (valid) {
      return valid;
    }
  }

  // 2. recapStart and recapEnd numbers
  if (content.recapStart !== undefined && content.recapEnd !== undefined) {
    const valid = validateInterval({
      start: content.recapStart,
      end: content.recapEnd,
    });
    if (valid) {
      return valid;
    }
  }

  // 3. Markers list with type 'recap'
  if (Array.isArray(content.markers)) {
    const recapMarker = content.markers.find(
      (m: any) =>
        m &&
        (m.type === 'recap' || String(m.label || '').toLowerCase().includes('recap')),
    );
    if (recapMarker) {
      const valid = validateInterval({
        start: recapMarker.start ?? recapMarker.position,
        end: recapMarker.end ?? (recapMarker.start ?? recapMarker.position) + (recapMarker.duration || 0),
      });
      if (valid) {
        return valid;
      }
    }
  }

  return null;
}

/**
 * Checks whether the underlying player or adapter supports playback speed adjustment.
 */
export function isPlaybackSpeedSupported(player: any): boolean {
  if (!player) {
    return false;
  }
  try {
    return (
      'playbackRate' in player ||
      typeof player.setPlaybackRate === 'function' ||
      typeof player.playRateController?.set === 'function'
    );
  } catch {
    return false;
  }
}

/**
 * Applies a supported playback rate to the player instance and Shaka adapter if present.
 */
export function applyPlaybackSpeed(
  player: any,
  rate: number,
  shakaPlayer?: any,
): boolean {
  if (!SUPPORTED_PLAYBACK_SPEEDS.includes(rate as PlaybackSpeed)) {
    return false;
  }
  let applied = false;

  // 1. Native W3C / Kepler player element
  if (player) {
    try {
      if (typeof player.setPlaybackRate === 'function') {
        player.setPlaybackRate(rate);
        applied = true;
      } else {
        player.playbackRate = rate;
        applied = true;
      }
    } catch (e) {
      console.log('Error applying playbackRate to player:', e);
    }
  }

  // 2. Shaka Player trick play / playRateController
  if (shakaPlayer) {
    try {
      const rawShaka = shakaPlayer.player || shakaPlayer;
      if (typeof rawShaka.trickPlay === 'function') {
        rawShaka.trickPlay(rate);
        applied = true;
      } else if (rawShaka.getMediaElement?.()) {
        rawShaka.getMediaElement().playbackRate = rate;
        applied = true;
      }
    } catch (e) {
      console.log('Error applying playbackRate to Shaka:', e);
    }
  }

  return applied;
}

/**
 * Determines whether a player error is potentially recoverable (e.g. network timeout)
 * vs fatal (e.g. DRM license failure, entitlement denied, parental lock).
 */
export function isRecoverablePlaybackError(error: any): boolean {
  if (!error) {
    return false;
  }

  const rawMessage =
    typeof error === 'string'
      ? error
      : `${error.message || ''} ${error.code || ''} ${error.category || ''}`;
  const lower = rawMessage.toLowerCase();

  // Fatal scenarios that must never be auto-retried
  const fatalPatterns = [
    'drm',
    'widevine',
    'license',
    'cdm',
    'hdcp',
    'eme',
    'entitlement',
    'subscription',
    'unauthorized',
    'forbidden',
    '403',
    '401',
    'parental',
    'pin blocked',
    'maturity',
    'not entitled',
    'unsupported_format',
    'unsupported format',
    'codec',
  ];

  for (const pattern of fatalPatterns) {
    if (lower.includes(pattern)) {
      return false;
    }
  }

  // Recoverable scenarios
  const recoverablePatterns = [
    'network',
    'timeout',
    'offline',
    'connection',
    'fetch',
    'stalled',
    'buffer',
    'failed to fetch',
    '500',
    '502',
    '503',
    '504',
    'load failed',
    'media_err_network',
  ];

  for (const pattern of recoverablePatterns) {
    if (lower.includes(pattern)) {
      return true;
    }
  }

  // Shaka error codes: category 1 is NETWORK (recoverable), category 6 is DRM (fatal)
  if (error.category === 1 || error.severity === 1) {
    return true;
  }

  return false;
}

/**
 * Calculates exponential backoff delay for retry attempts.
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = BASE_RECOVERY_DELAY_MS,
  maxDelayMs: number = MAX_RECOVERY_DELAY_MS,
): number {
  const boundedAttempt = Math.max(1, attempt);
  const delay = baseDelayMs * Math.pow(2, boundedAttempt - 1);
  return Math.min(delay, maxDelayMs);
}
