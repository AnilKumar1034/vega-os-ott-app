/**
 * Normalizes and sanitizes email input from TV soft keyboards, voice dictation,
 * and host IMEs where symbols like '@' and '.' are translated into words like
 * "At", "at", "period", "dot".
 */
export const sanitizeEmailInput = (input: string): string => {
  if (!input) {
    return '';
  }

  let sanitized = input;

  // Replace spoken/typed TV IME words for '@'
  // Match "At", "at", "AT"
  sanitized = sanitized.replace(/\b(at|At|AT)\b/g, '@');
  // Match attached "At" e.g. "johnAtgmail" or "userAt"
  sanitized = sanitized.replace(
    /([a-zA-Z0-9_\-+]+)(At|at|AT)([a-zA-Z0-9_\-+]+)/g,
    '$1@$3',
  );

  // Replace spoken/typed TV IME words for '.'
  // Match "period", "Period", "PERIOD", "dot", "Dot", "DOT"
  sanitized = sanitized.replace(/\b(period|Period|PERIOD|dot|Dot|DOT)\b/g, '.');
  // Match attached "period" or "dot" e.g. "gmailperiodcom" or "gmaildotcom"
  sanitized = sanitized.replace(
    /([a-zA-Z0-9_\-+@]+)(period|Period|PERIOD|dot|Dot|DOT)([a-zA-Z0-9_\-+]+)/g,
    '$1.$3',
  );

  // Replace spoken/typed words for '_' and '-'
  sanitized = sanitized.replace(/\b(underscore|Underscore)\b/gi, '_');
  sanitized = sanitized.replace(/\b(dash|Dash|hyphen|Hyphen)\b/gi, '-');

  // Remove any whitespace spaces inside email address
  sanitized = sanitized.replace(/\s+/g, '');

  return sanitized;
};

/**
 * Determines whether a TV hardware event corresponds to a Select/OK/Enter action.
 * Handles standard TV remote 'select', keyboard 'enter', virtual remote 'kpenter', 'ok', etc.
 */
export const isSelectEvent = (eventType?: string): boolean => {
  if (!eventType) return false;
  const type = eventType.toLowerCase();
  return (
    type === 'select' ||
    type === 'enter' ||
    type === 'kpenter' ||
    type === 'key_kpenter' ||
    type === 'ok' ||
    type === 'dpad_center'
  );
};

/**
 * Checks whether an eventKeyAction corresponds to key down (pressed).
 * On TV/Kepler, 0 represents key pressed down. Undefined is also treated as down.
 */
export const isKeyDown = (eventKeyAction?: number): boolean => {
  return eventKeyAction === undefined || eventKeyAction === 0;
};

/**
 * Determines whether a TV hardware event corresponds to a Back/Escape action.
 */
export const isBackEvent = (eventType?: string): boolean => {
  if (!eventType) return false;
  const type = eventType.toLowerCase();
  return type === 'back' || type === 'escape';
};

/**
 * Determines whether a TV hardware event corresponds to a Play/Pause action.
 */
export const isPlayPauseEvent = (eventType?: string): boolean => {
  if (!eventType) return false;
  const type = eventType.toLowerCase();
  return type === 'playpause' || type === 'play' || type === 'pause';
};

/**
 * Determines whether a TV hardware event corresponds to a Stop action.
 */
export const isStopEvent = (eventType?: string): boolean => {
  if (!eventType) return false;
  const type = eventType.toLowerCase();
  return type === 'stop';
};

