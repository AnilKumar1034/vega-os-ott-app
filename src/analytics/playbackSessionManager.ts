import {AnalyticsService, analyticsService} from './analyticsService';
import {
  AudioTrackChangedParams,
  BitrateChangedParams,
  BufferEndedParams,
  BufferStartedParams,
  FirstFrameParams,
  PlaybackBufferMetrics,
  PlaybackCompletedParams,
  PlaybackPausedParams,
  PlaybackResumedParams,
  PlaybackStartRequestedParams,
  PlaybackStartedParams,
  PlaybackStoppedParams,
  PlayerReadyParams,
  QualitySelectedParams,
  ResolutionChangedParams,
  SeekCompletedParams,
  SeekStartedParams,
  SubtitleTrackChangedParams,
} from './analyticsTypes';

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
  | 'stopped';

export interface StartPlaybackSessionOptions {
  contentId: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  playbackType?: string;
  streamType?: string;
  isLive?: boolean;
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
  playbackType?: string;
  streamType?: string;
  isLive?: boolean;
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
   * Returns whether a session is currently running and has not reached completed/stopped.
   */
  public isSessionActive(): boolean {
    if (!this.currentSession) {
      return false;
    }
    return (
      this.currentSession.state !== 'completed' &&
      this.currentSession.state !== 'stopped'
    );
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
   * Step 1: New Content -> Create playbackSessionId -> playback_start_requested -> playback_started.
   * If a previous session was active without completion, automatically stops it.
   */
  public async startSession(
    options: StartPlaybackSessionOptions,
  ): Promise<string> {
    // If an existing session is still active, terminate it gracefully first
    if (this.isSessionActive() && this.currentSession) {
      await this.recordStop({
        reason: 'episode_switch',
      });
    }

    const playbackSessionId = generatePlaybackSessionId();
    const now = Date.now();
    const contentType =
      options.contentType || (options.isLive ? 'live' : 'movie');
    const playbackType = options.playbackType || contentType;

    const session: ActivePlaybackSession = {
      playbackSessionId,
      contentId: options.contentId,
      contentTitle: options.contentTitle,
      contentType,
      playbackType,
      streamType: options.streamType,
      isLive: Boolean(options.isLive),
      profileId: options.profileId,
      profileType: options.profileType,
      startPosition: options.startPosition || 0,
      duration: options.duration || 0,
      sessionStartTime: now,
      startRequestedTime: now,
      hasStartRequested: false,
      hasPlayerReady: false,
      hasPlaybackStarted: false,
      hasFirstFrame: false,
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

    const startRequestedParams: PlaybackStartRequestedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      startPosition,
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

    const playerReadyParams: PlayerReadyParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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
      this.currentSession.state === 'stopped'
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

    const startedParams: PlaybackStartedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      startPosition:
        typeof params?.startPosition === 'number'
          ? params.startPosition
          : this.currentSession.startPosition,
      duration:
        typeof params?.duration === 'number'
          ? params.duration
          : this.currentSession.duration,
    };

    try {
      await this.analytics.trackPlaybackStarted(startedParams);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[PlaybackSessionManager] trackPlaybackStarted failed:', err);
      }
    }
  }

  /**
   * Step 3: first_frame event.
   * Measures startup_time_ms / timeToFirstFrameMs from start request to first frame render.
   * Fired exactly once per session.
   */
  public async recordFirstFrame(params?: {
    position?: number;
  }): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (this.currentSession.hasFirstFrame) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }

    const now = Date.now();
    // Primary startup metric: first_frame_timestamp - playback_start_requested_timestamp
    const startupTimeMs = Math.max(
      0,
      now - this.currentSession.startRequestedTime,
    );

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

    const firstFrameParams: FirstFrameParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      timeToFirstFrameMs: startupTimeMs,
      startup_time_ms: startupTimeMs,
      startupTimeMs,
      position:
        typeof params?.position === 'number'
          ? params.position
          : this.currentSession.startPosition,
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

    const bufferStartedParams: BufferStartedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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

    const bufferEndedParams: BufferEndedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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
   * Step 4a: Pause -> paused event.
   * Emitted only when transitioning from active playing to paused.
   */
  public async recordPause(position: number): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
    ) {
      return;
    }
    // If buffering when user pauses, cleanly terminate buffer timing
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

    // Prevent duplicate pause events
    if (this.currentSession.state === 'paused') {
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

    const pausedParams: PlaybackPausedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      position: Number.isFinite(position) ? position : 0,
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
   * Step 4b: Continue -> resumed event.
   * Emitted only when resuming after a preceding pause.
   */
  public async recordResume(position: number): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    if (
      this.currentSession.state === 'completed' ||
      this.currentSession.state === 'stopped'
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

    const resumedParams: PlaybackResumedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      position: Number.isFinite(position) ? position : 0,
      pauseDurationMs,
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
   * Step 5a: completed event.
   * Emitted when playback naturally reaches the end. Mutually exclusive with stopped.
   * Normal Live TV sessions do NOT emit playback_completed.
   */
  public async recordComplete(params?: {
    duration?: number;
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
    // Section 18: Do NOT generate playback_completed for a normal live channel session.
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
      typeof params?.duration === 'number' && params.duration > 0
        ? params.duration
        : this.currentSession.duration;

    const completedParams: PlaybackCompletedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      duration: finalDuration,
      totalPlayTimeMs: this.currentSession.totalPlayTimeMs,
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

    const stoppedParams: PlaybackStoppedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
      position:
        typeof params?.position === 'number' && Number.isFinite(params.position)
          ? params.position
          : 0,
      duration: finalDuration,
      totalPlayTimeMs: this.currentSession.totalPlayTimeMs,
      reason: params?.reason || 'user_exit',
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

    const seekStartedParams: SeekStartedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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
  public async recordSeekCompleted(position?: number): Promise<void> {
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

    const seekCompletedParams: SeekCompletedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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

    const audioParams: AudioTrackChangedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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

    const subParams: SubtitleTrackChangedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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

    const qualityParams: QualitySelectedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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

    const bitrateParams: BitrateChangedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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

    const resParams: ResolutionChangedParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      playbackType:
        this.currentSession.playbackType || this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      profileId: this.currentSession.profileId,
      profileType: this.currentSession.profileType,
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
   * Internal test helper to reset session state.
   */
  public __resetForTesting(): void {
    this.currentSession = null;
  }
}

export const playbackSessionManager = PlaybackSessionManager.getInstance();
