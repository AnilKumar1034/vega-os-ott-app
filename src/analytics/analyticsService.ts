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
  AudioTrackChangedParams,
  BitrateChangedParams,
  BufferEndedParams,
  BufferStartedParams,
  FirstFrameParams,
  GoLiveParams,
  IAnalyticsService,
  LiveChannelChangedParams,
  LiveChannelSelectedParams,
  LivePlaybackStartedParams,
  PlaybackCompletedParams,
  PlaybackErrorParams,
  PlaybackPausedParams,
  PlaybackResumedParams,
  PlaybackStartRequestedParams,
  PlaybackStartedParams,
  PlaybackStoppedParams,
  PlayerReadyParams,
  ProfileSelectedEventParams,
  ProfileCreatedEventParams,
  ProfileSwitchedEventParams,
  ProfileDeletedEventParams,
  ProfileEditCompletedEventParams,
  QualitySelectedParams,
  ResolutionChangedParams,
  SeekCompletedParams,
  SeekStartedParams,
  SubtitleTrackChangedParams,
  EPGProgramSelectedParams,
  ContinueWatchingSelectedParams,
  ResumePlaybackParams,
  PlaybackProgressSavedParams,
  DeeplinkReceivedParams,
  DeeplinkResolvedParams,
  DeeplinkFailedParams,
  DeeplinkContentOpenedParams,
  WatchlistAddedParams,
  WatchlistRemovedParams,
  WatchlistItemSelectedParams,
  ScreenViewEventParams,
  ContentImpressionEventParams,
  ContentSelectedEventParams,
  ContentDetailsViewedEventParams,
  SearchPerformedEventParams,
  SearchResultSelectedEventParams,
  ContentCategorySelectedEventParams,
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

export const SCREEN_CLASS_MAP: Record<string, string> = {
  Splash: 'SplashScreen',
  Home: 'HomeScreen',
  Movies: 'MoviesScreen',
  LiveTV: 'LiveTVScreen',
  Search: 'SearchScreen',
  Details: 'DetailsScreen',
  MovieDetail: 'MovieDetailScreen',
  VideoPlayer: 'VideoPlayerScreen',
  PlayerTest: 'PlayerTestScreen',
  Settings: 'SettingsScreen',
  Profile: 'ProfileScreen',
  EditProfile: 'EditProfileScreen',
  ProfileSelection: 'ProfileSelectionScreen',
  CreateProfile: 'CreateProfileScreen',
  Login: 'LoginScreen',
  Register: 'RegisterScreen',
  MyList: 'MyListScreen',
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
  private currentScreenName: string | null = null;
  private previousScreenName: string | null = null;
  private lastTrackedScreenRouteKey: string | null = null;
  private lastChannelSelectedTime = 0;
  private lastSelectedChannelId: string | null = null;
  private lastChannelChange: {from: string; to: string; timestamp: number} | null = null;
  private lastEpgProgramKey: string | null = null;
  private lastEpgProgramTime = 0;
  private addedWatchlistItemsByProfile = new Map<string, Set<string>>();
  private removedWatchlistItemsByProfile = new Map<string, Set<string>>();
  private lastWatchlistActionTime = 0;
  private lastWatchlistActionKey: string | null = null;
  private lastWatchlistSelectedKey: string | null = null;
  private lastWatchlistSelectedTime = 0;
  private lastContentSelectedKey: string | null = null;
  private lastContentSelectedTime = 0;
  private lastContentDetailsViewedId: string | null = null;
  private trackedImpressionContentIds = new Set<string>();
  private lastSearchLength = -1;
  private lastSearchResultCount = -1;
  private lastSearchTime = 0;
  private lastSelectedCategory: string | null = null;
  private lastCategorySelectionTime = 0;
  private sessionStartTime: number = Math.floor(Date.now() / 1000);
  private lastEventTime: number = Date.now();

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
      this.lastChannelSelectedTime = 0;
      this.lastSelectedChannelId = null;
      this.lastChannelChange = null;
      this.lastEpgProgramKey = null;
      this.lastEpgProgramTime = 0;
      this.addedWatchlistItemsByProfile.clear();
      this.removedWatchlistItemsByProfile.clear();
      this.lastWatchlistActionTime = 0;
      this.lastWatchlistActionKey = null;
      this.lastWatchlistSelectedKey = null;
      this.lastWatchlistSelectedTime = 0;
      this.lastContentSelectedKey = null;
      this.lastContentSelectedTime = 0;
      this.lastContentDetailsViewedId = null;
      this.trackedImpressionContentIds.clear();
      this.lastSearchLength = -1;
      this.lastSearchResultCount = -1;
      this.lastSearchTime = 0;
      this.lastSelectedCategory = null;
      this.lastCategorySelectionTime = 0;
      this.resetScreenTracking();
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
   * Returns a valid integer session ID for GA4 (Unix timestamp in seconds).
   * Automatically starts a new session if inactivity exceeds 30 minutes.
   */
  public getSessionId(): number {
    const now = Date.now();
    // Standard GA4 session timeout: 30 minutes (1,800,000 ms) of inactivity
    if (now - this.lastEventTime > 30 * 60 * 1000) {
      this.sessionStartTime = Math.floor(now / 1000);
    }
    this.lastEventTime = now;
    return this.sessionStartTime;
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
      const sessionId = this.getSessionId();

      const eventParams: Record<string, unknown> = {
        ...payload,
        session_id:
          typeof payload.session_id === 'number'
            ? payload.session_id
            : sessionId,
        engagement_time_msec:
          typeof payload.engagement_time_msec === 'number' &&
          payload.engagement_time_msec > 0
            ? payload.engagement_time_msec
            : 100,
      };

      const body: Record<string, unknown> = {
        app_instance_id: appInstanceId,
        events: [
          {
            name: eventName,
            params: eventParams,
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

      const isTestEnv =
        typeof (globalThis as any).process !== 'undefined' &&
        (globalThis as any).process?.env?.NODE_ENV === 'test';

      if (typeof __DEV__ !== 'undefined' && __DEV__ && !isTestEnv) {
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
        const isTestEnv =
          typeof (globalThis as any).process !== 'undefined' &&
          (globalThis as any).process?.env?.NODE_ENV === 'test';
        if (typeof __DEV__ !== 'undefined' && __DEV__ && !isTestEnv) {
          console.warn(
            `[Analytics] track() called before initialize() for event: "${eventName}". Processing safely.`,
          );
        }
      }

      const payload = this.contextManager.buildEventPayload(
        params as Record<string, unknown> | undefined,
        eventName,
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

  public getCurrentScreen(): string | null {
    return this.currentScreenName;
  }

  public getPreviousScreen(): string | null {
    return this.previousScreenName;
  }

  public resetScreenTracking(): void {
    this.currentScreenName = null;
    this.previousScreenName = null;
    this.lastTrackedScreenRouteKey = null;
  }

  /**
   * Tracks screen navigation event (screen_view).
   * Validates screen name, normalizes screen class and navigation source,
   * dedupes redundant navigation to the active screen,
   * and sanitizes any sensitive parameters.
   */
  public async trackScreenView(
    params: ScreenViewEventParams,
  ): Promise<void> {
    try {
      if (!params || typeof params !== 'object') {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackScreenView called with invalid params.');
        }
        return;
      }

      const rawScreenName = params.screen_name || params.screenName;
      if (!rawScreenName || typeof rawScreenName !== 'string' || !rawScreenName.trim()) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackScreenView called with invalid screenName.');
        }
        return;
      }

      const screenName = rawScreenName.trim();
      const routeKey = (params.route_key || params.routeKey || screenName) as string;

      // Deduplication: prevent reporting duplicate screen views for re-renders or re-selecting current route
      const isSameRouteInstance =
        this.currentScreenName === screenName &&
        this.lastTrackedScreenRouteKey === routeKey &&
        !params.force;

      if (isSameRouteInstance) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(`[Analytics] Skipping duplicate screen_view for "${screenName}".`);
        }
        return;
      }

      const screenClass =
        (params.screen_class || params.screenClass) ??
        (SCREEN_CLASS_MAP[screenName] || `${screenName}Screen`);

      const previousScreen =
        'previous_screen' in params
          ? (params.previous_screen ?? undefined)
          : 'previousScreen' in params
          ? (params.previousScreen ?? undefined)
          : (this.currentScreenName || undefined);

      const navSource =
        params.navigation_source ||
        params.navigationSource ||
        (this.currentScreenName ? 'user_action' : 'initial_launch');

      // Sanitize extra parameters: strictly exclude any sensitive PII, queries, URLs, titles, etc.
      const sanitizedExtra: Record<string, unknown> = {};
      const knownKeys = new Set([
        'screen_name',
        'screenname',
        'screen_class',
        'screenclass',
        'firebase_screen',
        'firebasescreen',
        'firebase_screen_class',
        'firebasescreenclass',
        'page_title',
        'pagetitle',
        'item_id',
        'itemid',
        'item_name',
        'itemname',
        'video_title',
        'videotitle',
        'session_id',
        'engagement_time_msec',
        'previous_screen',
        'previousscreen',
        'navigation_source',
        'navigationsource',
        'source_screen',
        'sourcescreen',
        'content_id',
        'contentid',
        'content_type',
        'contenttype',
        'content_title',
        'contenttitle',
        'series_id',
        'seriesid',
        'episode_id',
        'episodeid',
        'route_key',
        'routekey',
        'force',
      ]);

      const disallowedSubstrings = [
        'url',
        'uri',
        'query',
        'search',
        'name',
        'profilename',
        'userid',
        'user_id',
        'profileid',
        'profile_id',
        'email',
        'password',
        'token',
        'auth',
        'secret',
        'credential',
        'pin',
        'phone',
      ];

      const disallowedExactKeys = new Set(['q', 'query', 'p', 'pwd', 'title']);

      for (const [key, value] of Object.entries(params)) {
        const lowerKey = key.toLowerCase();
        if (knownKeys.has(lowerKey)) {
          continue;
        }
        if (
          disallowedExactKeys.has(lowerKey) ||
          disallowedSubstrings.some(sub => lowerKey.includes(sub))
        ) {
          if (typeof __DEV__ !== 'undefined' && __DEV__) {
            console.warn(
              `[Analytics] Omitted disallowed parameter "${key}" from screen_view payload.`,
            );
          }
          continue;
        }
        sanitizedExtra[key] = value;
      }

      const sourceScreen = params.source_screen || params.sourceScreen;
      const contentId = params.content_id || params.contentId;
      const contentType = params.content_type || params.contentType;
      const rawTitle = params.content_title || params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;
      const seriesId = params.series_id || params.seriesId;
      const episodeId = params.episode_id || params.episodeId;

      const payload: ScreenViewEventParams = {
        screen_name: screenName,
        screen_class: screenClass as string,
        firebase_screen: screenName,
        firebase_screen_class: screenClass as string,
        page_title: screenName,
        ...(previousScreen ? {previous_screen: previousScreen} : {}),
        ...(navSource ? {navigation_source: navSource} : {}),
        ...(sourceScreen ? {source_screen: sourceScreen} : {}),
        ...(contentId ? {content_id: contentId, item_id: contentId} : {}),
        ...(contentType ? {content_type: contentType} : {}),
        ...(contentTitle ? {content_title: contentTitle, item_name: contentTitle} : {}),
        ...(seriesId ? {series_id: seriesId} : {}),
        ...(episodeId ? {episode_id: episodeId} : {}),
        ...sanitizedExtra,
      };

      // Update screen state
      this.previousScreenName = this.currentScreenName;
      this.currentScreenName = screenName;
      this.lastTrackedScreenRouteKey = routeKey;

      await this.track(AnalyticsEvent.SCREEN_VIEW, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackScreenView error:', err);
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
    return this.trackScreenView({
      screen_name: screenName,
      ...extraParams,
    });
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
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackProfileSelected called with invalid params.',
          );
        }
        return;
      }
      const pId = params.profileId || params.profile_id;
      const pType = params.profile_type || params.profileType || 'adult';
      const isKids =
        typeof params.is_kids_profile === 'boolean'
          ? params.is_kids_profile
          : typeof params.isKidsProfile === 'boolean'
          ? params.isKidsProfile
          : pType === 'kids';
      const source =
        (params.selection_source as string) ||
        (params.selectionSource as string) ||
        'profile_picker';

      if (pId) {
        this.setProfile({
          profileId: pId,
          profileType: pType,
        });
      }

      await this.track(AnalyticsEvent.PROFILE_SELECTED, {
        profile_type: pType,
        profileType: pType,
        is_kids_profile: isKids,
        selection_source: source,
        ...(pId ? {profileId: pId, profile_id: pId} : {}),
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackProfileSelected error:', err);
      }
    }
  }

  /**
   * Tracks profile creation event when a profile is successfully created.
   */
  public async trackProfileCreated(
    params: ProfileCreatedEventParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackProfileCreated called with missing params.',
          );
        }
        return;
      }
      const pType = params.profile_type || params.profileType || 'adult';
      const isKids =
        typeof params.is_kids_profile === 'boolean'
          ? params.is_kids_profile
          : typeof params.isKidsProfile === 'boolean'
          ? params.isKidsProfile
          : pType === 'kids';
      const source =
        (params.creation_source as string) ||
        (params.creationSource as string) ||
        'create_profile';

      await this.track(AnalyticsEvent.PROFILE_CREATED, {
        profile_type: pType,
        is_kids_profile: isKids,
        creation_source: source,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackProfileCreated error:', err);
      }
    }
  }

  /**
   * Tracks profile switched event when active profile changes to a different profile.
   */
  public async trackProfileSwitched(
    params: ProfileSwitchedEventParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackProfileSwitched called with missing params.',
          );
        }
        return;
      }
      const prevType =
        params.previous_profile_type || params.previousProfileType || 'adult';
      const newType =
        params.new_profile_type || params.newProfileType || 'adult';
      const source =
        (params.switch_source as string) ||
        (params.switchSource as string) ||
        'profile_picker';

      await this.track(AnalyticsEvent.PROFILE_SWITCHED, {
        previous_profile_type: prevType,
        new_profile_type: newType,
        switch_source: source,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackProfileSwitched error:', err);
      }
    }
  }

  /**
   * Tracks profile deleted event when a profile is successfully removed.
   */
  public async trackProfileDeleted(
    params: ProfileDeletedEventParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackProfileDeleted called with missing params.',
          );
        }
        return;
      }
      const deletedType =
        params.deleted_profile_type || params.deletedProfileType || 'adult';
      const wasActive =
        typeof params.was_active_profile === 'boolean'
          ? params.was_active_profile
          : typeof params.wasActiveProfile === 'boolean'
          ? params.wasActiveProfile
          : false;

      await this.track(AnalyticsEvent.PROFILE_DELETED, {
        deleted_profile_type: deletedType,
        was_active_profile: wasActive,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackProfileDeleted error:', err);
      }
    }
  }

  /**
   * Tracks profile edit completed event when a profile update succeeds.
   */
  public async trackProfileEditCompleted(
    params: ProfileEditCompletedEventParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackProfileEditCompleted called with missing params.',
          );
        }
        return;
      }
      const pType = params.profile_type || params.profileType || 'adult';
      const isKids =
        typeof params.is_kids_profile === 'boolean'
          ? params.is_kids_profile
          : typeof params.isKidsProfile === 'boolean'
          ? params.isKidsProfile
          : pType === 'kids';

      await this.track(AnalyticsEvent.PROFILE_EDIT_COMPLETED, {
        profile_type: pType,
        is_kids_profile: isKids,
      });
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackProfileEditCompleted error:', err);
      }
    }
  }

  /**
   * Tracks playback start requested event when app initiates playback.
   */
  public async trackPlaybackStartRequested(
    params: PlaybackStartRequestedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackStartRequested called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.PLAYBACK_START_REQUESTED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackStartRequested error:', err);
      }
    }
  }

  /**
   * Tracks player ready event when media is loaded / ready to begin playback.
   */
  public async trackPlayerReady(params: PlayerReadyParams): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlayerReady called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.PLAYER_READY, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlayerReady error:', err);
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
   * Tracks buffer started event when video enters buffering during playback.
   */
  public async trackBufferStarted(params: BufferStartedParams): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackBufferStarted called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.BUFFER_STARTED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackBufferStarted error:', err);
      }
    }
  }

  /**
   * Tracks buffer ended event when video resumes after buffering.
   */
  public async trackBufferEnded(params: BufferEndedParams): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackBufferEnded called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.BUFFER_ENDED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackBufferEnded error:', err);
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
      await this.track(AnalyticsEvent.PLAYBACK_PAUSED, params);
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
      await this.track(AnalyticsEvent.PLAYBACK_RESUMED, params);
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
      await this.track(AnalyticsEvent.PLAYBACK_STOPPED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackStopped error:', err);
      }
    }
  }

  /**
   * Tracks normalized playback error event when an error occurs during playback.
   */
  public async trackPlaybackError(
    params: PlaybackErrorParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackError called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.PLAYBACK_ERROR, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackError error:', err);
      }
    }
  }

  /**
   * Tracks seek started event.
   */
  public async trackSeekStarted(params: SeekStartedParams): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackSeekStarted called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.SEEK_STARTED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackSeekStarted error:', err);
      }
    }
  }

  /**
   * Tracks seek completed event.
   */
  public async trackSeekCompleted(params: SeekCompletedParams): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackSeekCompleted called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.SEEK_COMPLETED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackSeekCompleted error:', err);
      }
    }
  }

  /**
   * Tracks audio track change event.
   */
  public async trackAudioTrackChanged(
    params: AudioTrackChangedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId || !params.toAudioTrackId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackAudioTrackChanged called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.AUDIO_TRACK_CHANGED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackAudioTrackChanged error:', err);
      }
    }
  }

  /**
   * Tracks subtitle track change event.
   */
  public async trackSubtitleTrackChanged(
    params: SubtitleTrackChangedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId || !params.toSubtitleTrackId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackSubtitleTrackChanged called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.SUBTITLE_TRACK_CHANGED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackSubtitleTrackChanged error:', err);
      }
    }
  }

  /**
   * Tracks quality selection (Auto vs manual).
   */
  public async trackQualitySelected(
    params: QualitySelectedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId || !params.qualityId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackQualitySelected called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.QUALITY_SELECTED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackQualitySelected error:', err);
      }
    }
  }

  /**
   * Tracks bitrate change during playback (ABR / rendition switch).
   */
  public async trackBitrateChanged(
    params: BitrateChangedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId || params.toBitrate === undefined) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackBitrateChanged called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.BITRATE_CHANGED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackBitrateChanged error:', err);
      }
    }
  }

  /**
   * Tracks resolution change during playback (e.g. 720p -> 1080p).
   */
  public async trackResolutionChanged(
    params: ResolutionChangedParams,
  ): Promise<void> {
    try {
      if (!params || !params.playbackSessionId || !params.contentId || !params.toHeight) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackResolutionChanged called with missing required params.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.RESOLUTION_CHANGED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackResolutionChanged error:', err);
      }
    }
  }

  /**
   * Tracks explicit live channel selection by the user.
   * Guarded against D-pad focus movement and rapid debounce.
   */
  public async trackLiveChannelSelected(
    params: LiveChannelSelectedParams,
  ): Promise<void> {
    try {
      const channelId = params?.channel_id || params?.channelId;
      if (!channelId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackLiveChannelSelected called with missing channel_id.',
          );
        }
        return;
      }

      const now = Date.now();
      if (
        this.lastChannelSelectedTime &&
        this.lastSelectedChannelId === channelId &&
        now - this.lastChannelSelectedTime < 500
      ) {
        return; // debounce rapid double selection
      }
      this.lastChannelSelectedTime = now;
      this.lastSelectedChannelId = channelId;

      const payload: LiveChannelSelectedParams = {
        channel_id: channelId,
        channelId,
        channel_name: params.channel_name || params.channelName,
        channelName: params.channel_name || params.channelName,
        playback_session_id:
          params.playback_session_id || params.playbackSessionId,
        playbackSessionId:
          params.playback_session_id || params.playbackSessionId,
        selection_source:
          params.selection_source || params.selectionSource || 'unknown',
        selectionSource:
          params.selection_source || params.selectionSource || 'unknown',
      };

      await this.track(AnalyticsEvent.LIVE_CHANNEL_SELECTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackLiveChannelSelected error:', err);
      }
    }
  }

  /**
   * Tracks successful transition from one live channel to another.
   * Emitted only when the channel actually changes.
   * Guarded against repeated selection of current channel and duplicate callbacks.
   */
  public async trackLiveChannelChanged(
    params: LiveChannelChangedParams,
  ): Promise<void> {
    try {
      const channelId = params?.channel_id || params?.channelId;
      const previousChannelId =
        params?.previous_channel_id || params?.previousChannelId;

      if (!channelId || !previousChannelId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackLiveChannelChanged called with missing channel_id or previous_channel_id.',
          );
        }
        return;
      }

      // Do NOT emit if selected channel did not change
      if (channelId === previousChannelId) {
        return;
      }

      // Deduplicate duplicate callbacks for same channel transition
      if (
        this.lastChannelChange?.from === previousChannelId &&
        this.lastChannelChange?.to === channelId &&
        Date.now() - this.lastChannelChange.timestamp < 1000
      ) {
        return;
      }
      this.lastChannelChange = {
        from: previousChannelId,
        to: channelId,
        timestamp: Date.now(),
      };

      const payload: LiveChannelChangedParams = {
        previous_channel_id: previousChannelId,
        previousChannelId,
        channel_id: channelId,
        channelId,
        playback_session_id:
          params.playback_session_id || params.playbackSessionId,
        playbackSessionId:
          params.playback_session_id || params.playbackSessionId,
        change_source:
          params.change_source || params.changeSource || 'unknown',
        changeSource:
          params.change_source || params.changeSource || 'unknown',
      };

      await this.track(AnalyticsEvent.LIVE_CHANNEL_CHANGED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackLiveChannelChanged error:', err);
      }
    }
  }

  /**
   * Tracks explicit EPG program selection.
   * Does NOT fire on D-pad focus alone.
   * Deduplicates rapid selection / screen render callbacks.
   */
  public async trackEpgProgramSelected(
    params: EPGProgramSelectedParams,
  ): Promise<void> {
    try {
      const programId = params?.program_id || params?.programId;
      const channelId = params?.channel_id || params?.channelId || '';

      if (!channelId && !programId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackEpgProgramSelected called with missing channel_id and program_id.',
          );
        }
        return;
      }

      const key = `${channelId}_${programId || ''}`;
      const now = Date.now();
      if (
        this.lastEpgProgramKey === key &&
        now - this.lastEpgProgramTime < 500
      ) {
        return; // debounce rapid click/render
      }
      this.lastEpgProgramKey = key;
      this.lastEpgProgramTime = now;

      const payload: EPGProgramSelectedParams = {
        program_id: programId,
        programId,
        channel_id: channelId,
        channelId,
        program_start_time:
          params.program_start_time ?? params.programStartTime,
        programStartTime:
          params.program_start_time ?? params.programStartTime,
        program_end_time: params.program_end_time ?? params.programEndTime,
        programEndTime: params.program_end_time ?? params.programEndTime,
        selection_source: 'epg',
        selectionSource: 'epg',
      };

      await this.track(AnalyticsEvent.EPG_PROGRAM_SELECTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackEpgProgramSelected error:', err);
      }
    }
  }

  /**
   * Tracks explicit user action to Go Live.
   * Only emitted when user explicitly invokes Go Live; never on startup or automatic playback.
   */
  public async trackGoLive(params: GoLiveParams): Promise<void> {
    try {
      const channelId = params?.channel_id || params?.channelId;
      if (!channelId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackGoLive called with missing channel_id.');
        }
        return;
      }

      const payload: GoLiveParams = {
        channel_id: channelId,
        channelId,
        playback_session_id:
          params.playback_session_id || params.playbackSessionId,
        playbackSessionId:
          params.playback_session_id || params.playbackSessionId,
      };

      await this.track(AnalyticsEvent.GO_LIVE, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackGoLive error:', err);
      }
    }
  }

  /**
   * Track live playback start.
   * If existing playback_started event is already emitted, this avoids duplication.
   */
  public async trackLivePlaybackStarted(
    params: LivePlaybackStartedParams,
  ): Promise<void> {
    try {
      const channelId = params?.channel_id || params?.channelId;
      const sessionId =
        params?.playback_session_id || params?.playbackSessionId;

      if (!channelId || !sessionId) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackLivePlaybackStarted called with missing required params.',
          );
        }
        return;
      }

      const payload: LivePlaybackStartedParams = {
        channel_id: channelId,
        channelId,
        playback_session_id: sessionId,
        playbackSessionId: sessionId,
        time_to_first_frame_ms:
          params.time_to_first_frame_ms ?? params.timeToFirstFrameMs,
        timeToFirstFrameMs:
          params.time_to_first_frame_ms ?? params.timeToFirstFrameMs,
      };

      await this.track(AnalyticsEvent.LIVE_PLAYBACK_STARTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackLivePlaybackStarted error:', err);
      }
    }
  }

  /**
   * Tracks continue watching selected event when an item is selected from the Continue Watching section.
   */
  public async trackContinueWatchingSelected(
    params: ContinueWatchingSelectedParams,
  ): Promise<void> {
    try {
      if (!params || (!params.contentId && !params.content_id)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackContinueWatchingSelected called with missing content_id.',
          );
        }
        return;
      }
      const contentId = params.content_id || params.contentId || '';
      const payload: ContinueWatchingSelectedParams = {
        ...params,
        content_id: contentId,
        contentId,
        selection_source: 'continue_watching',
        selectionSource: 'continue_watching',
      };
      await this.track(AnalyticsEvent.CONTINUE_WATCHING_SELECTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackContinueWatchingSelected error:', err);
      }
    }
  }

  /**
   * Tracks resume playback event when playback genuinely resumes from an existing saved position.
   */
  public async trackResumePlayback(
    params: ResumePlaybackParams,
  ): Promise<void> {
    try {
      if (!params || (!params.contentId && !params.content_id)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackResumePlayback called with missing required content_id.',
          );
        }
        return;
      }
      const resumePos =
        typeof params.resume_position_seconds === 'number'
          ? params.resume_position_seconds
          : params.resumePositionSeconds;
      if (
        typeof resumePos !== 'number' ||
        resumePos <= 0 ||
        !Number.isFinite(resumePos)
      ) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackResumePlayback called with invalid resume_position_seconds <= 0.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.RESUME_PLAYBACK, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackResumePlayback error:', err);
      }
    }
  }

  /**
   * Tracks playback progress saved event when progress is confirmed saved to persistence layer.
   */
  public async trackPlaybackProgressSaved(
    params: PlaybackProgressSavedParams,
  ): Promise<void> {
    try {
      if (!params || (!params.contentId && !params.content_id)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn(
            '[Analytics] trackPlaybackProgressSaved called with missing required content_id.',
          );
        }
        return;
      }
      await this.track(AnalyticsEvent.PLAYBACK_PROGRESS_SAVED, params);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackPlaybackProgressSaved error:', err);
      }
    }
  }

  /**
   * Tracks deeplink received event when an incoming deep link is received by the application.
   * Strictly excludes raw URLs, query strings, auth tokens, or other sensitive parameters.
   */
  public async trackDeeplinkReceived(
    params: DeeplinkReceivedParams = {},
  ): Promise<void> {
    try {
      const linkType = params.link_type ?? params.linkType ?? 'unknown';
      const linkSource = params.link_source ?? params.linkSource ?? 'unknown';
      const appState = params.app_state ?? params.appState;

      const payload: Record<string, unknown> = {
        link_type: linkType,
        link_source: linkSource,
      };
      if (appState) {
        payload.app_state = appState;
      }

      await this.track(
        AnalyticsEvent.DEEPLINK_RECEIVED,
        payload as DeeplinkReceivedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackDeeplinkReceived error:', err);
      }
    }
  }

  /**
   * Tracks deeplink resolved event when the link is successfully parsed and mapped to a supported destination.
   */
  public async trackDeeplinkResolved(
    params: DeeplinkResolvedParams,
  ): Promise<void> {
    try {
      if (!params) {
        return;
      }
      const destinationType =
        params.destination_type ?? params.destinationType ?? 'unknown';
      const contentType = params.content_type ?? params.contentType;
      const resolutionSource =
        params.resolution_source ??
        params.resolutionSource ??
        'deeplink_resolver';

      const payload: Record<string, unknown> = {
        destination_type: destinationType,
        resolution_source: resolutionSource,
      };
      if (contentType) {
        payload.content_type = contentType;
      }

      await this.track(
        AnalyticsEvent.DEEPLINK_RESOLVED,
        payload as DeeplinkResolvedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackDeeplinkResolved error:', err);
      }
    }
  }

  /**
   * Tracks deeplink failed event when link parsing, validation, content lookup, or navigation preparation fails.
   * Normalized reason code only; strictly excludes URLs, tokens, or raw exception objects.
   */
  public async trackDeeplinkFailed(
    params: DeeplinkFailedParams,
  ): Promise<void> {
    try {
      if (!params) {
        return;
      }
      const failureStage =
        params.failure_stage ?? params.failureStage ?? 'parsing';
      const failureReason =
        params.failure_reason ?? params.failureReason ?? 'invalid_url';
      const linkType = params.link_type ?? params.linkType;

      const payload: Record<string, unknown> = {
        failure_stage: failureStage,
        failure_reason: failureReason,
      };
      if (linkType) {
        payload.link_type = linkType;
      }

      await this.track(
        AnalyticsEvent.DEEPLINK_FAILED,
        payload as DeeplinkFailedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackDeeplinkFailed error:', err);
      }
    }
  }

  /**
   * Tracks deeplink content opened event when the intended destination has actually opened successfully.
   */
  public async trackDeeplinkContentOpened(
    params: DeeplinkContentOpenedParams,
  ): Promise<void> {
    try {
      if (!params) {
        return;
      }
      const destinationType =
        params.destination_type ?? params.destinationType ?? 'unknown';
      const contentType = params.content_type ?? params.contentType;

      const payload: Record<string, unknown> = {
        destination_type: destinationType,
        open_source: 'deeplink',
      };
      if (contentType) {
        payload.content_type = contentType;
      }

      await this.track(
        AnalyticsEvent.DEEPLINK_CONTENT_OPENED,
        payload as DeeplinkContentOpenedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackDeeplinkContentOpened error:', err);
      }
    }
  }

  /**
   * Synchronizes known watchlist content IDs for a profile (e.g. on screen load).
   * Prevents false add events when an item is already present in the user's list.
   * Does NOT emit any analytics events.
   */
  public syncWatchlistState(profileId: string, contentIds: string[]): void {
    try {
      if (!profileId || !Array.isArray(contentIds)) {
        return;
      }
      this.addedWatchlistItemsByProfile.set(
        profileId,
        new Set(contentIds.filter(Boolean)),
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] syncWatchlistState error:', err);
      }
    }
  }

  /**
   * Tracks watchlist added event when content is successfully added to My List.
   * Emits ONLY after successful addition.
   * Ignores duplicates if item is already present in the active profile's list.
   * Strictly avoids PII, content titles, or full metadata.
   */
  public async trackWatchlistAdded(
    params: WatchlistAddedParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackWatchlistAdded called with missing params.');
        }
        return;
      }

      const pId =
        params.profile_id ??
        params.profileId ??
        this.contextManager.getContext().profileId ??
        'default';
      const contentId = params.content_id ?? params.contentId;
      const contentType = params.content_type ?? params.contentType ?? 'movie';
      const actionSource = params.action_source ?? params.actionSource ?? 'details';
      const listType = params.list_type ?? params.listType;
      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;
      const sourceScreen = params.source_screen ?? params.sourceScreen;
      const sourceComponent = params.source_component ?? params.sourceComponent;

      // Duplicate prevention: check if item is already present in this profile's watchlist
      let addedSet = this.addedWatchlistItemsByProfile.get(pId);
      if (!addedSet) {
        addedSet = new Set<string>();
        this.addedWatchlistItemsByProfile.set(pId, addedSet);
      }

      if (contentId && addedSet.has(contentId)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(
            `[Analytics] Watchlist item "${contentId}" is already present for profile "${pId}". Skipping duplicate watchlist_added.`,
          );
        }
        return;
      }

      // Debounce rapid duplicate invocations
      const actionKey = `add_${pId}_${contentId || contentType}`;
      const now = Date.now();
      if (
        this.lastWatchlistActionKey === actionKey &&
        now - this.lastWatchlistActionTime < 500
      ) {
        return;
      }
      this.lastWatchlistActionKey = actionKey;
      this.lastWatchlistActionTime = now;

      // Update tracking sets
      if (contentId) {
        addedSet.add(contentId);
        const removedSet = this.removedWatchlistItemsByProfile.get(pId);
        if (removedSet) {
          removedSet.delete(contentId);
        }
      }

      const payload: Record<string, unknown> = {
        content_type: contentType,
        action_source: actionSource,
        success: true,
      };
      if (listType) {
        payload.list_type = listType;
      }
      if (contentId) {
        payload.content_id = contentId;
        payload.item_id = contentId;
      }
      if (contentTitle) {
        payload.content_title = contentTitle;
        payload.item_name = contentTitle;
      }
      if (sourceScreen) {
        payload.source_screen = sourceScreen;
      }
      if (sourceComponent) {
        payload.source_component = sourceComponent;
      }

      await this.track(
        AnalyticsEvent.WATCHLIST_ADDED,
        payload as WatchlistAddedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackWatchlistAdded error:', err);
      }
    }
  }

  /**
   * Tracks watchlist removed event when content is successfully removed from My List.
   * Emits ONLY after successful removal.
   * Ignores duplicates if item was already removed or snapshot reflects same removal.
   */
  public async trackWatchlistRemoved(
    params: WatchlistRemovedParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackWatchlistRemoved called with missing params.');
        }
        return;
      }

      const pId =
        params.profile_id ??
        params.profileId ??
        this.contextManager.getContext().profileId ??
        'default';
      const contentId = params.content_id ?? params.contentId;
      const contentType = params.content_type ?? params.contentType ?? 'movie';
      const actionSource = params.action_source ?? params.actionSource ?? 'details';
      const listType = params.list_type ?? params.listType;
      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;
      const sourceScreen = params.source_screen ?? params.sourceScreen;
      const sourceComponent = params.source_component ?? params.sourceComponent;

      let removedSet = this.removedWatchlistItemsByProfile.get(pId);
      if (!removedSet) {
        removedSet = new Set<string>();
        this.removedWatchlistItemsByProfile.set(pId, removedSet);
      }

      if (contentId && removedSet.has(contentId)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.log(
            `[Analytics] Watchlist item "${contentId}" was already removed for profile "${pId}". Skipping duplicate watchlist_removed.`,
          );
        }
        return;
      }

      // Debounce rapid duplicate invocations
      const actionKey = `remove_${pId}_${contentId || contentType}`;
      const now = Date.now();
      if (
        this.lastWatchlistActionKey === actionKey &&
        now - this.lastWatchlistActionTime < 500
      ) {
        return;
      }
      this.lastWatchlistActionKey = actionKey;
      this.lastWatchlistActionTime = now;

      // Update tracking sets
      if (contentId) {
        removedSet.add(contentId);
        const addedSet = this.addedWatchlistItemsByProfile.get(pId);
        if (addedSet) {
          addedSet.delete(contentId);
        }
      }

      const payload: Record<string, unknown> = {
        content_type: contentType,
        action_source: actionSource,
        success: true,
      };
      if (listType) {
        payload.list_type = listType;
      }
      if (contentId) {
        payload.content_id = contentId;
        payload.item_id = contentId;
      }
      if (contentTitle) {
        payload.content_title = contentTitle;
        payload.item_name = contentTitle;
      }
      if (sourceScreen) {
        payload.source_screen = sourceScreen;
      }
      if (sourceComponent) {
        payload.source_component = sourceComponent;
      }

      await this.track(
        AnalyticsEvent.WATCHLIST_REMOVED,
        payload as WatchlistRemovedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackWatchlistRemoved error:', err);
      }
    }
  }

  /**
   * Tracks watchlist item selected event when user explicitly selects a saved item.
   * Never emits simply because an item is focused, rendered, or restored.
   */
  public async trackWatchlistItemSelected(
    params: WatchlistItemSelectedParams,
  ): Promise<void> {
    try {
      if (!params) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('[Analytics] trackWatchlistItemSelected called with missing params.');
        }
        return;
      }

      const pId =
        params.profile_id ??
        params.profileId ??
        this.contextManager.getContext().profileId ??
        'default';
      const contentId = params.content_id ?? params.contentId;
      const contentType = params.content_type ?? params.contentType ?? 'movie';
      const destinationType =
        params.destination_type ?? params.destinationType ?? 'details';
      const selectionSource =
        params.selection_source ?? params.selectionSource ?? 'watchlist';
      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;
      const sourceScreen = params.source_screen ?? params.sourceScreen;
      const sourceComponent = params.source_component ?? params.sourceComponent;

      // Debounce rapid duplicate selections
      const key = `${pId}_${contentId || ''}_${destinationType}`;
      const now = Date.now();
      if (
        this.lastWatchlistSelectedKey === key &&
        now - this.lastWatchlistSelectedTime < 500
      ) {
        return;
      }
      this.lastWatchlistSelectedKey = key;
      this.lastWatchlistSelectedTime = now;

      const payload: Record<string, unknown> = {
        content_type: contentType,
        destination_type: destinationType,
        selection_source: selectionSource,
      };
      if (contentId) {
        payload.content_id = contentId;
        payload.item_id = contentId;
      }
      if (contentTitle) {
        payload.content_title = contentTitle;
        payload.item_name = contentTitle;
      }
      if (sourceScreen) {
        payload.source_screen = sourceScreen;
      }
      if (sourceComponent) {
        payload.source_component = sourceComponent;
      }

      await this.track(
        AnalyticsEvent.WATCHLIST_ITEM_SELECTED,
        payload as WatchlistItemSelectedParams,
      );
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackWatchlistItemSelected error:', err);
      }
    }
  }

  /**
   * Tracks content impression when a movie/show tile becomes active in hero carousel or receives TV D-pad focus.
   * Deduplicated per content item per session/screen visit to avoid high frequency impression firing.
   */
  public async trackContentImpression(
    params: ContentImpressionEventParams,
  ): Promise<void> {
    try {
      if (!params || (!params.content_id && !params.contentId)) {
        return;
      }
      const contentId = (params.content_id || params.contentId) as string;
      if (this.trackedImpressionContentIds.has(contentId)) {
        return;
      }
      this.trackedImpressionContentIds.add(contentId);

      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;

      const payload: ContentImpressionEventParams = {
        content_id: contentId,
        item_id: contentId,
        ...(params.content_type || params.contentType
          ? {content_type: params.content_type || params.contentType}
          : {}),
        ...(contentTitle
          ? {content_title: contentTitle, item_name: contentTitle}
          : {}),
        ...(params.source_screen || params.sourceScreen
          ? {source_screen: params.source_screen || params.sourceScreen}
          : {}),
        ...(params.source_component || params.sourceComponent
          ? {source_component: params.source_component || params.sourceComponent}
          : {}),
      };

      await this.track(AnalyticsEvent.CONTENT_IMPRESSION, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackContentImpression error:', err);
      }
    }
  }

  /**
   * Tracks explicit content selection (opening details, clicking hero play, pressing play on card).
   * Debounces rapid duplicate selections within 500ms.
   */
  public async trackContentSelected(
    params: ContentSelectedEventParams,
  ): Promise<void> {
    try {
      if (!params || (!params.content_id && !params.contentId)) {
        return;
      }
      const contentId = (params.content_id || params.contentId) as string;
      const actionName = (params.action_name || params.actionName || 'open_details') as string;
      const selectionKey = `${contentId}_${actionName}`;
      const now = Date.now();
      if (
        this.lastContentSelectedKey === selectionKey &&
        now - this.lastContentSelectedTime < 500
      ) {
        return;
      }
      this.lastContentSelectedKey = selectionKey;
      this.lastContentSelectedTime = now;

      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;

      const payload: ContentSelectedEventParams = {
        content_id: contentId,
        content_type: params.content_type || params.contentType || 'movie',
        action_name: actionName,
        item_id: contentId,
        ...(contentTitle
          ? {content_title: contentTitle, item_name: contentTitle}
          : {}),
        ...(params.source_screen || params.sourceScreen
          ? {source_screen: params.source_screen || params.sourceScreen}
          : {}),
        ...(params.source_component || params.sourceComponent
          ? {source_component: params.source_component || params.sourceComponent}
          : {}),
        ...(params.destination_screen || params.destinationScreen
          ? {destination_screen: params.destination_screen || params.destinationScreen}
          : {}),
        ...(params.series_id || params.seriesId
          ? {series_id: params.series_id || params.seriesId}
          : {}),
        ...(params.episode_id || params.episodeId
          ? {episode_id: params.episode_id || params.episodeId}
          : {}),
      };

      await this.track(AnalyticsEvent.CONTENT_SELECTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackContentSelected error:', err);
      }
    }
  }

  /**
   * Tracks content details viewed when the details screen successfully opens for an individual title.
   * Prevents duplicate reporting for the same title on re-renders.
   */
  public async trackContentDetailsViewed(
    params: ContentDetailsViewedEventParams,
  ): Promise<void> {
    try {
      if (!params || (!params.content_id && !params.contentId)) {
        return;
      }
      const contentId = (params.content_id || params.contentId) as string;
      if (this.lastContentDetailsViewedId === contentId) {
        return;
      }
      this.lastContentDetailsViewedId = contentId;

      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;

      const payload: ContentDetailsViewedEventParams = {
        content_id: contentId,
        content_type: params.content_type || params.contentType || 'movie',
        item_id: contentId,
        ...(contentTitle
          ? {content_title: contentTitle, item_name: contentTitle}
          : {}),
        ...(params.source_screen || params.sourceScreen
          ? {source_screen: params.source_screen || params.sourceScreen}
          : {}),
        ...(params.source_component || params.sourceComponent
          ? {source_component: params.source_component || params.sourceComponent}
          : {}),
      };

      await this.track(AnalyticsEvent.CONTENT_DETAILS_VIEWED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackContentDetailsViewed error:', err);
      }
    }
  }

  /**
   * Tracks search performed metrics (result count, search term length, has results).
   * Strictly avoids logging raw search query text or PII.
   * Debounces identical rapid query submissions within 1000ms.
   */
  public async trackSearchPerformed(
    params: SearchPerformedEventParams,
  ): Promise<void> {
    try {
      if (!params) {
        return;
      }
      const termLength =
        params.search_term_length ?? params.searchTermLength ?? 0;
      const resultCount =
        params.result_count ?? params.resultCount ?? 0;
      const hasResults =
        params.has_results ?? params.hasResults ?? resultCount > 0;
      const sourceScreen =
        params.source_screen || params.sourceScreen || 'search';

      const now = Date.now();
      if (
        this.lastSearchLength === termLength &&
        this.lastSearchResultCount === resultCount &&
        now - this.lastSearchTime < 1000
      ) {
        return;
      }
      this.lastSearchLength = termLength;
      this.lastSearchResultCount = resultCount;
      this.lastSearchTime = now;

      const payload: SearchPerformedEventParams = {
        search_term_length: termLength,
        has_results: hasResults,
        result_count: resultCount,
        source_screen: sourceScreen,
      };

      await this.track(AnalyticsEvent.SEARCH_PERFORMED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackSearchPerformed error:', err);
      }
    }
  }

  /**
   * Tracks when a user selects a search result item from the search results list.
   */
  public async trackSearchResultSelected(
    params: SearchResultSelectedEventParams,
  ): Promise<void> {
    try {
      if (!params || (!params.content_id && !params.contentId)) {
        return;
      }
      const contentId = (params.content_id || params.contentId) as string;
      const rawTitle = params.content_title ?? params.contentTitle;
      const contentTitle =
        typeof rawTitle === 'string' && rawTitle.length > 100
          ? rawTitle.substring(0, 100)
          : rawTitle;

      const payload: SearchResultSelectedEventParams = {
        content_id: contentId,
        content_type: params.content_type || params.contentType || 'movie',
        item_id: contentId,
        ...(contentTitle
          ? {content_title: contentTitle, item_name: contentTitle}
          : {}),
        source_screen: 'search',
        source_component: 'search_results',
        destination_screen:
          params.destination_screen || params.destinationScreen || 'MovieDetail',
      };

      await this.track(AnalyticsEvent.SEARCH_RESULT_SELECTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackSearchResultSelected error:', err);
      }
    }
  }

  /**
   * Tracks user selection of a content category or genre filter.
   */
  public async trackContentCategorySelected(
    params: ContentCategorySelectedEventParams,
  ): Promise<void> {
    try {
      if (!params || (!params.category_name && !params.categoryName)) {
        return;
      }
      const categoryName = (params.category_name || params.categoryName) as string;
      const now = Date.now();
      if (
        this.lastSelectedCategory === categoryName &&
        now - this.lastCategorySelectionTime < 500
      ) {
        return;
      }
      this.lastSelectedCategory = categoryName;
      this.lastCategorySelectionTime = now;

      const payload: ContentCategorySelectedEventParams = {
        category_name: categoryName,
        source_screen: params.source_screen || params.sourceScreen || 'LiveTV',
        ...(params.source_component || params.sourceComponent
          ? {source_component: params.source_component || params.sourceComponent}
          : {}),
        ...(params.action_name || params.actionName
          ? {action_name: params.action_name || params.actionName}
          : {}),
      };

      await this.track(AnalyticsEvent.CONTENT_CATEGORY_SELECTED, payload);
    } catch (err) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[Analytics] trackContentCategorySelected error:', err);
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
    this.lastChannelSelectedTime = 0;
    this.lastSelectedChannelId = null;
    this.lastChannelChange = null;
    this.lastEpgProgramKey = null;
    this.lastEpgProgramTime = 0;
    this.addedWatchlistItemsByProfile.clear();
    this.removedWatchlistItemsByProfile.clear();
    this.lastWatchlistActionTime = 0;
    this.lastWatchlistActionKey = null;
    this.lastWatchlistSelectedKey = null;
    this.lastWatchlistSelectedTime = 0;
    this.lastContentSelectedKey = null;
    this.lastContentSelectedTime = 0;
    this.lastContentDetailsViewedId = null;
    this.trackedImpressionContentIds.clear();
    this.lastSearchLength = -1;
    this.lastSearchResultCount = -1;
    this.lastSearchTime = 0;
    this.lastSelectedCategory = null;
    this.lastCategorySelectionTime = 0;
    this.contextManager.reset();
  }
}

export const analyticsService = AnalyticsService.getInstance();
export const analytics = analyticsService;
