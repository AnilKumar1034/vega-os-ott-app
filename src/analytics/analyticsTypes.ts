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

export interface ScreenViewEventParams {
  screen_name: string;
  screen_class?: string;
  [key: string]: unknown;
}

export interface ProfileSelectedEventParams {
  profileId: string;
  profileType: 'adult' | 'kids';
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

export interface AnalyticsEventParamsMap {
  app_open: AppOpenEventParams;
  screen_view: ScreenViewEventParams;
  profile_selected: ProfileSelectedEventParams;
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
  trackAppOpen(params?: AppOpenEventParams): Promise<void>;
  trackProfileSelected(params: ProfileSelectedEventParams): Promise<void>;
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
  reset(): void;
}
