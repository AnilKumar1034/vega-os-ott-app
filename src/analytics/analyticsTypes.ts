import {AnalyticsEventName} from './analyticsEvents';

/**
 * Strongly-typed, privacy-safe analytics context.
 * Strictly excludes any PII (email, phone, password, auth tokens, ID tokens,
 * access/refresh tokens, credentials, payment data).
 */
export interface AnalyticsContext {
  userId?: string;
  profileId?: string;
  profileType?: 'adult' | 'kids';
  deviceType?: string;
  platform?: string;
  appVersion?: string;
}

export interface AnalyticsUserContext {
  userId?: string;
}

export interface AnalyticsProfileContext {
  profileId: string;
  profileType: 'adult' | 'kids';
}

export interface AppOpenEventParams {
  [key: string]: unknown;
}

export type NavigationSource =
  | 'user_action'
  | 'deep_link'
  | 'auth_redirect'
  | 'initial_launch'
  | 'startup'
  | 'system';

export interface ScreenViewEventParams {
  screen_name: string;
  screenName?: string;
  screen_class?: string;
  screenClass?: string;
  previous_screen?: string | null;
  previousScreen?: string | null;
  navigation_source?: NavigationSource | string;
  navigationSource?: NavigationSource | string;
  [key: string]: unknown;
}

export interface ProfileSelectedEventParams {
  profileId?: string;
  profile_id?: string;
  profileType?: 'adult' | 'kids';
  profile_type?: 'adult' | 'kids';
  is_kids_profile?: boolean;
  isKidsProfile?: boolean;
  selection_source?: string;
  selectionSource?: string;
  [key: string]: unknown;
}

export interface ProfileCreatedEventParams {
  profile_type: 'adult' | 'kids';
  profileType?: 'adult' | 'kids';
  is_kids_profile: boolean;
  isKidsProfile?: boolean;
  creation_source?: string;
  creationSource?: string;
  [key: string]: unknown;
}

export interface ProfileSwitchedEventParams {
  previous_profile_type: 'adult' | 'kids';
  previousProfileType?: 'adult' | 'kids';
  new_profile_type: 'adult' | 'kids';
  newProfileType?: 'adult' | 'kids';
  switch_source?: string;
  switchSource?: string;
  [key: string]: unknown;
}

export interface ProfileDeletedEventParams {
  deleted_profile_type: 'adult' | 'kids';
  deletedProfileType?: 'adult' | 'kids';
  was_active_profile: boolean;
  wasActiveProfile?: boolean;
  [key: string]: unknown;
}

export interface ProfileEditCompletedEventParams {
  profile_type: 'adult' | 'kids';
  profileType?: 'adult' | 'kids';
  is_kids_profile: boolean;
  isKidsProfile?: boolean;
  [key: string]: unknown;
}

export interface PlaybackBaseParams {
  playbackSessionId: string;
  playback_session_id?: string;
  contentId: string;
  content_id?: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  playbackType?: string;
  streamType?: string;
  isLive?: boolean;
  is_live?: boolean;
  channelId?: string;
  channel_id?: string;
  channelName?: string;
  channel_name?: string;
  profileId?: string;
  profileType?: 'adult' | 'kids';
  [key: string]: unknown;
}

export interface PlaybackStartRequestedParams extends PlaybackBaseParams {
  startPosition?: number;
}

export interface PlayerReadyParams extends PlaybackBaseParams {}

export interface PlaybackStartedParams extends PlaybackBaseParams {
  startPosition?: number;
  duration?: number;
}

export interface FirstFrameParams extends PlaybackBaseParams {
  timeToFirstFrameMs: number;
  startup_time_ms?: number;
  startupTimeMs?: number;
  position?: number;
}

export interface BufferStartedParams extends PlaybackBaseParams {
  bufferCount: number;
  buffer_count?: number;
}

export interface BufferEndedParams extends PlaybackBaseParams {
  bufferDurationMs: number;
  buffer_duration_ms?: number;
  bufferCount?: number;
  buffer_count?: number;
}

export interface PlaybackBufferMetrics {
  bufferCount: number;
  totalBufferDurationMs: number;
  currentBufferStartTimestamp?: number;
}

import {PlaybackErrorCategory} from './errorNormalization';

export type PlaybackStopReason =
  | 'user_exit'
  | 'navigation'
  | 'content_changed'
  | 'player_destroyed'
  | 'unknown';

export interface PlaybackPausedParams extends PlaybackBaseParams {
  position: number;
}

export interface PlaybackResumedParams extends PlaybackBaseParams {
  position: number;
  pauseDurationMs?: number;
  pause_duration_ms?: number;
}

export interface PlaybackCompletedParams extends PlaybackBaseParams {
  duration: number;
  totalPlayTimeMs?: number;
  total_play_time_ms?: number;
}

export interface PlaybackStoppedParams extends PlaybackBaseParams {
  position: number;
  duration?: number;
  totalPlayTimeMs?: number;
  total_play_time_ms?: number;
  stopReason?: PlaybackStopReason;
  stop_reason?: string;
  reason?:
    | 'user_exit'
    | 'back_navigation'
    | 'episode_switch'
    | 'app_backgrounded'
    | 'error'
    | PlaybackStopReason;
}

export interface PlaybackErrorParams extends PlaybackBaseParams {
  errorCategory: PlaybackErrorCategory;
  error_category?: string;
  errorCode: string;
  error_code?: string;
  errorMessage: string;
  error_message?: string;
  isFatal?: boolean;
  is_fatal?: boolean;
  position?: number;
}

export interface SeekStartedParams extends PlaybackBaseParams {
  seekStartPosition: number;
  seek_start_position?: number;
  seekTargetPosition: number;
  seek_target_position?: number;
}

export interface SeekCompletedParams extends PlaybackBaseParams {
  seekStartPosition: number;
  seek_start_position?: number;
  seekTargetPosition: number;
  seek_target_position?: number;
  seekDurationMs: number;
  seek_duration_ms?: number;
}

export interface AudioTrackChangedParams extends PlaybackBaseParams {
  fromAudioTrackId?: string;
  toAudioTrackId: string;
  fromLanguage?: string;
  toLanguage: string;
  fromFormat?: string;
  toFormat?: string;
}

export interface SubtitleTrackChangedParams extends PlaybackBaseParams {
  fromSubtitleTrackId?: string;
  toSubtitleTrackId: string;
  fromLanguage?: string;
  toLanguage?: string;
  isOff: boolean;
}

export interface QualitySelectedParams extends PlaybackBaseParams {
  qualityId: string;
  qualityMode: 'auto' | 'manual';
  targetResolution?: string;
  targetBitrate?: string;
}

export interface BitrateChangedParams extends PlaybackBaseParams {
  fromBitrate?: number | string;
  toBitrate: number | string;
  bitrateMbps?: string;
}

export interface ResolutionChangedParams extends PlaybackBaseParams {
  fromWidth?: number;
  fromHeight?: number;
  toWidth: number;
  toHeight: number;
  resolutionBadge?: string;
}

export interface LiveChannelSelectedParams {
  channel_id: string;
  channelId?: string;
  channel_name?: string;
  channelName?: string;
  playback_session_id?: string;
  playbackSessionId?: string;
  selection_source?: 'channel_list' | 'epg' | 'unknown' | string;
  selectionSource?: 'channel_list' | 'epg' | 'unknown' | string;
  [key: string]: unknown;
}

export interface LiveChannelChangedParams {
  previous_channel_id: string;
  previousChannelId?: string;
  channel_id: string;
  channelId?: string;
  playback_session_id?: string;
  playbackSessionId?: string;
  change_source?: 'channel_list' | 'epg' | 'unknown' | string;
  changeSource?: 'channel_list' | 'epg' | 'unknown' | string;
  [key: string]: unknown;
}

export interface EPGProgramSelectedParams {
  program_id?: string;
  programId?: string;
  channel_id: string;
  channelId?: string;
  program_start_time?: string | number;
  programStartTime?: string | number;
  program_end_time?: string | number;
  programEndTime?: string | number;
  selection_source?: 'epg' | string;
  selectionSource?: 'epg' | string;
  [key: string]: unknown;
}

export interface GoLiveParams {
  channel_id: string;
  channelId?: string;
  playback_session_id?: string;
  playbackSessionId?: string;
  [key: string]: unknown;
}

export interface LivePlaybackStartedParams {
  channel_id: string;
  channelId?: string;
  playback_session_id: string;
  playbackSessionId?: string;
  time_to_first_frame_ms?: number;
  timeToFirstFrameMs?: number;
  [key: string]: unknown;
}

export interface ContinueWatchingSelectedParams {
  content_id: string;
  contentId?: string;
  content_type?: string;
  contentType?: string;
  playback_session_id?: string;
  playbackSessionId?: string;
  saved_position_seconds?: number;
  savedPositionSeconds?: number;
  selection_source: 'continue_watching';
  selectionSource?: 'continue_watching';
  [key: string]: unknown;
}

export interface ResumePlaybackParams {
  content_id: string;
  contentId?: string;
  content_type?: string;
  contentType?: string;
  playback_session_id: string;
  playbackSessionId?: string;
  resume_position_seconds: number;
  resumePositionSeconds?: number;
  resume_source?: 'continue_watching' | 'details' | 'deeplink' | string;
  resumeSource?: 'continue_watching' | 'details' | 'deeplink' | string;
  [key: string]: unknown;
}

export interface PlaybackProgressSavedParams {
  content_id: string;
  contentId?: string;
  content_type?: string;
  contentType?: string;
  playback_session_id: string;
  playbackSessionId?: string;
  position_seconds: number;
  positionSeconds?: number;
  [key: string]: unknown;
}

export type DeeplinkType =
  | 'content'
  | 'search'
  | 'playback'
  | 'navigation'
  | 'settings'
  | 'profile'
  | 'auth'
  | 'unknown';

export type DeeplinkSource =
  | 'cold_start'
  | 'warm_start'
  | 'in_app'
  | 'external';

export type DeeplinkAppState =
  | 'active'
  | 'background'
  | 'inactive'
  | 'cold_start';

export type DeeplinkDestinationType =
  | 'details'
  | 'player'
  | 'search'
  | 'home'
  | 'movies'
  | 'live_tv'
  | 'my_list'
  | 'settings'
  | 'profile'
  | 'profiles'
  | 'login'
  | 'register'
  | 'unknown';

export type DeeplinkFailureStage =
  | 'parsing'
  | 'validation'
  | 'content_lookup'
  | 'navigation_preparation';

export type DeeplinkFailureReason =
  | 'invalid_url'
  | 'malformed_url'
  | 'unsupported_scheme'
  | 'unsupported_route'
  | 'missing_content_id'
  | 'missing_parameters'
  | 'content_not_found'
  | 'navigation_failed'
  | 'cancelled';

export interface DeeplinkReceivedParams {
  link_type?: DeeplinkType | string;
  linkType?: DeeplinkType | string;
  link_source?: DeeplinkSource | string;
  linkSource?: DeeplinkSource | string;
  app_state?: DeeplinkAppState | string;
  appState?: DeeplinkAppState | string;
  [key: string]: unknown;
}

export interface DeeplinkResolvedParams {
  destination_type: DeeplinkDestinationType | string;
  destinationType?: DeeplinkDestinationType | string;
  content_type?: 'movie' | 'episode' | 'live' | string;
  contentType?: 'movie' | 'episode' | 'live' | string;
  resolution_source?: string;
  resolutionSource?: string;
  [key: string]: unknown;
}

export interface DeeplinkFailedParams {
  failure_stage: DeeplinkFailureStage | string;
  failureStage?: DeeplinkFailureStage | string;
  failure_reason: DeeplinkFailureReason | string;
  failureReason?: DeeplinkFailureReason | string;
  link_type?: DeeplinkType | string;
  linkType?: DeeplinkType | string;
  [key: string]: unknown;
}

export interface DeeplinkContentOpenedParams {
  destination_type: DeeplinkDestinationType | string;
  destinationType?: DeeplinkDestinationType | string;
  content_type?: 'movie' | 'episode' | 'live' | string;
  contentType?: 'movie' | 'episode' | 'live' | string;
  open_source: 'deeplink';
  openSource?: 'deeplink';
  [key: string]: unknown;
}

export interface WatchlistAddedParams {
  content_type?: string;
  contentType?: string;
  action_source?: string;
  actionSource?: string;
  list_type?: string;
  listType?: string;
  content_id?: string;
  contentId?: string;
  profile_id?: string;
  profileId?: string;
  [key: string]: unknown;
}

export interface WatchlistRemovedParams {
  content_type?: string;
  contentType?: string;
  action_source?: string;
  actionSource?: string;
  list_type?: string;
  listType?: string;
  content_id?: string;
  contentId?: string;
  profile_id?: string;
  profileId?: string;
  [key: string]: unknown;
}

export interface WatchlistItemSelectedParams {
  content_type?: string;
  contentType?: string;
  destination_type: 'details' | 'player' | string;
  destinationType?: 'details' | 'player' | string;
  selection_source: 'watchlist' | string;
  selectionSource?: 'watchlist' | string;
  content_id?: string;
  contentId?: string;
  profile_id?: string;
  profileId?: string;
  [key: string]: unknown;
}

export interface AnalyticsEventParamsMap {
  app_open: AppOpenEventParams;
  screen_view: ScreenViewEventParams;
  profile_selected: ProfileSelectedEventParams;
  profile_created: ProfileCreatedEventParams;
  profile_switched: ProfileSwitchedEventParams;
  profile_deleted: ProfileDeletedEventParams;
  profile_edit_completed: ProfileEditCompletedEventParams;
  playback_start_requested: PlaybackStartRequestedParams;
  player_ready: PlayerReadyParams;
  playback_started: PlaybackStartedParams;
  first_frame: FirstFrameParams;
  buffer_started: BufferStartedParams;
  buffer_ended: BufferEndedParams;
  playback_paused: PlaybackPausedParams;
  paused: PlaybackPausedParams;
  playback_resumed: PlaybackResumedParams;
  resumed: PlaybackResumedParams;
  completed: PlaybackCompletedParams;
  playback_stopped: PlaybackStoppedParams;
  stopped: PlaybackStoppedParams;
  playback_error: PlaybackErrorParams;
  seek_started: SeekStartedParams;
  seek_completed: SeekCompletedParams;
  audio_track_changed: AudioTrackChangedParams;
  subtitle_track_changed: SubtitleTrackChangedParams;
  quality_selected: QualitySelectedParams;
  bitrate_changed: BitrateChangedParams;
  resolution_changed: ResolutionChangedParams;
  live_channel_selected: LiveChannelSelectedParams;
  live_channel_changed: LiveChannelChangedParams;
  epg_program_selected: EPGProgramSelectedParams;
  go_live: GoLiveParams;
  live_playback_started: LivePlaybackStartedParams;
  continue_watching_selected: ContinueWatchingSelectedParams;
  resume_playback: ResumePlaybackParams;
  playback_progress_saved: PlaybackProgressSavedParams;
  deeplink_received: DeeplinkReceivedParams;
  deeplink_resolved: DeeplinkResolvedParams;
  deeplink_failed: DeeplinkFailedParams;
  deeplink_content_opened: DeeplinkContentOpenedParams;
  watchlist_added: WatchlistAddedParams;
  watchlist_removed: WatchlistRemovedParams;
  watchlist_item_selected: WatchlistItemSelectedParams;
}

export type AnalyticsEventParams<T extends AnalyticsEventName = AnalyticsEventName> =
  T extends keyof AnalyticsEventParamsMap
    ? AnalyticsEventParamsMap[T]
    : Record<string, unknown>;

export interface AnalyticsServiceOptions {
  trackAppOpenOnInitialLaunch?: boolean;
  measurementProtocolSecret?: string;
}

export interface IAnalyticsService {
  initialize(options?: AnalyticsServiceOptions): Promise<void>;
  isInitialized(): boolean;
  isFirebaseSupported(): boolean;
  setUser(userContext: AnalyticsUserContext | null): void;
  setProfile(profileContext: AnalyticsProfileContext | null): void;
  setContext(context: Partial<AnalyticsContext>): void;
  getContext(): AnalyticsContext;
  getOrCreateAppInstanceId(): Promise<string>;
  setMeasurementProtocolSecret(secret: string): void;
  getMeasurementProtocolSecret(): string;
  track<T extends AnalyticsEventName>(
    eventName: T,
    params?: AnalyticsEventParams<T>,
  ): Promise<void>;
  trackScreen(
    screenName: string,
    extraParams?: Record<string, unknown>,
  ): Promise<void>;
  trackScreenView(params: ScreenViewEventParams): Promise<void>;
  getCurrentScreen(): string | null;
  getPreviousScreen(): string | null;
  resetScreenTracking(): void;
  trackAppOpen(params?: AppOpenEventParams): Promise<void>;
  trackProfileCreated(params: ProfileCreatedEventParams): Promise<void>;
  trackProfileSelected(params: ProfileSelectedEventParams): Promise<void>;
  trackProfileSwitched(params: ProfileSwitchedEventParams): Promise<void>;
  trackProfileDeleted(params: ProfileDeletedEventParams): Promise<void>;
  trackProfileEditCompleted(
    params: ProfileEditCompletedEventParams,
  ): Promise<void>;
  trackPlaybackStartRequested(
    params: PlaybackStartRequestedParams,
  ): Promise<void>;
  trackPlayerReady(params: PlayerReadyParams): Promise<void>;
  trackPlaybackStarted(params: PlaybackStartedParams): Promise<void>;
  trackFirstFrame(params: FirstFrameParams): Promise<void>;
  trackBufferStarted(params: BufferStartedParams): Promise<void>;
  trackBufferEnded(params: BufferEndedParams): Promise<void>;
  trackPlaybackPaused(params: PlaybackPausedParams): Promise<void>;
  trackPlaybackResumed(params: PlaybackResumedParams): Promise<void>;
  trackPlaybackCompleted(params: PlaybackCompletedParams): Promise<void>;
  trackPlaybackStopped(params: PlaybackStoppedParams): Promise<void>;
  trackPlaybackError(params: PlaybackErrorParams): Promise<void>;
  trackSeekStarted(params: SeekStartedParams): Promise<void>;
  trackSeekCompleted(params: SeekCompletedParams): Promise<void>;
  trackAudioTrackChanged(params: AudioTrackChangedParams): Promise<void>;
  trackSubtitleTrackChanged(params: SubtitleTrackChangedParams): Promise<void>;
  trackQualitySelected(params: QualitySelectedParams): Promise<void>;
  trackBitrateChanged(params: BitrateChangedParams): Promise<void>;
  trackResolutionChanged(params: ResolutionChangedParams): Promise<void>;
  trackLiveChannelSelected(params: LiveChannelSelectedParams): Promise<void>;
  trackLiveChannelChanged(params: LiveChannelChangedParams): Promise<void>;
  trackEpgProgramSelected(params: EPGProgramSelectedParams): Promise<void>;
  trackGoLive(params: GoLiveParams): Promise<void>;
  trackLivePlaybackStarted(params: LivePlaybackStartedParams): Promise<void>;
  trackContinueWatchingSelected(
    params: ContinueWatchingSelectedParams,
  ): Promise<void>;
  trackResumePlayback(params: ResumePlaybackParams): Promise<void>;
  trackPlaybackProgressSaved(
    params: PlaybackProgressSavedParams,
  ): Promise<void>;
  trackDeeplinkReceived(params?: DeeplinkReceivedParams): Promise<void>;
  trackDeeplinkResolved(params: DeeplinkResolvedParams): Promise<void>;
  trackDeeplinkFailed(params: DeeplinkFailedParams): Promise<void>;
  trackDeeplinkContentOpened(params: DeeplinkContentOpenedParams): Promise<void>;
  trackWatchlistAdded(params: WatchlistAddedParams): Promise<void>;
  trackWatchlistRemoved(params: WatchlistRemovedParams): Promise<void>;
  trackWatchlistItemSelected(params: WatchlistItemSelectedParams): Promise<void>;
  syncWatchlistState(profileId: string, contentIds: string[]): void;
  reset(): void;
}
