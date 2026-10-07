/**
 * Centralized definition of Analytics event names.
 * Day 1 roadmap defines only foundational lifecycle and navigation events.
 */
export const AnalyticsEvent = {
  APP_OPEN: 'app_open',
  SCREEN_VIEW: 'screen_view',
  PROFILE_SELECTED: 'profile_selected',
  PLAYBACK_STARTED: 'playback_started',
  FIRST_FRAME: 'first_frame',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

