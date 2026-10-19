import {AnalyticsService, analyticsService} from './analyticsService';
import {
  AudioTrackChangedParams,
  BitrateChangedParams,
  BufferEndedParams,
  BufferStartedParams,
  EPGProgramSelectedParams,
  FirstFrameParams,
  GoLiveParams,
  LiveChannelChangedParams,
  LiveChannelSelectedParams,
  LivePlaybackStartedParams,
  PlaybackBaseParams,
  PlaybackBufferMetrics,
  PlaybackCompletedParams,
  PlaybackErrorParams,
  PlaybackPausedParams,
  PlaybackResumedParams,
  PlaybackStartRequestedParams,
  PlaybackStartedParams,
  PlaybackStopReason,
  PlaybackStoppedParams,
  PlayerReadyParams,
  QualitySelectedParams,
  ResolutionChangedParams,
  SeekCompletedParams,
  SeekStartedParams,
  SubtitleTrackChangedParams,
  ResumePlaybackParams,
  PlaybackProgressSavedParams,
} from './analyticsTypes';
import {
  normalizePlaybackError,
  PlaybackErrorCategory,
} from './errorNormalization';

/**
 * Generates a unique, URL-safe playback session ID.
 */
export function generatePlaybackSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `ps_${timestamp}_${randomPart}`;
}

export type PlaybackSessionState =
  | 'idle'
  | 'start_requested'
  | 'ready'
  | 'started'
  | 'playing'
  | 'buffering'
  | 'paused'
  | 'completed'
  | 'stopped'
  | 'error';

export interface StartPlaybackSessionOptions {
  contentId: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  seriesId?: string;
  episodeId?: string;
  sourceScreen?: string;
  playbackType?: string;
  streamType?: string;
  isLive?: boolean;
  channelId?: string;
  channelName?: string;
  previousChannelId?: string;
  selectionSource?: 'channel_list' | 'epg' | 'unknown' | string;
  changeSource?: 'channel_list' | 'epg' | 'unknown' | string;
  startPosition?: number;
  duration?: number;
  profileId?: string;
  profileType?: 'adult' | 'kids';
  deferPlaybackStarted?: boolean;
}

export interface ActivePlaybackSession {
  playbackSessionId: string;
  contentId: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  seriesId?: string;
  episodeId?: string;
  sourceScreen?: string;
  playbackType?: string;
  streamType?: string;
  isLive?: boolean;
  channelId?: string;
  channelName?: string;
  previousChannelId?: string;
  selectionSource?: 'channel_list' | 'epg' | 'unknown' | string;
  changeSource?: 'channel_list' | 'epg' | 'unknown' | string;
  hasChannelChangedEmitted?: boolean;
  profileId?: string;
  profileType?: 'adult' | 'kids';
  startPosition: number;
  duration: number;
  sessionStartTime: number;
  startRequestedTime: number;
  playerReadyTime?: number;
  playbackStartedTime?: number;
  firstFrameTime?: number;
  hasStartRequested: boolean;
  hasPlayerReady: boolean;
  hasPlaybackStarted: boolean;
  hasFirstFrame: boolean;
  hasPlaybackError: boolean;
  lastError?: PlaybackErrorParams;
  state: PlaybackSessionState;
  pauseStartTime?: number;
  totalPlayTimeMs: number;
  lastPlayStartTime?: number;
  // Buffer metrics (Day 3)
  bufferMetrics: PlaybackBufferMetrics;
  isCurrentlyBuffering: boolean;
  // Seek metrics (Day 4)
  isSeeking: boolean;
  currentSeekStartTimestamp?: number;
  currentSeekStartPosition?: number;
  currentSeekTargetPosition?: number;
  // Audio & Subtitle tracks (Day 4)
  currentAudioTrackId?: string;
  currentAudioLanguage?: string;
  currentAudioFormat?: string;
  currentSubtitleTrackId?: string;
  currentSubtitleLanguage?: string;
  // Quality & ABR (Day 4)
  currentQualityMode?: 'auto' | 'manual';
  currentQualityId?: string;
  currentBitrate?: number | string;
  currentWidth?: number;
  currentHeight?: number;
  // Resume & Progress milestones (Day 7)
  hasResumePlaybackEmitted?: boolean;
  lastReportedProgressSeconds?: number;
}

/**
 * PlaybackSessionManager manages the lifecycle state machine for OTT video playback telemetry:
 *
 *   New content
 *       ↓
 *   playback_start_requested
 *       ↓
 *   player_ready
 *       ↓
 *   playback_started
 *       ↓
 *   first_frame
 *       ↓
 *    ┌─────────────────────────────┐
 *    │                             │
 *   Pause       Buffering       Continue
 *    │             │               │
 *    ↓             ↓               ↓
 *   paused   buffer_started   playing / timeupdate
 *    │             │               │
 *   resumed   buffer_ended         │
 *    │             │               │
 *    └─────────────┴───────────────┘
 *                  ↓
 *        completed OR stopped
 */
export class PlaybackSessionManager {
  private static instance: PlaybackSessionManager;
  private currentSession: ActivePlaybackSession | null = null;
  private lastActiveChannelId: string | null = null;
  private lastActiveChannelName: string | null = null;
  private readonly analytics: AnalyticsService;

  constructor(analytics: AnalyticsService = analyticsService) {
    this.analytics = analytics;
  }

  public static getInstance(): PlaybackSessionManager {
    if (!PlaybackSessionManager.instance) {
      PlaybackSessionManager.instance = new PlaybackSessionManager();
    }
    return PlaybackSessionManager.instance;
  }

  public getLastActiveChannelId(): string | null {
    return this.lastActiveChannelId;
  }

  public setLastActiveChannelId(channelId: string | null): void {
    this.lastActiveChannelId = channelId;
  }

  public getPreviousChannelId(): string | null {
    return this.currentSession?.previousChannelId ?? null;
  }

  public getCurrentChannelId(): string | null {
    return this.currentSession?.channelId ?? null;
  }

  /**
   * Returns current playback session ID or null if none active.
   */
  public getCurrentSessionId(): string | null {
    return this.currentSession?.playbackSessionId ?? null;
  }

  /**
   * Returns a snapshot of current session data or null if none active.
   */
  public getCurrentSession(): Readonly<ActivePlaybackSession> | null {
    return this.currentSession ? {...this.currentSession} : null;
  }

  /**
   * Returns whether a session is currently running and has not reached completed/stopped/error.
   */
  public isSessionActive(): boolean {
    if (!this.currentSession) {
      return false;
    }
    return (
      this.currentSession.state !== 'completed' &&
      this.currentSession.state !== 'stopped' &&
      this.currentSession.state !== 'error'
    );
  }

  /**
   * Returns whether playback_started has been emitted for the current session.
   */
  public hasPlaybackStarted(): boolean {
    return Boolean(this.currentSession?.hasPlaybackStarted);
  }

  /**
   * Returns whether the first frame has rendered for the current session.
   */
  public hasFirstFrameRendered(): boolean {
    return Boolean(this.currentSession?.hasFirstFrame);
  }

  /**
   * Returns whether player_ready has been emitted for the current session.
   */
  public hasPlayerReady(): boolean {
    return Boolean(this.currentSession?.hasPlayerReady);
  }

  /**
   * Returns whether the player is currently in a buffering episode.
   */
  public isCurrentlyBuffering(): boolean {
    return Boolean(this.currentSession?.isCurrentlyBuffering);
  }

  /**
   * Returns current session buffer metrics snapshot.
   */
  public getBufferMetrics(): Readonly<PlaybackBufferMetrics> | null {
    if (!this.currentSession) {
      return null;
    }
    return {...this.currentSession.bufferMetrics};
  }

  /**
   * Returns current session startup metrics if first frame has rendered.
   */
  public getStartupMetrics(): {
    startupTimeMs?: number;
    timeToFirstFrameMs?: number;
  } | null {
    if (!this.currentSession || !this.currentSession.firstFrameTime) {
      return null;
    }
    const startupTimeMs = Math.max(
      0,
      this.currentSession.firstFrameTime -
        this.currentSession.startRequestedTime,
    );
    return {
      startupTimeMs,
      timeToFirstFrameMs: startupTimeMs,
    };
  }

  /**
   * Returns whether resume_playback has already been emitted for this session.
   */
  public hasResumePlaybackEmitted(): boolean {
    return Boolean(this.currentSession?.hasResumePlaybackEmitted);
  }

  /**
   * Returns the last confirmed progress checkpoint in seconds reported to analytics.
   */
  public getLastReportedProgressSeconds(): number | undefined {
    return this.currentSession?.lastReportedProgressSeconds;
  }

  /**
   * Step 1: New Content -> Create playbackSessionId -> playback_start_requested -> playback_started.
   * If a previous session was active without completion, automatically stops it.
   */
  public async startSession(
    options: StartPlaybackSessionOptions,
  ): Promise<string> {
    // If an existing session is still active, terminate it gracefully first
    if (this.isSessionActive() && this.currentSession) {
      await this.recordStop({
        stopReason: 'content_changed',
        reason: 'episode_switch',
      });
    }

    const playbackSessionId = generatePlaybackSessionId();
    const now = Date.now();
    const isLive = Boolean(options.isLive || options.contentType === 'live');
    const contentType =
      options.contentType || (isLive ? 'live' : 'movie');
    const playbackType = options.playbackType || contentType;
    const channelId = options.channelId;
    let previousChannelId = options.previousChannelId;

    if (isLive && channelId) {
      if (
        !previousChannelId &&
        this.lastActiveChannelId &&
        this.lastActiveChannelId !== channelId
      ) {
        previousChannelId = this.lastActiveChannelId;
      }
    }

    const session: ActivePlaybackSession = {
      playbackSessionId,
      contentId: options.contentId,
      contentTitle: options.contentTitle,
      contentType,
      seriesId: options.seriesId,
      episodeId: options.episodeId,
      sourceScreen: options.sourceScreen,
      playbackType,
      streamType: options.streamType,
      isLive,
      channelId,
      channelName: options.channelName,
      previousChannelId,
      selectionSource: options.selectionSource,
      changeSource: options.changeSource || (options.selectionSource ?? 'epg'),
      hasChannelChangedEmitted: false,
      profileId: options.profileId || this.analytics.getContext?.()?.profileId,
      profileType:
        options.profileType || this.analytics.getContext?.()?.profileType,
      startPosition: options.startPosition || 0,
      duration: options.duration || 0,
      sessionStartTime: now,
      startRequestedTime: now,
      hasStartRequested: false,
      hasPlayerReady: false,
      hasPlaybackStarted: false,
      hasFirstFrame: false,
      hasPlaybackError: false,
      state: 'start_requested',
      totalPlayTimeMs: 0,
      bufferMetrics: {
        bufferCount: 0,
        totalBufferDurationMs: 0,
      },
      isCurrentlyBuffering: false,
      isSeeking: false,
    };

    this.currentSession = session;

    // Day 3: Track playback_start_requested (once per session)
    await this.recordPlaybackStartRequested({
      startPosition: session.startPosition,
    });

    // Unless explicitly deferred, emit playback_started for Day 2 compatibility
    if (!options.deferPlaybackStarted) {
      await this.recordPlaybackStarted({
        startPosition: session.startPosition,
        duration: session.duration,
      });
    }

    return playbackSessionId;
  }

  /**
   * Helper to construct unified base parameters across all playback events,
   * ensuring content identity (title, type, seriesId, episodeId, sourceScreen, position, duration)
   * is attached consistently.
   */
  private getBasePlaybackParams(
    session: ActivePlaybackSession,
    positionSeconds?: number,
    durationSeconds?: number,
  ): PlaybackBaseParams {
    const posSec =
      typeof positionSeconds === 'number' && Number.isFinite(positionSeconds)
        ? positionSeconds
        : session.startPosition;
    const durSec =
      typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)
        ? durationSeconds
        : session.duration;
    const posMs =
      typeof posSec === 'number' && Number.isFinite(posSec)
        ? Math.round(posSec * 1000)
        : undefined;
    const durMs =
      typeof durSec === 'number' && Number.isFinite(durSec) && durSec > 0
        ? Math.round(durSec * 1000)
        : undefined;

    return {
      playbackSessionId: session.playbackSessionId,
      playback_session_id: session.playbackSessionId,
      contentId: session.contentId,
      content_id: session.contentId,
      ...(session.contentId ? {item_id: session.contentId} : {}),
      ...(session.contentTitle
        ? {
            contentTitle: session.contentTitle,
            content_title: session.contentTitle,
            item_name: session.contentTitle,
            video_title: session.contentTitle,
          }
        : {}),
      contentType: session.contentType,
      content_type: session.contentType,
      ...(session.seriesId
        ? {
            seriesId: session.seriesId,
            series_id: session.seriesId,
          }
        : {}),
      ...(session.episodeId
        ? {
            episodeId: session.episodeId,
            episode_id: session.episodeId,
          }
        : {}),
      ...(session.sourceScreen
        ? {
            sourceScreen: session.sourceScreen,
            source_screen: session.sourceScreen,
          }
        : {}),
      playbackType: session.playbackType || session.contentType,
      playback_type: session.playbackType || session.contentType,
      streamType: session.streamType,
      isLive: session.isLive,
      is_live: session.isLive,
      profileId: session.profileId,
      profile_id: session.profileId,
      profileType: session.profileType,
      profile_type: session.profileType,
      ...(posMs !== undefined ? {position_ms: posMs} : {}),
      ...(durMs !== undefined ? {duration_ms: durMs} : {}),
      ...(session.channelId
        ? {
            channelId: session.channelId,
            channel_id: session.channelId,
            channelName: session.channelName,
            channel_name: session.channelName,
          }
        : {}),
    };
  }

  /**
   * Day 3 Event: playback_start_requested.
   * Represents the application initiating the playback request.
   * Emitted exactly once per playback session.
   */
  public async recordPlaybackStartRequested(params?: {
    startPosition?: number;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.hasStartRequested) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }

    this.currentSession.hasStartRequested = true;
    const startPosition =
      typeof params?.startPosition === 'number'
        ? params.startPosition
        : this.currentSession.startPosition;

    const base = this.getBasePlaybackParams(this.currentSession, startPosition);
    const startRequestedParams: PlaybackStartRequestedParams = {
      ...base,
      startPosition,
      start_position: startPosition,
    };

    try {
      await this.analytics.trackPlaybackStartRequested?.(startRequestedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackStartRequested failed:', err);
      }
    }
  }

  /**
   * Day 3 Event: player_ready.
   * Emitted when player reaches reliable ready state (e.g. loadedmetadata / canplay).
   * Emitted exactly once per playback session.
   */
  public async recordPlayerReady(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.hasPlayerReady) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }

    const now = Date.now();
    this.currentSession.hasPlayerReady = true;
    this.currentSession.playerReadyTime = now;
    if (
      this.currentSession.state === 'start_requested' ||
      this.currentSession.state === 'started'
    ) {
      this.currentSession.state = 'ready';
    }

    const base = this.getBasePlaybackParams(this.currentSession);
    const playerReadyParams: PlayerReadyParams = {
      ...base,
    };

    try {
      await this.analytics.trackPlayerReady?.(playerReadyParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlayerReady failed:', err);
      }
    }
  }

  /**
   * Step 2: playback_started event.
   * Emitted when playback actually begins or session starts.
   * Guarded against duplicate firing within the same session.
   */
  public async recordPlaybackStarted(params?: {
    startPosition?: number;
    duration?: number;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.hasPlaybackStarted) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }

    const now = Date.now();
    this.currentSession.hasPlaybackStarted = true;
    this.currentSession.playbackStartedTime = now;
    if (
      this.currentSession.state === 'start_requested' ||
      this.currentSession.state === 'ready'
    ) {
      this.currentSession.state = 'started';
    }

    const startPos =
      typeof params?.startPosition === 'number'
        ? params.startPosition
        : this.currentSession.startPosition;
    const dur =
      typeof params?.duration === 'number'
        ? params.duration
        : this.currentSession.duration;

    const base = this.getBasePlaybackParams(this.currentSession, startPos, dur);
    const startedParams: PlaybackStartedParams = {
      ...base,
      startPosition: startPos,
      start_position: startPos,
      duration: dur,
    };

    try {
      await this.analytics.trackPlaybackStarted(startedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackStarted failed:', err);
      }
    }

    // Confirm channel change on successful live playback start
    if (
      this.currentSession.isLive &&
      this.currentSession.channelId &&
      this.currentSession.previousChannelId &&
      this.currentSession.previousChannelId !== this.currentSession.channelId &&
      !this.currentSession.hasChannelChangedEmitted
    ) {
      this.currentSession.hasChannelChangedEmitted = true;
      await this.recordLiveChannelChanged({
        previous_channel_id: this.currentSession.previousChannelId,
        previousChannelId: this.currentSession.previousChannelId,
        channel_id: this.currentSession.channelId,
        channelId: this.currentSession.channelId,
        playback_session_id: this.currentSession.playbackSessionId,
        playbackSessionId: this.currentSession.playbackSessionId,
        change_source: this.currentSession.changeSource || 'epg',
        changeSource: this.currentSession.changeSource || 'epg',
      });
    }

    if (this.currentSession.isLive && this.currentSession.channelId) {
      this.lastActiveChannelId = this.currentSession.channelId;
      this.lastActiveChannelName = this.currentSession.channelName || null;
    }
  }

  /**
   * Step 3: first_frame event.
   * Measures startup_time_ms / timeToFirstFrameMs from start request to first frame render.
   * Fired exactly once per session.
   */
  public async recordFirstFrame(
    params?:
      | {
          position?: number;
          startupTimeMs?: number;
        }
      | number,
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.hasFirstFrame) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }

    const now = Date.now();
    // Primary startup metric: first_frame_timestamp - playback_start_requested_timestamp
    const startupTimeMs =
      typeof params === 'number'
        ? params
        : typeof params?.startupTimeMs === 'number'
        ? params.startupTimeMs
        : Math.max(0, now - this.currentSession.startRequestedTime);

    const pos =
      typeof params === 'object' && typeof params?.position === 'number'
        ? params.position
        : this.currentSession.startPosition;

    // Ensure playback_started precedes first_frame
    if (!this.currentSession.hasPlaybackStarted) {
      await this.recordPlaybackStarted({
        startPosition: pos,
        duration: this.currentSession.duration,
      });
    }

    this.currentSession.hasFirstFrame = true;
    this.currentSession.firstFrameTime = now;
    if (
      this.currentSession.state === 'started' ||
      this.currentSession.state === 'ready' ||
      this.currentSession.state === 'start_requested'
    ) {
      this.currentSession.state = 'playing';
      this.currentSession.lastPlayStartTime = now;
    }

    const base = this.getBasePlaybackParams(this.currentSession, pos);
    const firstFrameParams: FirstFrameParams = {
      ...base,
      timeToFirstFrameMs: startupTimeMs,
      time_to_first_frame_ms: startupTimeMs,
      startup_time_ms: startupTimeMs,
      startupTimeMs,
      position: pos,
    };

    try {
      await this.analytics.trackFirstFrame(firstFrameParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackFirstFrame failed:', err);
      }
    }
  }

  /**
   * Day 3 Event: buffer_started.
   * Tracks when the player enters a buffering state during active playback.
   * Initial startup (before first_frame) is NOT treated as buffering.
   * Repeated callbacks are deduplicated via the internal isCurrentlyBuffering state.
   */
  public async recordBufferStarted(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    // Section 8 & 14: Only rebuffering after first frame counts.
    // Initial startup (playback_start_requested -> ready -> first_frame) != buffering.
    if (!this.currentSession.hasFirstFrame) {
      return;
    }
    // Section 13: User pause is NOT buffering.
    if (this.currentSession.state === 'paused') {
      return;
    }
    // Section 11 & 12: Protect against duplicate callbacks. PLAYING -> BUFFERING only.
    if (this.currentSession.isCurrentlyBuffering) {
      return;
    }

    const now = Date.now();
    this.currentSession.isCurrentlyBuffering = true;
    this.currentSession.bufferMetrics.bufferCount += 1;
    this.currentSession.bufferMetrics.currentBufferStartTimestamp = now;

    // Accrue playback time before buffering
    if (this.currentSession.lastPlayStartTime) {
      this.currentSession.totalPlayTimeMs +=
        now - this.currentSession.lastPlayStartTime;
      this.currentSession.lastPlayStartTime = undefined;
    }

    this.currentSession.state = 'buffering';

    const base = this.getBasePlaybackParams(this.currentSession);
    const bufferStartedParams: BufferStartedParams = {
      ...base,
      bufferCount: this.currentSession.bufferMetrics.bufferCount,
      buffer_count: this.currentSession.bufferMetrics.bufferCount,
    };

    try {
      await this.analytics.trackBufferStarted?.(bufferStartedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackBufferStarted failed:', err);
      }
    }
  }

  /**
   * Day 3 Event: buffer_ended.
   * Tracks when playback resumes after a buffering episode.
   * Calculates bufferDurationMs = buffer_ended - buffer_started.
   * Repeated callbacks are ignored (only BUFFERING -> PLAYING generates buffer_ended).
   */
  public async recordBufferEnded(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    // Section 11 & 12: Only BUFFERING -> PLAYING generates buffer_ended.
    if (!this.currentSession.isCurrentlyBuffering) {
      return;
    }

    const now = Date.now();
    const startTimestamp =
      this.currentSession.bufferMetrics.currentBufferStartTimestamp || now;
    const bufferDurationMs = Math.max(0, now - startTimestamp);

    this.currentSession.bufferMetrics.totalBufferDurationMs += bufferDurationMs;
    this.currentSession.bufferMetrics.currentBufferStartTimestamp = undefined;
    this.currentSession.isCurrentlyBuffering = false;
    this.currentSession.state = 'playing';
    this.currentSession.lastPlayStartTime = now;

    const base = this.getBasePlaybackParams(this.currentSession);
    const bufferEndedParams: BufferEndedParams = {
      ...base,
      bufferDurationMs,
      buffer_duration_ms: bufferDurationMs,
      bufferCount: this.currentSession.bufferMetrics.bufferCount,
      buffer_count: this.currentSession.bufferMetrics.bufferCount,
    };

    try {
      await this.analytics.trackBufferEnded?.(bufferEndedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackBufferEnded failed:', err);
      }
    }
  }

  /**
   * Step 4a: Pause -> playback_paused event.
   * Emitted only when transitioning from active playing to paused.
   * Buffering and player initialization must not generate playback_paused.
   */
  public async recordPause(position: number): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }

    // Do not track buffering or player initialization as pause.
    // Must strictly be transitioning from PLAYING to PAUSED.
    if (this.currentSession.state !== 'playing') {
      return;
    }

    const now = Date.now();
    // Accrue playback time before pausing
    if (this.currentSession.lastPlayStartTime) {
      this.currentSession.totalPlayTimeMs +=
        now - this.currentSession.lastPlayStartTime;
      this.currentSession.lastPlayStartTime = undefined;
    }

    this.currentSession.state = 'paused';
    this.currentSession.pauseStartTime = now;

    const numericPosition =
      typeof position === 'number' && Number.isFinite(position)
        ? Math.max(0, position)
        : 0;

    const base = this.getBasePlaybackParams(this.currentSession, numericPosition);
    const pausedParams: PlaybackPausedParams = {
      ...base,
      position: numericPosition,
    };

    try {
      await this.analytics.trackPlaybackPaused(pausedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackPaused failed:', err);
      }
    }
  }

  /**
   * Step 4b: Continue -> playback_resumed event.
   * Emitted only when resuming after a preceding pause (PAUSED -> PLAYING).
   * Initial playback and buffer_ended must not generate playback_resumed.
   */
  public async recordResume(position: number): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }
    // Resumed must only follow a paused state
    if (this.currentSession.state !== 'paused') {
      return;
    }

    const now = Date.now();
    const pauseDurationMs = this.currentSession.pauseStartTime
      ? Math.max(0, now - this.currentSession.pauseStartTime)
      : 0;

    this.currentSession.state = 'playing';
    this.currentSession.pauseStartTime = undefined;
    this.currentSession.lastPlayStartTime = now;

    const numericPosition =
      typeof position === 'number' && Number.isFinite(position)
        ? Math.max(0, position)
        : 0;

    const base = this.getBasePlaybackParams(this.currentSession, numericPosition);
    const resumedParams: PlaybackResumedParams = {
      ...base,
      position: numericPosition,
      pauseDurationMs,
      pause_duration_ms: pauseDurationMs,
    };

    try {
      await this.analytics.trackPlaybackResumed(resumedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackResumed failed:', err);
      }
    }
  }

  /**
   * Step 4c: resume_playback event.
   * Emitted when playback genuinely resumes from an existing saved position.
   * Emitted at most once per playback session. Starting from 0 or unavailable position must not emit.
   */
  public async recordResumePlayback(params: {
    resumePositionSeconds: number;
    resumeSource?: 'continue_watching' | 'details' | 'deeplink' | string;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.isLive) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }
    if (this.currentSession.hasResumePlaybackEmitted) {
      return;
    }
    const numericPosition =
      typeof params?.resumePositionSeconds === 'number' &&
      Number.isFinite(params.resumePositionSeconds)
        ? Math.floor(params.resumePositionSeconds)
        : 0;

    if (numericPosition <= 0) {
      return;
    }

    this.currentSession.hasResumePlaybackEmitted = true;

    const base = this.getBasePlaybackParams(this.currentSession, numericPosition);
    const resumeParams: ResumePlaybackParams = {
      ...base,
      content_id: this.currentSession.contentId,
      resume_position_seconds: numericPosition,
      resumePositionSeconds: numericPosition,
      ...(params.resumeSource
        ? {
            resume_source: params.resumeSource,
            resumeSource: params.resumeSource,
          }
        : {}),
    };

    try {
      await this.analytics.trackResumePlayback(resumeParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackResumePlayback failed:', err);
      }
    }
  }

  /**
   * Step 4d: playback_progress_saved event.
   * Emitted only after a progress persistence operation succeeds in Firestore.
   */
  public async recordPlaybackProgressSaved(params: {
    positionSeconds: number;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.isLive) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }
    const numericPosition =
      typeof params?.positionSeconds === 'number' &&
      Number.isFinite(params.positionSeconds)
        ? Math.floor(params.positionSeconds)
        : 0;

    this.currentSession.lastReportedProgressSeconds = numericPosition;

    const base = this.getBasePlaybackParams(this.currentSession, numericPosition);
    const progressParams: PlaybackProgressSavedParams = {
      ...base,
      content_id: this.currentSession.contentId,
      position_seconds: numericPosition,
      positionSeconds: numericPosition,
    };

    try {
      await this.analytics.trackPlaybackProgressSaved(progressParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          '[PlaybackSessionManager] trackPlaybackProgressSaved failed:',
          err,
        );
      }
    }
  }

  /**
   * Step 5a: completed event.
   * Emitted when playback naturally reaches the end. Mutually exclusive with stopped.
   * Normal Live TV sessions do NOT emit completed.
   */
  public async recordComplete(
    params?:
      | {
          duration?: number;
        }
      | number,
    _duration?: number,
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }
    // Live TV sessions do NOT emit completed
    if (this.currentSession.isLive) {
      return;
    }

    if (this.currentSession.isCurrentlyBuffering) {
      const now = Date.now();
      const startTimestamp =
        this.currentSession.bufferMetrics.currentBufferStartTimestamp || now;
      this.currentSession.bufferMetrics.totalBufferDurationMs += Math.max(
        0,
        now - startTimestamp,
      );
      this.currentSession.bufferMetrics.currentBufferStartTimestamp = undefined;
      this.currentSession.isCurrentlyBuffering = false;
    }

    const now = Date.now();
    if (this.currentSession.lastPlayStartTime) {
      this.currentSession.totalPlayTimeMs +=
        now - this.currentSession.lastPlayStartTime;
      this.currentSession.lastPlayStartTime = undefined;
    }

    const finalDuration =
      typeof params === 'number'
        ? params
        : typeof params?.duration === 'number' && params.duration > 0
        ? params.duration
        : typeof _duration === 'number' && _duration > 0
        ? _duration
        : this.currentSession.duration;

    const base = this.getBasePlaybackParams(this.currentSession, undefined, finalDuration);
    const completedParams: PlaybackCompletedParams = {
      ...base,
      duration: finalDuration,
      totalPlayTimeMs: this.currentSession.totalPlayTimeMs,
      total_play_time_ms: this.currentSession.totalPlayTimeMs,
    };

    this.currentSession.state = 'completed';
    try {
      await this.analytics.trackPlaybackCompleted(completedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackCompleted failed:', err);
      }
    }
    this.currentSession = null;
  }

  /**
   * Step 5b: stopped event.
   * Emitted when user exits or playback is interrupted before completion. Mutually exclusive with completed.
   */
  public async recordStop(params?: {
    position?: number;
    duration?: number;
    reason?: PlaybackStoppedParams['reason'];
    stopReason?: PlaybackStopReason;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }

    if (this.currentSession.isCurrentlyBuffering) {
      const now = Date.now();
      const startTimestamp =
        this.currentSession.bufferMetrics.currentBufferStartTimestamp || now;
      this.currentSession.bufferMetrics.totalBufferDurationMs += Math.max(
        0,
        now - startTimestamp,
      );
      this.currentSession.bufferMetrics.currentBufferStartTimestamp = undefined;
      this.currentSession.isCurrentlyBuffering = false;
    }

    const now = Date.now();
    if (this.currentSession.lastPlayStartTime) {
      this.currentSession.totalPlayTimeMs +=
        now - this.currentSession.lastPlayStartTime;
      this.currentSession.lastPlayStartTime = undefined;
    }

    const finalDuration =
      typeof params?.duration === 'number' && params.duration > 0
        ? params.duration
        : this.currentSession.duration;

    const rawReason = params?.stopReason || params?.reason;
    let controlledStopReason: PlaybackStopReason = 'user_exit';

    switch (rawReason) {
      case 'user_exit':
        controlledStopReason = 'user_exit';
        break;
      case 'navigation':
      case 'back_navigation':
        controlledStopReason = 'navigation';
        break;
      case 'content_changed':
      case 'episode_switch':
        controlledStopReason = 'content_changed';
        break;
      case 'player_destroyed':
      case 'app_backgrounded':
        controlledStopReason = 'player_destroyed';
        break;
      case 'unknown':
        controlledStopReason = 'unknown';
        break;
      default:
        controlledStopReason = 'user_exit';
        break;
    }

    const numericPos =
      typeof params?.position === 'number' && Number.isFinite(params.position)
        ? Math.max(0, params.position)
        : 0;

    const base = this.getBasePlaybackParams(this.currentSession, numericPos, finalDuration);
    const stoppedParams: PlaybackStoppedParams = {
      ...base,
      position: numericPos,
      duration: finalDuration,
      totalPlayTimeMs: this.currentSession.totalPlayTimeMs,
      total_play_time_ms: this.currentSession.totalPlayTimeMs,
      reason: params?.reason || controlledStopReason,
      stopReason: controlledStopReason,
      stop_reason: controlledStopReason,
    };

    this.currentSession.state = 'stopped';
    try {
      await this.analytics.trackPlaybackStopped(stoppedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackStopped failed:', err);
      }
    }
    this.currentSession = null;
  }

  /**
   * Playback error event.
   * Normalizes player errors into controlled categories and sanitizes sensitive messages.
   * Fatal errors terminate the playback session.
   */
  public async recordPlaybackError(
    error: unknown,
    options?: {
      isFatal?: boolean;
      position?: number;
    },
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped' ||
      this.currentSession.state === 'error'
    ) {
      return;
    }

    const normalized = normalizePlaybackError(
      error,
      options?.isFatal ?? true,
    );

    const isFatal =
      options?.isFatal !== undefined
        ? options.isFatal
        : normalized.isFatal ?? true;

    // Deduplicate exact error in same session
    if (
      this.currentSession.hasPlaybackError &&
      this.currentSession.lastError?.errorCode === normalized.code &&
      this.currentSession.lastError?.errorCategory === normalized.category
    ) {
      return;
    }

    const numericPos =
      typeof options?.position === 'number' && Number.isFinite(options.position)
        ? Math.max(0, options.position)
        : 0;

    const base = this.getBasePlaybackParams(this.currentSession, numericPos);
    const errorParams: PlaybackErrorParams = {
      ...base,
      errorCategory: normalized.category,
      error_category: normalized.category,
      errorCode: normalized.code,
      error_code: normalized.code,
      errorMessage: normalized.message,
      error_message: normalized.message,
      isFatal,
      is_fatal: isFatal,
      position: numericPos,
    };

    this.currentSession.hasPlaybackError = true;
    this.currentSession.lastError = errorParams;

    if (isFatal) {
      this.currentSession.state = 'error';
    }

    try {
      await this.analytics.trackPlaybackError(errorParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          '[PlaybackSessionManager] trackPlaybackError failed:',
          err,
        );
      }
    }

    if (isFatal) {
      this.currentSession = null;
    }
  }

  /**
   * Day 4 Event: seek_started.
   * Tracks when the user initiates a seek operation (D-pad or seekbar).
   */
  public async recordSeekStarted(
    startPosition: number,
    targetPosition: number,
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }

    const startPos = Number.isFinite(startPosition) ? Math.max(0, startPosition) : 0;
    const targetPos = Number.isFinite(targetPosition) ? Math.max(0, targetPosition) : 0;

    // If already seeking, update the target position without re-emitting seek_started
    if (this.currentSession.isSeeking) {
      this.currentSession.currentSeekTargetPosition = targetPos;
      return;
    }

    const now = Date.now();
    this.currentSession.isSeeking = true;
    this.currentSession.currentSeekStartTimestamp = now;
    this.currentSession.currentSeekStartPosition = startPos;
    this.currentSession.currentSeekTargetPosition = targetPos;

    const base = this.getBasePlaybackParams(this.currentSession, startPos);
    const seekStartedParams: SeekStartedParams = {
      ...base,
      seekStartPosition: startPos,
      seek_start_position: startPos,
      seekTargetPosition: targetPos,
      seek_target_position: targetPos,
    };

    try {
      await this.analytics.trackSeekStarted?.(seekStartedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackSeekStarted failed:', err);
      }
    }
  }

  /**
   * Day 4 Event: seek_completed.
   * Tracks when the seek operation finishes (e.g. seeked event from media player).
   */
  public async recordSeekCompleted(
    position?: number,
    _seekDuration?: number,
    _success?: boolean,
  ): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (!this.currentSession.isSeeking) {
      return;
    }

    const now = Date.now();
    const startTimestamp = this.currentSession.currentSeekStartTimestamp || now;
    const seekDurationMs = Math.max(0, now - startTimestamp);
    const startPos = this.currentSession.currentSeekStartPosition ?? 0;
    const targetPos =
      typeof position === 'number' && Number.isFinite(position)
        ? Math.max(0, position)
        : (this.currentSession.currentSeekTargetPosition ?? startPos);

    this.currentSession.isSeeking = false;
    this.currentSession.currentSeekStartTimestamp = undefined;
    this.currentSession.currentSeekStartPosition = undefined;
    this.currentSession.currentSeekTargetPosition = undefined;

    const base = this.getBasePlaybackParams(this.currentSession, targetPos);
    const seekCompletedParams: SeekCompletedParams = {
      ...base,
      seekStartPosition: startPos,
      seek_start_position: startPos,
      seekTargetPosition: targetPos,
      seek_target_position: targetPos,
      seekDurationMs,
      seek_duration_ms: seekDurationMs,
    };

    try {
      await this.analytics.trackSeekCompleted?.(seekCompletedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackSeekCompleted failed:', err);
      }
    }
  }

  /**
   * Day 4 Event: audio_track_changed.
   * Tracks switching audio tracks / languages during playback.
   */
  public async recordAudioTrackChanged(params: {
    toAudioTrackId: string;
    toLanguage: string;
    toFormat?: string;
    fromAudioTrackId?: string;
    fromLanguage?: string;
    fromFormat?: string;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    if (this.currentSession.currentAudioTrackId === params.toAudioTrackId) {
      return;
    }

    const fromAudioTrackId =
      params.fromAudioTrackId || this.currentSession.currentAudioTrackId;
    const fromLanguage =
      params.fromLanguage || this.currentSession.currentAudioLanguage;
    const fromFormat =
      params.fromFormat || this.currentSession.currentAudioFormat;

    this.currentSession.currentAudioTrackId = params.toAudioTrackId;
    this.currentSession.currentAudioLanguage = params.toLanguage;
    this.currentSession.currentAudioFormat = params.toFormat;

    const base = this.getBasePlaybackParams(this.currentSession);
    const audioParams: AudioTrackChangedParams = {
      ...base,
      fromAudioTrackId,
      toAudioTrackId: params.toAudioTrackId,
      fromLanguage,
      toLanguage: params.toLanguage,
      fromFormat,
      toFormat: params.toFormat,
    };

    try {
      await this.analytics.trackAudioTrackChanged?.(audioParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackAudioTrackChanged failed:', err);
      }
    }
  }

  /**
   * Day 4 Event: subtitle_track_changed.
   * Tracks switching subtitle tracks or turning subtitles off.
   */
  public async recordSubtitleTrackChanged(params: {
    toSubtitleTrackId: string;
    toLanguage?: string;
    isOff?: boolean;
    fromSubtitleTrackId?: string;
    fromLanguage?: string;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    if (this.currentSession.currentSubtitleTrackId === params.toSubtitleTrackId) {
      return;
    }

    const isOff = Boolean(
      params.isOff ||
        params.toSubtitleTrackId === 'off' ||
        params.toSubtitleTrackId === 'none',
    );
    const fromSubtitleTrackId =
      params.fromSubtitleTrackId || this.currentSession.currentSubtitleTrackId;
    const fromLanguage =
      params.fromLanguage || this.currentSession.currentSubtitleLanguage;

    this.currentSession.currentSubtitleTrackId = params.toSubtitleTrackId;
    this.currentSession.currentSubtitleLanguage = params.toLanguage;

    const base = this.getBasePlaybackParams(this.currentSession);
    const subParams: SubtitleTrackChangedParams = {
      ...base,
      fromSubtitleTrackId,
      toSubtitleTrackId: params.toSubtitleTrackId,
      fromLanguage,
      toLanguage: params.toLanguage,
      isOff,
    };

    try {
      await this.analytics.trackSubtitleTrackChanged?.(subParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackSubtitleTrackChanged failed:', err);
      }
    }
  }

  /**
   * Day 4 Event: quality_selected.
   * Tracks manual vs Auto video quality selection from the quality modal.
   */
  public async recordQualitySelected(params: {
    qualityId: string;
    qualityMode?: 'auto' | 'manual';
    targetResolution?: string;
    targetBitrate?: string;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }

    const qualityMode =
      params.qualityMode || (params.qualityId === 'auto' ? 'auto' : 'manual');
    this.currentSession.currentQualityId = params.qualityId;
    this.currentSession.currentQualityMode = qualityMode;

    const base = this.getBasePlaybackParams(this.currentSession);
    const qualityParams: QualitySelectedParams = {
      ...base,
      qualityId: params.qualityId,
      qualityMode,
      targetResolution: params.targetResolution,
      targetBitrate: params.targetBitrate,
    };

    try {
      await this.analytics.trackQualitySelected?.(qualityParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackQualitySelected failed:', err);
      }
    }
  }

  /**
   * Day 4 Event: bitrate_changed.
   * Tracks bitrate adaptations during playback.
   */
  public async recordBitrateChanged(params: {
    toBitrate: number | string;
    fromBitrate?: number | string;
    bitrateMbps?: string;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    if (this.currentSession.currentBitrate === params.toBitrate) {
      return;
    }

    const fromBitrate =
      params.fromBitrate !== undefined
        ? params.fromBitrate
        : this.currentSession.currentBitrate;
    this.currentSession.currentBitrate = params.toBitrate;

    const base = this.getBasePlaybackParams(this.currentSession);
    const bitrateParams: BitrateChangedParams = {
      ...base,
      fromBitrate,
      toBitrate: params.toBitrate,
      bitrateMbps: params.bitrateMbps,
    };

    try {
      await this.analytics.trackBitrateChanged?.(bitrateParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackBitrateChanged failed:', err);
      }
    }
  }

  /**
   * Day 4 Event: resolution_changed.
   * Tracks video resolution changes (e.g. 720p -> 1080p).
   */
  public async recordResolutionChanged(params: {
    toWidth: number;
    toHeight: number;
    fromWidth?: number;
    fromHeight?: number;
    resolutionBadge?: string;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    if (
      this.currentSession.currentWidth === params.toWidth &&
      this.currentSession.currentHeight === params.toHeight
    ) {
      return;
    }

    const fromWidth =
      params.fromWidth !== undefined
        ? params.fromWidth
        : this.currentSession.currentWidth;
    const fromHeight =
      params.fromHeight !== undefined
        ? params.fromHeight
        : this.currentSession.currentHeight;

    this.currentSession.currentWidth = params.toWidth;
    this.currentSession.currentHeight = params.toHeight;

    const base = this.getBasePlaybackParams(this.currentSession);
    const resParams: ResolutionChangedParams = {
      ...base,
      fromWidth,
      fromHeight,
      toWidth: params.toWidth,
      toHeight: params.toHeight,
      resolutionBadge: params.resolutionBadge,
    };

    try {
      await this.analytics.trackResolutionChanged?.(resParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackResolutionChanged failed:', err);
      }
    }
  }

  public isSeeking(): boolean {
    return Boolean(this.currentSession?.isSeeking);
  }

  public getCurrentAudioTrack(): {
    trackId?: string;
    id?: string;
    language?: string;
    format?: string;
  } | null {
    if (!this.currentSession) {
      return null;
    }
    return {
      id: this.currentSession.currentAudioTrackId,
      trackId: this.currentSession.currentAudioTrackId,
      language: this.currentSession.currentAudioLanguage,
      format: this.currentSession.currentAudioFormat,
    };
  }

  public getCurrentSubtitleTrack(): {
    trackId?: string;
    id?: string;
    language?: string;
  } | null {
    if (!this.currentSession) {
      return null;
    }
    return {
      id: this.currentSession.currentSubtitleTrackId,
      trackId: this.currentSession.currentSubtitleTrackId,
      language: this.currentSession.currentSubtitleLanguage,
    };
  }

  public getCurrentQuality(): {
    qualityId?: string;
    qualityMode?: 'auto' | 'manual';
  } | null {
    if (!this.currentSession) {
      return null;
    }
    return {
      qualityId: this.currentSession.currentQualityId,
      qualityMode: this.currentSession.currentQualityMode,
    };
  }

  public getCurrentRendition(): {
    bitrate?: number | string;
    width?: number;
    height?: number;
  } | null {
    if (!this.currentSession) {
      return null;
    }
    return {
      bitrate: this.currentSession.currentBitrate,
      width: this.currentSession.currentWidth,
      height: this.currentSession.currentHeight,
    };
  }

  /**
   * Day 6 Event: live_channel_selected
   * Tracks user explicit intent to select a live channel.
   */
  public async recordLiveChannelSelected(
    params: LiveChannelSelectedParams,
  ): Promise<void> {
    try {
      await this.analytics.trackLiveChannelSelected(params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackLiveChannelSelected failed:', err);
      }
    }
  }

  /**
   * Day 6 Event: live_channel_changed
   * Tracks confirmed successful transition from previous to new live channel.
   */
  public async recordLiveChannelChanged(
    params: LiveChannelChangedParams,
  ): Promise<void> {
    try {
      await this.analytics.trackLiveChannelChanged(params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackLiveChannelChanged failed:', err);
      }
    }
  }

  /**
   * Day 6 Event: epg_program_selected
   * Tracks user explicit selection of an EPG program.
   */
  public async recordEpgProgramSelected(
    params: EPGProgramSelectedParams,
  ): Promise<void> {
    try {
      await this.analytics.trackEpgProgramSelected(params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackEpgProgramSelected failed:', err);
      }
    }
  }

  /**
   * Day 6 Event: go_live
   * Tracks user explicit selection of Go Live action during live playback.
   */
  public async recordGoLive(params?: Partial<GoLiveParams>): Promise<void> {
    const channelId =
      params?.channel_id ||
      params?.channelId ||
      this.currentSession?.channelId ||
      '';
    const playbackSessionId =
      params?.playback_session_id ||
      params?.playbackSessionId ||
      this.currentSession?.playbackSessionId;
    try {
      await this.analytics.trackGoLive({
        channel_id: channelId,
        channelId,
        ...(playbackSessionId
          ? {
              playback_session_id: playbackSessionId,
              playbackSessionId,
            }
          : {}),
        ...params,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackGoLive failed:', err);
      }
    }
  }

  /**
   * Internal test helper to reset session state.
   */
  public __resetForTesting(): void {
    this.currentSession = null;
    this.lastActiveChannelId = null;
    this.lastActiveChannelName = null;
  }
}

export const playbackSessionManager = PlaybackSessionManager.getInstance();
