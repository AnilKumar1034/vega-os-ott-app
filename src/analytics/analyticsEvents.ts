/**
 * Centralized definition of Analytics event names.
 * Day 1 roadmap defines only foundational lifecycle and navigation events.
 */
export const AnalyticsEvent = {
  APP_OPEN: 'app_open',
  SCREEN_VIEW: 'screen_view',
  PROFILE_SELECTED: 'profile_selected',
  PLAYBACK_START_REQUESTED: 'playback_start_requested',
  PLAYER_READY: 'player_ready',
  PLAYBACK_STARTED: 'playback_started',
  FIRST_FRAME: 'first_frame',
  BUFFER_STARTED: 'buffer_started',
  BUFFER_ENDED: 'buffer_ended',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  COMPLETED: 'completed',
  STOPPED: 'stopped',
  SEEK_STARTED: 'seek_started',
  SEEK_COMPLETED: 'seek_completed',
  AUDIO_TRACK_CHANGED: 'audio_track_changed',
  SUBTITLE_TRACK_CHANGED: 'subtitle_track_changed',
  QUALITY_SELECTED: 'quality_selected',
  BITRATE_CHANGED: 'bitrate_changed',
  RESOLUTION_CHANGED: 'resolution_changed',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];


