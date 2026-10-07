import {getApp, getApps, initializeApp, type FirebaseApp} from 'firebase/app';
import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
  type Analytics,
} from 'firebase/analytics';
import {firebaseConfig} from '../config/firebaseConfig';
import {
  AnalyticsContextManager,
  analyticsContextManager,
} from './analyticsContext';
import {AnalyticsEvent, AnalyticsEventName} from './analyticsEvents';
import {
  AnalyticsContext,
  AnalyticsEventParams,
  AnalyticsProfileContext,
  AnalyticsServiceOptions,
  AnalyticsUserContext,
  FirstFrameParams,
  IAnalyticsService,
  PlaybackCompletedParams,
  PlaybackPausedParams,
  PlaybackResumedParams,
  PlaybackStartedParams,
  PlaybackStoppedParams,
  ProfileSelectedEventParams,
} from './analyticsTypes';

const getAsyncStorage = () => {
  try {
    return require('@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native')
      .default as {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    };
  } catch {
    return null;
  }
};

export class AnalyticsService implements IAnalyticsService {
  private static instance: AnalyticsService;

  private initialized = false;
  private initializingPromise: Promise<void> | null = null;
  private firebaseApp: FirebaseApp | null = null;
  private firebaseAnalytics: Analytics | null = null;
  private firebaseSupported = false;
  private hasTrackedAppOpen = false;
  private appInstanceId: string | null = null;
  private measurementProtocolSecret: string = '';
  private warnedMissingSecret = false;
  private readonly contextManager: AnalyticsContextManager;

  constructor(contextManager: AnalyticsContextManager = analyticsContextManager) {
    this.contextManager = contextManager;
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initializes the analytics layer safely and idempotently.
   * Safe to call multiple times; never crashes or blocks application startup.
   */
  public async initialize(options?: AnalyticsServiceOptions): Promise<void> {
    if (options?.measurementProtocolSecret) {
      this.measurementProtocolSecret = options.measurementProtocolSecret;
    }

    if (this.initialized) {
      return;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.initializingPromise = (async () => {
      try {
        // Reuse existing Firebase App if already initialized, or initialize with existing config
        if (getApps().length === 0) {
          this.firebaseApp = initializeApp(firebaseConfig);
        } else {
          this.firebaseApp = getApp();
        }

        // Verify if Firebase Analytics is supported in the current environment
        const supported = await isSupported().catch(() => false);
        if (supported && this.firebaseApp) {
          try {
            this.firebaseAnalytics = getAnalytics(this.firebaseApp);
            this.firebaseSupported = true;
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.log('[Analytics] Firebase Analytics initialized successfully.');
            }
          } catch (initErr) {
            this.firebaseSupported = false;
            this.firebaseAnalytics = null;
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.warn('[Analytics] Firebase getAnalytics failed:', initErr);
            }
          }
        } else {
          this.firebaseSupported = false;
          this.firebaseAnalytics = null;
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.log(
              '[Analytics] Running on Amazon Vega OS / React Native runtime. Using Google Analytics 4 Measurement Protocol REST API.',
            );
          }
        }

        // Initialize persistent App Instance ID for Measurement Protocol
        await this.getOrCreateAppInstanceId().catch(() => {});
      } catch (err) {
        this.firebaseSupported = false;
        this.firebaseAnalytics = null;
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] Initialization encountered an error:', err);
        }
      } finally {
        this.initialized = true;
        this.initializingPromise = null;

        if (options?.trackAppOpenOnInitialLaunch) {
          await this.trackAppOpen();
        }
      }
    })();

    return this.initializingPromise;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public isFirebaseSupported(): boolean {
    return this.firebaseSupported;
  }

  /**
   * Sets the authenticated user context (non-sensitive user ID only).
   */
  public setUser(userContext: AnalyticsUserContext | null): void {
    try {
      this.contextManager.setUser(userContext);
      if (this.firebaseSupported && this.firebaseAnalytics) {
        const uid = userContext?.userId || null;
        setUserId(this.firebaseAnalytics, uid);
      }
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] setUser error:', err);
      }
    }
  }

  /**
   * Sets the active profile context (profileId & profileType only, strictly no profile name).
   */
  public setProfile(profileContext: AnalyticsProfileContext | null): void {
    try {
      this.contextManager.setProfile(profileContext);
      if (this.firebaseSupported && this.firebaseAnalytics) {
        setUserProperties(this.firebaseAnalytics, {
          profile_id: profileContext?.profileId ?? null,
          profile_type: profileContext?.profileType ?? null,
        });
      }
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] setProfile error:', err);
      }
    }
  }

  /**
   * Sets or updates partial analytics context.
   */
  public setContext(context: Partial<AnalyticsContext>): void {
    try {
      this.contextManager.setContext(context);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] setContext error:', err);
      }
    }
  }

  /**
   * Returns current analytics context snapshot.
   */
  public getContext(): AnalyticsContext {
    return this.contextManager.getContext();
  }

  /**
   * Clears user and profile context on logout or session reset.
   */
  public reset(): void {
    try {
      this.contextManager.reset();
      if (this.firebaseSupported && this.firebaseAnalytics) {
        setUserId(this.firebaseAnalytics, null);
        setUserProperties(this.firebaseAnalytics, {
          profile_id: null,
          profile_type: null,
        });
      }
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] reset error:', err);
      }
    }
  }

  public setMeasurementProtocolSecret(secret: string): void {
    this.measurementProtocolSecret = secret;
  }

  public getMeasurementProtocolSecret(): string {
    return (
      this.measurementProtocolSecret ||
      firebaseConfig.measurementProtocolSecret ||
      ''
    );
  }

  public generateAppInstanceId(): string {
    const chars = '0123456789abcdef';
    let id = '';
    for (let i = 0; i < 32; i++) {
      id += chars.charAt(Math.floor(Math.random() * 16));
    }
    return id;
  }

  public async getOrCreateAppInstanceId(): Promise<string> {
    if (this.appInstanceId) {
      return this.appInstanceId;
    }

    const STORAGE_KEY = '@vegaott/analytics_app_instance_id';
    try {
      const storage = getAsyncStorage();
      if (storage) {
        const stored = await storage.getItem(STORAGE_KEY);
        if (stored && /^[0-9a-fA-F]{32}$/.test(stored)) {
          this.appInstanceId = stored.toLowerCase();
          return this.appInstanceId;
        }
      }
    } catch {
      // Storage access error; fallback to in-memory generation
    }

    const newId = this.generateAppInstanceId();
    this.appInstanceId = newId;

    try {
      const storage = getAsyncStorage();
      if (storage) {
        await storage.setItem(STORAGE_KEY, newId);
      }
    } catch {
      // Ignore storage write error
    }

    return this.appInstanceId;
  }

  /**
   * Dispatches analytics event via Google Analytics 4 Measurement Protocol REST API.
   * This is the official and primary event transmission path for Amazon Vega OS / React Native headless JS.
   */
  public async sendMeasurementProtocolEvent(
    eventName: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const appId = firebaseConfig.appId;
    if (!appId) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          '[Analytics] Measurement Protocol skipped: appId is missing in firebaseConfig.',
        );
      }
      return;
    }

    const apiSecret = this.getMeasurementProtocolSecret();
    if (!apiSecret && !this.warnedMissingSecret) {
      this.warnedMissingSecret = true;
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          '[Analytics] Measurement Protocol API Secret is not configured. ' +
          'Google Analytics drops incoming events if api_secret is missing. ' +
          'To see events in Firebase / GA4 Console: ' +
          'In Google Analytics -> Admin -> Data Streams -> Android app stream (com.anil.vegaott) -> Measurement Protocol API secrets, create a secret and set it in firebaseConfig.ts.',
        );
      }
    }

    try {
      const appInstanceId = await this.getOrCreateAppInstanceId();
      const context = this.contextManager.getContext();

      const body: Record<string, unknown> = {
        app_instance_id: appInstanceId,
        events: [
          {
            name: eventName,
            params: payload,
          },
        ],
      };

      if (context.userId) {
        body.user_id = context.userId;
      }

      const userProperties: Record<string, {value: string | number | boolean}> = {};
      if (context.profileId) {
        userProperties.profile_id = {value: context.profileId};
      }
      if (context.profileType) {
        userProperties.profile_type = {value: context.profileType};
      }
      if (Object.keys(userProperties).length > 0) {
        body.user_properties = userProperties;
      }

      const secretParam = apiSecret
        ? `&api_secret=${encodeURIComponent(apiSecret)}`
        : '';
      const url = `https://www.google-analytics.com/mp/collect?firebase_app_id=${encodeURIComponent(
        appId,
      )}${secretParam}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        if (response.ok || response.status === 204) {
          console.log(
            `[Analytics] Measurement Protocol event "${eventName}" dispatched successfully.`,
          );
        } else {
          console.warn(
            `[Analytics] Measurement Protocol response status: ${response.status}`,
          );
        }
      }
    } catch (networkErr) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(
          `[Analytics] Measurement Protocol network error for "${eventName}":`,
          networkErr,
        );
      }
    }
  }

  /**
   * Central track method.
   * Validates initialization, injects safe global context, and dispatches to Firebase.
   */
  public async track<T extends AnalyticsEventName>(
    eventName: T,
    params?: AnalyticsEventParams<T>,
  ): Promise<void> {
    try {
      if (!this.initialized) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            `[Analytics] track() called before initialize() for event: "${eventName}". Processing safely.`,
          );
        }
      }

      const payload = this.contextManager.buildEventPayload(
        params as Record<string, unknown> | undefined,
      );

      // Controlled development logging
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[Analytics] ${eventName}`, payload);
      }

      if (this.firebaseSupported && this.firebaseAnalytics) {
        const result = (
          logEvent as (
            instance: Analytics,
            name: string,
            eventParams?: Record<string, unknown>,
          ) => unknown
        )(this.firebaseAnalytics, eventName, payload);

        if (
          result &&
          typeof (result as Promise<unknown>).catch === 'function'
        ) {
          await (result as Promise<unknown>).catch(asyncErr => {
            if (typeof __DEV__ !== 'undefined' && __DEV__) {
              console.warn(
                `[Analytics] Firebase async logEvent rejected for "${eventName}":`,
                asyncErr,
              );
            }
          });
        }
      } else {
        await this.sendMeasurementProtocolEvent(eventName, payload);
      }
    } catch (err) {
      // Analytics must NEVER crash the application
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(`[Analytics] Failed to track event "${eventName}":`, err);
      }
    }
  }

  /**
   * Reusable method for screen tracking.
   */
  public async trackScreen(
    screenName: string,
    extraParams?: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (!screenName || typeof screenName !== 'string') {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackScreen called with invalid screenName.');
        }
        return;
      }
      await this.track(AnalyticsEvent.SCREEN_VIEW, {
        screen_name: screenName,
        ...extraParams,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackScreen error:', err);
      }
    }
  }

  /**
   * Reusable method for app_open tracking.
   * Guarded against duplicate firing from re-renders, navigation, or Fast Refresh.
   */
  public async trackAppOpen(params?: Record<string, unknown>): Promise<void> {
    try {
      if (this.hasTrackedAppOpen) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(
            '[Analytics] app_open already tracked for this session; skipping duplicate.',
          );
        }
        return;
      }
      this.hasTrackedAppOpen = true;
      await this.track(AnalyticsEvent.APP_OPEN, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackAppOpen error:', err);
      }
    }
  }

  /**
   * Reusable method for profile selection tracking.
   */
  public async trackProfileSelected(
    params: ProfileSelectedEventParams,
  ): Promise<void> {
    try {
      if (!params || !params.profileId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackProfileSelected called with invalid params.',
          );
        }
        return;
      }
      this.setProfile({
        profileId: params.profileId,
        profileType: params.profileType,
      });
      await this.track(AnalyticsEvent.PROFILE_SELECTED, {
        profileId: params.profileId,
        profileType: params.profileType,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackProfileSelected error:', err);
      }
    }
  }

  /**
   * Tracks playback started event when content begins.
   */
  public async trackPlaybackStarted(
    params: PlaybackStartedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackStarted called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.PLAYBACK_STARTED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackStarted error:', err);
      }
    }
  }

  /**
   * Tracks first frame rendered event.
   */
  public async trackFirstFrame(params: FirstFrameParams): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackFirstFrame called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.FIRST_FRAME, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackFirstFrame error:', err);
      }
    }
  }

  /**
   * Tracks paused event.
   */
  public async trackPlaybackPaused(
    params: PlaybackPausedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackPaused called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.PAUSED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackPaused error:', err);
      }
    }
  }

  /**
   * Tracks resumed event.
   */
  public async trackPlaybackResumed(
    params: PlaybackResumedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackResumed called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.RESUMED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackResumed error:', err);
      }
    }
  }

  /**
   * Tracks completed event when video finishes.
   */
  public async trackPlaybackCompleted(
    params: PlaybackCompletedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackCompleted called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.COMPLETED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackCompleted error:', err);
      }
    }
  }

  /**
   * Tracks stopped event when playback is stopped / exited before completion.
   */
  public async trackPlaybackStopped(
    params: PlaybackStoppedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackStopped called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.STOPPED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackStopped error:', err);
      }
    }
  }

  /**
   * Internal test helper to reset singleton state between unit tests.
   */
  public __resetForTesting(): void {
    this.initialized = false;
    this.initializingPromise = null;
    this.firebaseApp = null;
    this.firebaseAnalytics = null;
    this.firebaseSupported = false;
    this.hasTrackedAppOpen = false;
    this.appInstanceId = null;
    this.measurementProtocolSecret = '';
    this.warnedMissingSecret = false;
    this.contextManager.reset();
  }
}

export const analyticsService = AnalyticsService.getInstance();
export const analytics = analyticsService;
