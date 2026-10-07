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
  contentId: string;
  contentTitle?: string;
  contentType?: 'movie' | 'episode' | 'live';
  streamType?: string;
  isLive?: boolean;
  [key: string]: unknown;
}

export interface PlaybackStartedParams extends PlaybackBaseParams {
  startPosition?: number;
  duration?: number;
}

export interface FirstFrameParams extends PlaybackBaseParams {
  timeToFirstFrameMs: number;
  position?: number;
}

export interface PlaybackPausedParams extends PlaybackBaseParams {
  position: number;
}

export interface PlaybackResumedParams extends PlaybackBaseParams {
  position: number;
  pauseDurationMs?: number;
}

export interface PlaybackCompletedParams extends PlaybackBaseParams {
  duration: number;
  totalPlayTimeMs?: number;
}

export interface PlaybackStoppedParams extends PlaybackBaseParams {
  position: number;
  duration?: number;
  totalPlayTimeMs?: number;
  reason?:
    | 'user_exit'
    | 'back_navigation'
    | 'episode_switch'
    | 'app_backgrounded'
    | 'error';
}

export interface AnalyticsEventParamsMap {
  app_open: AppOpenEventParams;
  screen_view: ScreenViewEventParams;
  profile_selected: ProfileSelectedEventParams;
  playback_started: PlaybackStartedParams;
  first_frame: FirstFrameParams;
  paused: PlaybackPausedParams;
  resumed: PlaybackResumedParams;
  completed: PlaybackCompletedParams;
  stopped: PlaybackStoppedParams;
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
  trackPlaybackStarted(params: PlaybackStartedParams): Promise<void>;
  trackFirstFrame(params: FirstFrameParams): Promise<void>;
  trackPlaybackPaused(params: PlaybackPausedParams): Promise<void>;
  trackPlaybackResumed(params: PlaybackResumedParams): Promise<void>;
  trackPlaybackCompleted(params: PlaybackCompletedParams): Promise<void>;
  trackPlaybackStopped(params: PlaybackStoppedParams): Promise<void>;
  reset(): void;
}
