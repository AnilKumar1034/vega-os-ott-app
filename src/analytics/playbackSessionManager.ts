import {AnalyticsService, analyticsService} from './analyticsService';
import {
  FirstFrameParams,
  PlaybackCompletedParams,
  PlaybackPausedParams,
  PlaybackResumedParams,
  PlaybackStartedParams,
  PlaybackStoppedParams,
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
  | 'started'
  | 'playing'
  | 'paused'
  | 'completed'
  | 'stopped';

export interface StartPlaybackSessionOptions {
  contentId: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  streamType?: string;
  isLive?: boolean;
  startPosition?: number;
  duration?: number;
}

export interface ActivePlaybackSession {
  playbackSessionId: string;
  contentId: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  streamType?: string;
  isLive?: boolean;
  startPosition: number;
  duration: number;
  sessionStartTime: number;
  firstFrameTime?: number;
  hasFirstFrame: boolean;
  state: PlaybackSessionState;
  pauseStartTime?: number;
  totalPlayTimeMs: number;
  lastPlayStartTime?: number;
}

/**
 * PlaybackSessionManager manages the lifecycle state machine for OTT video playback telemetry:
 *
 *   New content
 *       ↓
 *   Create playbackSessionId
 *       ↓
 *   playback_started
 *       ↓
 *   first_frame
 *       ↓
 *    ┌───────────────┐
 *    │               │
 *   Pause          Continue
 *    │               │
 *    ↓               ↓
 *   paused → resumed
 *    │
 *    └───────────────┐
 *                    ↓
 *          completed OR stopped
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
   * Step 1 & 2: New Content -> Create playbackSessionId -> playback_started.
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

    const session: ActivePlaybackSession = {
      playbackSessionId,
      contentId: options.contentId,
      contentTitle: options.contentTitle,
      contentType: options.contentType || (options.isLive ? 'live' : 'movie'),
      streamType: options.streamType,
      isLive: Boolean(options.isLive),
      startPosition: options.startPosition || 0,
      duration: options.duration || 0,
      sessionStartTime: now,
      hasFirstFrame: false,
      state: 'started',
      totalPlayTimeMs: 0,
    };

    this.currentSession = session;

    const startedParams: PlaybackStartedParams = {
      playbackSessionId,
      contentId: session.contentId,
      contentTitle: session.contentTitle,
      contentType: session.contentType,
      streamType: session.streamType,
      isLive: session.isLive,
      startPosition: session.startPosition,
      duration: session.duration,
    };

    await this.analytics.trackPlaybackStarted(startedParams);
    return playbackSessionId;
  }

  /**
   * Step 3: first_frame event.
   * Measures time to first frame from session start, fired exactly once per session.
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
    const timeToFirstFrameMs = Math.max(
      0,
      now - this.currentSession.sessionStartTime,
    );

    this.currentSession.hasFirstFrame = true;
    this.currentSession.firstFrameTime = now;
    if (this.currentSession.state === 'started') {
      this.currentSession.state = 'playing';
      this.currentSession.lastPlayStartTime = now;
    }

    const firstFrameParams: FirstFrameParams = {
      playbackSessionId: this.currentSession.playbackSessionId,
      contentId: this.currentSession.contentId,
      contentTitle: this.currentSession.contentTitle,
      contentType: this.currentSession.contentType,
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      timeToFirstFrameMs,
      position:
        typeof params?.position === 'number'
          ? params.position
          : this.currentSession.startPosition,
    };

    await this.analytics.trackFirstFrame(firstFrameParams);
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
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      position: Number.isFinite(position) ? position : 0,
    };

    await this.analytics.trackPlaybackPaused(pausedParams);
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
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      position: Number.isFinite(position) ? position : 0,
      pauseDurationMs,
    };

    await this.analytics.trackPlaybackResumed(resumedParams);
  }

  /**
   * Step 5a: completed event.
   * Emitted when playback naturally reaches the end. Mutually exclusive with stopped.
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
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      duration: finalDuration,
      totalPlayTimeMs: this.currentSession.totalPlayTimeMs,
    };

    this.currentSession.state = 'completed';
    await this.analytics.trackPlaybackCompleted(completedParams);
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
      streamType: this.currentSession.streamType,
      isLive: this.currentSession.isLive,
      position:
        typeof params?.position === 'number' && Number.isFinite(params.position)
          ? params.position
          : 0,
      duration: finalDuration,
      totalPlayTimeMs: this.currentSession.totalPlayTimeMs,
      reason: params?.reason || 'user_exit',
    };

    this.currentSession.state = 'stopped';
    await this.analytics.trackPlaybackStopped(stoppedParams);
    this.currentSession = null;
  }

  /**
   * Internal test helper to reset session state.
   */
  public __resetForTesting(): void {
    this.currentSession = null;
  }
}

export const playbackSessionManager = PlaybackSessionManager.getInstance();
