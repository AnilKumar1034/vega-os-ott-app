/**
 * Normalized Playback Error models and sanitizer for OTT video analytics.
 * Strictly maps all player, network, codec, and DRM failures into controlled categories.
 */

export type PlaybackErrorCategory =
  | 'NETWORK'
  | 'SOURCE'
  | 'CODEC'
  | 'DRM'
  | 'MANIFEST'
  | 'MEDIA'
  | 'PLAYER'
  | 'UNKNOWN';

export interface NormalizedPlaybackError {
  category: PlaybackErrorCategory;
  code: string;
  message: string;
  errorCategory: PlaybackErrorCategory;
  errorCode: string;
  errorMessage: string;
  isFatal?: boolean;
}

/**
 * Sanitizes error messages by scrubbing sensitive tokens, authorization headers,
 * credentials, query secrets, and large native stack traces.
 */
export function sanitizeErrorMessage(rawMessage: string): string {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'Unknown playback error';
  }

  let sanitized = rawMessage;

  // 1. Scrub full URLs or query strings that contain tokens, keys, signatures, or credentials
  sanitized = sanitized.replace(/(https?:\/\/[^\s"'`<>?#]+)(\?[^\s"'`<>#]*)?/gi, '$1');

  // 2. Strip sensitive header / credential patterns
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9\-_.~+/]+=*/gi, 'Bearer [REDACTED]');
  sanitized = sanitized.replace(/(token|secret|key|sig|signature|credential|auth|password)=[^&\s]+/gi, '$1=[REDACTED]');
  sanitized = sanitized.replace(/Authorization:\s*[^\n\r]+/gi, 'Authorization: [REDACTED]');

  // 3. Remove native stack trace frames (e.g. "at Object.load (http://...)")
  if (sanitized.includes('\n')) {
    const lines = sanitized.split('\n').filter(line => !line.trim().startsWith('at '));
    sanitized = lines[0] || 'Unknown playback error';
  }

  // 4. Truncate long messages to prevent oversized payloads
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + '...';
  }

  return sanitized.trim() || 'Unknown playback error';
}

/**
 * Normalizes any player error (W3C MediaError, Shaka Error, Vega native error,
 * Network error, or generic Error) into a controlled analytics model.
 * Does NOT mutate the input error.
 */
export function normalizePlaybackError(
  error: unknown,
  fallbackFatal: boolean = true,
): NormalizedPlaybackError {
  if (!error) {
    return {
      category: 'UNKNOWN',
      code: 'UNKNOWN_ERROR',
      message: 'Unknown playback error',
      errorCategory: 'UNKNOWN',
      errorCode: 'UNKNOWN_ERROR',
      errorMessage: 'Unknown playback error',
      isFatal: fallbackFatal,
    };
  }

  let rawCode: string | number = '';
  let rawMessage = '';
  let explicitCategory: PlaybackErrorCategory | null = null;
  let isFatal = fallbackFatal;

  if (typeof error === 'string') {
    rawMessage = error;
  } else if (typeof error === 'object') {
    const errObj = error as Record<string, unknown>;
    // Unwrap nested error property if present (e.g. event.error or target.error)
    const innerError = (
      errObj.error ||
      (errObj.target as Record<string, unknown> | undefined)?.error ||
      errObj
    ) as Record<string, unknown>;

    if (innerError.code !== undefined && innerError.code !== null) {
      rawCode = innerError.code as string | number;
    }
    if (typeof innerError.message === 'string') {
      rawMessage = innerError.message;
    } else if (typeof errObj.message === 'string') {
      rawMessage = errObj.message;
    }

    // Shaka severity: 1 = RECOVERABLE, 2 = CRITICAL
    if (typeof innerError.severity === 'number') {
      isFatal = innerError.severity === 2;
    }

    // Shaka category numbers:
    // 1: NETWORK, 2: TEXT, 3: MEDIA, 4: MANIFEST, 5: STREAMING, 6: DRM, 7: PLAYER, 8: CAST, 9: STORAGE
    if (typeof innerError.category === 'number') {
      switch (innerError.category) {
        case 1:
          explicitCategory = 'NETWORK';
          break;
        case 2:
        case 3:
          explicitCategory = 'MEDIA';
          break;
        case 4:
          explicitCategory = 'MANIFEST';
          break;
        case 5:
          explicitCategory = 'NETWORK';
          break;
        case 6:
          explicitCategory = 'DRM';
          break;
        case 7:
        case 8:
        case 9:
          explicitCategory = 'PLAYER';
          break;
        default:
          break;
      }
    } else if (typeof innerError.category === 'string') {
      const catUpper = innerError.category.toUpperCase();
      if (
        [
          'NETWORK',
          'SOURCE',
          'CODEC',
          'DRM',
          'MANIFEST',
          'MEDIA',
          'PLAYER',
          'UNKNOWN',
        ].includes(catUpper)
      ) {
        explicitCategory = catUpper as PlaybackErrorCategory;
      }
    }
  }

  // W3C MediaError standard numerical codes:
  // 1: MEDIA_ERR_ABORTED -> PLAYER
  // 2: MEDIA_ERR_NETWORK -> NETWORK
  // 3: MEDIA_ERR_DECODE -> CODEC
  // 4: MEDIA_ERR_SRC_NOT_SUPPORTED -> SOURCE
  if (typeof rawCode === 'number') {
    if (rawCode === 1) {
      explicitCategory = explicitCategory || 'PLAYER';
      if (!rawMessage) {
        rawMessage = 'Media playback aborted';
      }
    } else if (rawCode === 2) {
      explicitCategory = explicitCategory || 'NETWORK';
      if (!rawMessage) {
        rawMessage = 'Network error fetching media';
      }
    } else if (rawCode === 3) {
      explicitCategory = explicitCategory || 'CODEC';
      if (!rawMessage) {
        rawMessage = 'Media decoding error';
      }
    } else if (rawCode === 4) {
      explicitCategory = explicitCategory || 'SOURCE';
      if (!rawMessage) {
        rawMessage = 'Media source not supported';
      }
    } else if (rawCode >= 1000 && rawCode < 2000) {
      // Shaka network error codes (1000-1999)
      explicitCategory = explicitCategory || 'NETWORK';
    } else if (rawCode >= 3000 && rawCode < 4000) {
      // Shaka media error codes (3000-3999)
      explicitCategory = explicitCategory || 'MEDIA';
    } else if (rawCode >= 4000 && rawCode < 5000) {
      // Shaka manifest error codes (4000-4999)
      explicitCategory = explicitCategory || 'MANIFEST';
    } else if (rawCode >= 6000 && rawCode < 7000) {
      // Shaka DRM error codes (6000-6999)
      explicitCategory = explicitCategory || 'DRM';
    } else if (rawCode >= 7000 && rawCode < 8000) {
      // Shaka player error codes (7000-7999)
      explicitCategory = explicitCategory || 'PLAYER';
    }
  }

  const text = `${rawCode} ${rawMessage}`.toLowerCase();

  let category: PlaybackErrorCategory;

  // Keyword categorization priority
  if (
    text.includes('drm') ||
    text.includes('widevine') ||
    text.includes('license') ||
    text.includes('key-system') ||
    text.includes('keysystem') ||
    text.includes('encrypted') ||
    text.includes('eme') ||
    text.includes('fairplay') ||
    text.includes('clearkey')
  ) {
    category = 'DRM';
  } else if (
    text.includes('manifest') ||
    text.includes('mpd') ||
    text.includes('m3u8') ||
    text.includes('playlist')
  ) {
    category = 'MANIFEST';
  } else if (
    text.includes('codec') ||
    text.includes('decode') ||
    text.includes('demux') ||
    text.includes('decoding')
  ) {
    category = 'CODEC';
  } else if (
    text.includes('network') ||
    text.includes('timeout') ||
    text.includes('offline') ||
    text.includes('connection') ||
    text.includes('http') ||
    text.includes('cors') ||
    text.includes('dns') ||
    text.includes('status 404') ||
    text.includes('status 500') ||
    text.includes('status 502') ||
    text.includes('status 503')
  ) {
    category = 'NETWORK';
  } else if (
    text.includes('source') ||
    text.includes('src') ||
    text.includes('unsupported media') ||
    text.includes('format not supported') ||
    text.includes('src_not_supported') ||
    text.includes('not suitable')
  ) {
    category = 'SOURCE';
  } else if (
    text.includes('media') ||
    text.includes('buffer') ||
    text.includes('pipeline') ||
    text.includes('stream')
  ) {
    category = 'MEDIA';
  } else if (
    text.includes('player') ||
    text.includes('abort') ||
    text.includes('initialize') ||
    text.includes('surface')
  ) {
    category = 'PLAYER';
  } else if (explicitCategory) {
    category = explicitCategory;
  } else {
    category = 'UNKNOWN';
  }

  const code =
    rawCode !== '' && rawCode !== undefined && rawCode !== null
      ? String(rawCode)
      : `${category}_ERROR`;

  const message = sanitizeErrorMessage(rawMessage || `${category} playback error`);

  return {
    category,
    code,
    message,
    errorCategory: category,
    errorCode: code,
    errorMessage: message,
    isFatal,
  };
}
