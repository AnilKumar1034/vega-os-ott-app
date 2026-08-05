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
