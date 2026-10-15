/**
 * Centralized definition of Analytics event names.
 * Day 1 roadmap defines only foundational lifecycle and navigation events.
 */
export const AnalyticsEvent = {
  APP_OPEN: 'app_open',
  SCREEN_VIEW: 'screen_view',
  PROFILE_SELECTED: 'profile_selected',
  PROFILE_CREATED: 'profile_created',
  PROFILE_SWITCHED: 'profile_switched',
  PROFILE_DELETED: 'profile_deleted',
  PROFILE_EDIT_COMPLETED: 'profile_edit_completed',
  PLAYBACK_START_REQUESTED: 'playback_start_requested',
  PLAYER_READY: 'player_ready',
  PLAYBACK_STARTED: 'playback_started',
  FIRST_FRAME: 'first_frame',
  BUFFER_STARTED: 'buffer_started',
  BUFFER_ENDED: 'buffer_ended',
  PLAYBACK_PAUSED: 'playback_paused',
  PAUSED: 'playback_paused',
  PLAYBACK_RESUMED: 'playback_resumed',
  RESUMED: 'playback_resumed',
  COMPLETED: 'completed',
  PLAYBACK_STOPPED: 'playback_stopped',
  STOPPED: 'playback_stopped',
  PLAYBACK_ERROR: 'playback_error',
  ERROR: 'playback_error',
  SEEK_STARTED: 'seek_started',
  SEEK_COMPLETED: 'seek_completed',
  AUDIO_TRACK_CHANGED: 'audio_track_changed',
  SUBTITLE_TRACK_CHANGED: 'subtitle_track_changed',
  QUALITY_SELECTED: 'quality_selected',
  BITRATE_CHANGED: 'bitrate_changed',
  RESOLUTION_CHANGED: 'resolution_changed',
  LIVE_CHANNEL_SELECTED: 'live_channel_selected',
  LIVE_CHANNEL_CHANGED: 'live_channel_changed',
  EPG_PROGRAM_SELECTED: 'epg_program_selected',
  GO_LIVE: 'go_live',
  LIVE_PLAYBACK_STARTED: 'live_playback_started',
  CONTINUE_WATCHING_SELECTED: 'continue_watching_selected',
  RESUME_PLAYBACK: 'resume_playback',
  PLAYBACK_PROGRESS_SAVED: 'playback_progress_saved',
  CONTENT_COMPLETED: 'completed',
  DEEPLINK_RECEIVED: 'deeplink_received',
  DEEPLINK_RESOLVED: 'deeplink_resolved',
  DEEPLINK_FAILED: 'deeplink_failed',
  DEEPLINK_CONTENT_OPENED: 'deeplink_content_opened',
  WATCHLIST_ADDED: 'watchlist_added',
  WATCHLIST_REMOVED: 'watchlist_removed',
  WATCHLIST_ITEM_SELECTED: 'watchlist_item_selected',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];

export const AnalyticsEvents = AnalyticsEvent;


