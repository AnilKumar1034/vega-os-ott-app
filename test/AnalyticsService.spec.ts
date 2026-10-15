import {
  AnalyticsService,
  AnalyticsEvent,
  AnalyticsContextManager,
} from '../src/analytics';

const mockLogEvent = jest.fn();
const mockSetUserId = jest.fn().mockResolvedValue(undefined);
const mockSetUserProperties = jest.fn().mockResolvedValue(undefined);
const mockIsSupported = jest.fn();
const mockGetAnalytics = jest.fn();
const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn();
const mockGetApp = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

jest.mock('firebase/analytics', () => ({
  isSupported: () => mockIsSupported(),
  getAnalytics: (...args: unknown[]) => mockGetAnalytics(...args),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  setUserId: (...args: unknown[]) => mockSetUserId(...args),
  setUserProperties: (...args: unknown[]) => mockSetUserProperties(...args),
}));

describe('AnalyticsService (Day 1 Analytics Foundation)', () => {
  let analytics: AnalyticsService;
  let contextManager: AnalyticsContextManager;
  const mockFirebaseInstance = {app: {name: '[DEFAULT]'}};

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});
    mockGetApp.mockReturnValue({name: '[DEFAULT]'});
    mockIsSupported.mockResolvedValue(true);
    mockGetAnalytics.mockReturnValue(mockFirebaseInstance);
    mockLogEvent.mockResolvedValue(undefined);
    mockSetUserId.mockResolvedValue(undefined);
    mockSetUserProperties.mockResolvedValue(undefined);

    contextManager = new AnalyticsContextManager();
    analytics = new AnalyticsService(contextManager);
  });

  describe('1. initialize() and duplicate initialization', () => {
    it('initializes only once and does not initialize Firebase repeatedly', async () => {
      await analytics.initialize();
      expect(analytics.isInitialized()).toBe(true);
      expect(analytics.isFirebaseSupported()).toBe(true);
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      expect(mockIsSupported).toHaveBeenCalledTimes(1);
      expect(mockGetAnalytics).toHaveBeenCalledTimes(1);

      // Call initialize a second time
      await analytics.initialize();
      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
      expect(mockIsSupported).toHaveBeenCalledTimes(1);
      expect(mockGetAnalytics).toHaveBeenCalledTimes(1);
    });

    it('reuses existing Firebase App if already initialized', async () => {
      mockGetApps.mockReturnValue([{name: '[DEFAULT]'}]);
      await analytics.initialize();

      expect(mockInitializeApp).not.toHaveBeenCalled();
      expect(mockGetApp).toHaveBeenCalledTimes(1);
      expect(mockGetAnalytics).toHaveBeenCalledTimes(1);
    });

    it('runs safely in fallback mode if isSupported resolves to false', async () => {
      mockIsSupported.mockResolvedValue(false);
      await analytics.initialize();

      expect(analytics.isInitialized()).toBe(true);
      expect(analytics.isFirebaseSupported()).toBe(false);
      expect(mockGetAnalytics).not.toHaveBeenCalled();

      // Tracking should still work safely without error
      await expect(
        analytics.track(AnalyticsEvent.APP_OPEN),
      ).resolves.not.toThrow();
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('does not crash if Firebase initialization throws an error', async () => {
      mockInitializeApp.mockImplementation(() => {
        throw new Error('Firebase init crashed');
      });

      await expect(analytics.initialize()).resolves.not.toThrow();
      expect(analytics.isInitialized()).toBe(true);
      expect(analytics.isFirebaseSupported()).toBe(false);
    });
  });

  describe('2. track() and error handling', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('sends valid event with safe global context to Firebase Analytics', async () => {
      await analytics.track(AnalyticsEvent.SCREEN_VIEW, {screen_name: 'Home'});

      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      const [receivedInstance, receivedEvent, receivedPayload] =
        mockLogEvent.mock.calls[0];

      expect(receivedInstance).toBe(mockFirebaseInstance);
      expect(receivedEvent).toBe(AnalyticsEvent.SCREEN_VIEW);
      expect(receivedPayload).toMatchObject({
        screen_name: 'Home',
        platform: expect.any(String),
        deviceType: expect.any(String),
        appVersion: expect.any(String),
      });
    });

    it('does not crash if Firebase logEvent fails synchronously', async () => {
      mockLogEvent.mockImplementationOnce(() => {
        throw new Error('Network disconnected or quota exceeded');
      });

      await expect(
        analytics.track(AnalyticsEvent.APP_OPEN),
      ).resolves.not.toThrow();
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
    });

    it('does not crash if Firebase logEvent rejects asynchronously', async () => {
      mockLogEvent.mockReturnValueOnce(
        Promise.reject(new Error('Async rejection')),
      );

      await expect(
        analytics.track(AnalyticsEvent.APP_OPEN),
      ).resolves.not.toThrow();
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
    });

    it('filters out sensitive PII keys (email, password, tokens, credentials, pin)', async () => {
      await analytics.track(AnalyticsEvent.SCREEN_VIEW, {
        screen_name: 'Profile',
        email: 'user@example.com',
        userPassword: 'secretPassword123',
        authToken: 'jwt.token.abc',
        idToken: 'firebase-id-token',
        pin: '1234',
        safeParam: 'allowed_value',
      });

      const payload = mockLogEvent.mock.calls[0][2];
      expect(payload.safeParam).toBe('allowed_value');
      expect(payload.email).toBeUndefined();
      expect(payload.userPassword).toBeUndefined();
      expect(payload.authToken).toBeUndefined();
      expect(payload.idToken).toBeUndefined();
      expect(payload.pin).toBeUndefined();
    });
  });

  describe('3. User context management (setUser, reset)', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('stores user context and updates Firebase setUserId', () => {
      analytics.setUser({userId: 'user_xyz_789'});

      expect(analytics.getContext().userId).toBe('user_xyz_789');
      expect(mockSetUserId).toHaveBeenCalledWith(
        mockFirebaseInstance,
        'user_xyz_789',
      );
    });

    it('clears user context when setUser(null) is called', () => {
      analytics.setUser({userId: 'user_xyz_789'});
      expect(analytics.getContext().userId).toBe('user_xyz_789');

      analytics.setUser(null);
      expect(analytics.getContext().userId).toBeUndefined();
      expect(mockSetUserId).toHaveBeenCalledWith(mockFirebaseInstance, null);
    });

    it('reset() clears user and profile context while preserving device/app info', () => {
      analytics.setUser({userId: 'user_xyz_789'});
      analytics.setProfile({profileId: 'profile_1', profileType: 'adult'});

      expect(analytics.getContext().userId).toBe('user_xyz_789');
      expect(analytics.getContext().profileId).toBe('profile_1');

      analytics.reset();

      const context = analytics.getContext();
      expect(context.userId).toBeUndefined();
      expect(context.profileId).toBeUndefined();
      expect(context.profileType).toBeUndefined();
      expect(context.platform).toBeDefined();
      expect(context.deviceType).toBeDefined();
      expect(context.appVersion).toBeDefined();

      expect(mockSetUserId).toHaveBeenCalledWith(mockFirebaseInstance, null);
      expect(mockSetUserProperties).toHaveBeenCalledWith(mockFirebaseInstance, {
        profile_id: null,
        profile_type: null,
      });
    });
  });

  describe('4. Profile context management (setProfile, trackProfileSelected)', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('stores profile context and calls setUserProperties', () => {
      analytics.setProfile({profileId: 'prof_kids_1', profileType: 'kids'});

      const context = analytics.getContext();
      expect(context.profileId).toBe('prof_kids_1');
      expect(context.profileType).toBe('kids');

      expect(mockSetUserProperties).toHaveBeenCalledWith(mockFirebaseInstance, {
        profile_id: 'prof_kids_1',
        profile_type: 'kids',
      });
    });

    it('trackProfileSelected() updates profile context and logs profile_selected event', async () => {
      await analytics.trackProfileSelected({
        profileId: 'prof_adult_2',
        profileType: 'adult',
      });

      expect(analytics.getContext().profileId).toBe('prof_adult_2');
      expect(analytics.getContext().profileType).toBe('adult');

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PROFILE_SELECTED,
        expect.objectContaining({
          profileId: 'prof_adult_2',
          profileType: 'adult',
        }),
      );
    });

    it('trackProfileCreated() logs profile_created event without personal data', async () => {
      await analytics.trackProfileCreated({
        profile_type: 'kids',
        is_kids_profile: true,
        creation_source: 'create_profile',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PROFILE_CREATED,
        expect.objectContaining({
          profile_type: 'kids',
          is_kids_profile: true,
          creation_source: 'create_profile',
        }),
      );
      // Ensure no PII was leaked
      const callArgs = mockLogEvent.mock.calls[mockLogEvent.mock.calls.length - 1][2];
      expect(callArgs.email).toBeUndefined();
      expect(callArgs.name).toBeUndefined();
      expect(callArgs.profilename).toBeUndefined();
    });

    it('trackProfileSwitched() logs profile_switched event with previous and new types', async () => {
      await analytics.trackProfileSwitched({
        previous_profile_type: 'adult',
        new_profile_type: 'kids',
        switch_source: 'profile_picker',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PROFILE_SWITCHED,
        expect.objectContaining({
          previous_profile_type: 'adult',
          new_profile_type: 'kids',
          switch_source: 'profile_picker',
        }),
      );
    });

    it('trackProfileDeleted() logs profile_deleted event with was_active_profile', async () => {
      await analytics.trackProfileDeleted({
        deleted_profile_type: 'adult',
        was_active_profile: true,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PROFILE_DELETED,
        expect.objectContaining({
          deleted_profile_type: 'adult',
          was_active_profile: true,
        }),
      );
    });

    it('trackProfileEditCompleted() logs profile_edit_completed event', async () => {
      await analytics.trackProfileEditCompleted({
        profile_type: 'adult',
        is_kids_profile: false,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PROFILE_EDIT_COMPLETED,
        expect.objectContaining({
          profile_type: 'adult',
          is_kids_profile: false,
        }),
      );
    });
  });

  describe('5. trackScreen()', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('generates screen_view event correctly', async () => {
      await analytics.trackScreen('Movies', {category: 'action'});

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.SCREEN_VIEW,
        expect.objectContaining({
          screen_name: 'Movies',
          category: 'action',
        }),
      );
    });

    it('safely handles empty or invalid screenName', async () => {
      await expect(analytics.trackScreen('')).resolves.not.toThrow();
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('generates screen_view with trackScreenView and maintains screen state', async () => {
      analytics.resetScreenTracking();
      await analytics.trackScreenView({
        screen_name: 'Home',
        screen_class: 'HomeScreen',
        navigation_source: 'initial_launch',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.SCREEN_VIEW,
        expect.objectContaining({
          screen_name: 'Home',
          screen_class: 'HomeScreen',
          navigation_source: 'initial_launch',
        }),
      );

      expect(analytics.getCurrentScreen()).toBe('Home');
      expect(analytics.getPreviousScreen()).toBeNull();

      // Navigating to Movies
      await analytics.trackScreenView({
        screen_name: 'Movies',
        navigation_source: 'user_action',
      });

      expect(analytics.getCurrentScreen()).toBe('Movies');
      expect(analytics.getPreviousScreen()).toBe('Home');
      expect(mockLogEvent).toHaveBeenLastCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.SCREEN_VIEW,
        expect.objectContaining({
          screen_name: 'Movies',
          screen_class: 'MoviesScreen',
          previous_screen: 'Home',
          navigation_source: 'user_action',
        }),
      );
    });

    it('deduplicates identical screen calls to the active screen', async () => {
      analytics.resetScreenTracking();
      await analytics.trackScreenView({
        screen_name: 'LiveTV',
      });
      expect(mockLogEvent).toHaveBeenCalledTimes(1);

      // Same screen call
      await analytics.trackScreenView({
        screen_name: 'LiveTV',
      });
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
    });

    it('filters out sensitive parameters from screen_view', async () => {
      await analytics.trackScreenView({
        screen_name: 'Search',
        q: 'batman',
        query: 'batman',
        user_password: 'secret',
      });

      const call = mockLogEvent.mock.calls[mockLogEvent.mock.calls.length - 1];
      const payload = call[2];
      expect(payload.q).toBeUndefined();
      expect(payload.query).toBeUndefined();
      expect(payload.user_password).toBeUndefined();
    });
  });

  describe('6. trackAppOpen() and session deduplication', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('tracks app_open only once and ignores duplicate calls during the same session', async () => {
      await analytics.trackAppOpen();
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.APP_OPEN,
        expect.any(Object),
      );

      // Second call during same session
      await analytics.trackAppOpen();
      expect(mockLogEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Development logging', () => {
    let originalDev: unknown;
    let consoleLogSpy: jest.SpyInstance;

    beforeEach(async () => {
      originalDev = (globalThis as unknown as {__DEV__: boolean}).__DEV__;
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await analytics.initialize();
    });

    afterEach(() => {
      (globalThis as unknown as {__DEV__: unknown}).__DEV__ = originalDev;
      consoleLogSpy.mockRestore();
    });

    it('logs to console when __DEV__ is true', async () => {
      (globalThis as unknown as {__DEV__: boolean}).__DEV__ = true;
      await analytics.track(AnalyticsEvent.SCREEN_VIEW, {screen_name: 'Home'});

      const analyticsCall = consoleLogSpy.mock.calls.find(call =>
        String(call[0]).includes('[Analytics] screen_view'),
      );
      expect(analyticsCall).toBeDefined();
    });

    it('does not log analytics payloads when __DEV__ is false', async () => {
      (globalThis as unknown as {__DEV__: boolean}).__DEV__ = false;
      consoleLogSpy.mockClear();

      await analytics.track(AnalyticsEvent.SCREEN_VIEW, {screen_name: 'Home'});

      const analyticsCall = consoleLogSpy.mock.calls.find(call =>
        String(call[0]).includes('[Analytics] screen_view'),
      );
      expect(analyticsCall).toBeUndefined();
    });
  });

  describe('8. Custom context and setContext', () => {
    it('merges custom context safely', () => {
      analytics.setContext({
        platform: 'vega-os',
        deviceType: 'tv',
      });

      const context = analytics.getContext();
      expect(context.platform).toBe('vega-os');
      expect(context.deviceType).toBe('tv');
    });
  });

  describe('9. Google Analytics Measurement Protocol (Vega OS / REST dispatcher)', () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      });
      globalThis.fetch = mockFetch;
    });

    it('generates and persists a valid 32-character hexadecimal app_instance_id', async () => {
      const instanceId = await analytics.getOrCreateAppInstanceId();
      expect(instanceId).toBeDefined();
      expect(instanceId).toHaveLength(32);
      expect(/^[0-9a-f]{32}$/.test(instanceId)).toBe(true);

      // Subsequent call should return the exact same instance ID
      const secondCall = await analytics.getOrCreateAppInstanceId();
      expect(secondCall).toBe(instanceId);
    });

    it('dispatches events via Measurement Protocol REST API when Firebase Web SDK is not supported', async () => {
      mockIsSupported.mockResolvedValue(false);
      await analytics.initialize({measurementProtocolSecret: 'test_sec_123'});

      analytics.setUser({userId: 'usr_456'});
      analytics.setProfile({profileId: 'prof_789', profileType: 'adult'});

      await analytics.track(AnalyticsEvent.SCREEN_VIEW, {screen_name: 'Settings'});

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, requestInit] = mockFetch.mock.calls[0];

      expect(url).toContain('https://www.google-analytics.com/mp/collect');
      expect(url).toContain('firebase_app_id=1%3A52927278488%3Aandroid%3A19815cacd8ff3a67b84fed');
      expect(url).toContain('api_secret=test_sec_123');

      expect(requestInit.method).toBe('POST');
      expect(requestInit.headers).toEqual({'Content-Type': 'application/json'});

      const parsedBody = JSON.parse(requestInit.body);
      expect(parsedBody.app_instance_id).toHaveLength(32);
      expect(parsedBody.user_id).toBe('usr_456');
      expect(parsedBody.user_properties).toEqual({
        profile_id: {value: 'prof_789'},
        profile_type: {value: 'adult'},
      });
      expect(parsedBody.events).toEqual([
        {
          name: 'screen_view',
          params: expect.objectContaining({
            screen_name: 'Settings',
            platform: expect.any(String),
            deviceType: expect.any(String),
          }),
        },
      ]);
    });

    it('supports setting and getting measurementProtocolSecret dynamically', () => {
      analytics.setMeasurementProtocolSecret('custom_secret_key');
      expect(analytics.getMeasurementProtocolSecret()).toBe('custom_secret_key');
    });

    it('does not crash if Measurement Protocol fetch fails with a network exception', async () => {
      mockIsSupported.mockResolvedValue(false);
      await analytics.initialize();

      mockFetch.mockRejectedValueOnce(new Error('Network connection timeout'));

      await expect(
        analytics.track(AnalyticsEvent.APP_OPEN),
      ).resolves.not.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('10. Playback Startup & Buffering methods (Day 3 & Day 2)', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('tracks trackPlaybackStartRequested correctly', async () => {
      await analytics.trackPlaybackStartRequested({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        playbackType: 'vod',
        isLive: false,
        startPosition: 15,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PLAYBACK_START_REQUESTED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          playbackType: 'vod',
          isLive: false,
          startPosition: 15,
        }),
      );
    });

    it('ignores trackPlaybackStartRequested when required params are missing', async () => {
      await analytics.trackPlaybackStartRequested({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('tracks trackPlayerReady correctly', async () => {
      await analytics.trackPlayerReady({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        playbackType: 'vod',
        isLive: false,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.PLAYER_READY,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          playbackType: 'vod',
          isLive: false,
        }),
      );
    });

    it('ignores trackPlayerReady when required params are missing', async () => {
      await analytics.trackPlayerReady({contentId: 'movie_456'} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('tracks trackBufferStarted correctly', async () => {
      await analytics.trackBufferStarted({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        playbackType: 'vod',
        isLive: false,
        bufferCount: 1,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.BUFFER_STARTED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          playbackType: 'vod',
          isLive: false,
          bufferCount: 1,
        }),
      );
    });

    it('ignores trackBufferStarted when required params are missing', async () => {
      await analytics.trackBufferStarted({playbackSessionId: 'sess_123'} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('tracks trackBufferEnded correctly', async () => {
      await analytics.trackBufferEnded({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        bufferDurationMs: 1450,
        buffer_duration_ms: 1450,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.BUFFER_ENDED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          bufferDurationMs: 1450,
          buffer_duration_ms: 1450,
        }),
      );
    });

    it('ignores trackBufferEnded when required params are missing', async () => {
      await analytics.trackBufferEnded({bufferDurationMs: 500} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();
    });

    it('tracks trackFirstFrame correctly with startup_time_ms', async () => {
      await analytics.trackFirstFrame({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        playbackType: 'vod',
        isLive: false,
        timeToFirstFrameMs: 820,
        startup_time_ms: 820,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.FIRST_FRAME,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          timeToFirstFrameMs: 820,
          startup_time_ms: 820,
        }),
      );
    });
  });

  describe('11. Seek, Track Change & Video Quality/ABR methods (Day 4)', () => {
    beforeEach(async () => {
      await analytics.initialize();
    });

    it('tracks trackSeekStarted and ignores when required params missing', async () => {
      await analytics.trackSeekStarted({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackSeekStarted({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        seekStartPosition: 10,
        seek_start_position: 10,
        seekTargetPosition: 50,
        seek_target_position: 50,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.SEEK_STARTED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          seekStartPosition: 10,
          seekTargetPosition: 50,
        }),
      );
    });

    it('tracks trackSeekCompleted and ignores when required params missing', async () => {
      await analytics.trackSeekCompleted({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackSeekCompleted({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        seekStartPosition: 10,
        seekTargetPosition: 50,
        seekDurationMs: 400,
        seek_duration_ms: 400,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.SEEK_COMPLETED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          seekDurationMs: 400,
        }),
      );
    });

    it('tracks trackAudioTrackChanged and ignores when required params missing', async () => {
      await analytics.trackAudioTrackChanged({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackAudioTrackChanged({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        fromAudioTrackId: 'audio-en',
        toAudioTrackId: 'audio-es',
        toLanguage: 'es',
        toFormat: '5.1',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.AUDIO_TRACK_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          toAudioTrackId: 'audio-es',
          toLanguage: 'es',
        }),
      );
    });

    it('tracks trackSubtitleTrackChanged and ignores when required params missing', async () => {
      await analytics.trackSubtitleTrackChanged({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackSubtitleTrackChanged({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        toSubtitleTrackId: 'sub-fr',
        toLanguage: 'fr',
        isOff: false,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.SUBTITLE_TRACK_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          toSubtitleTrackId: 'sub-fr',
        }),
      );
    });

    it('tracks trackQualitySelected and ignores when required params missing', async () => {
      await analytics.trackQualitySelected({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackQualitySelected({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        qualityId: '1080p',
        qualityMode: 'manual',
        targetResolution: '1080p',
        targetBitrate: '5.0 Mbps',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.QUALITY_SELECTED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          qualityId: '1080p',
          qualityMode: 'manual',
        }),
      );
    });

    it('tracks trackBitrateChanged and ignores when required params missing', async () => {
      await analytics.trackBitrateChanged({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackBitrateChanged({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        toBitrate: 3500000,
        bitrateMbps: '3.5 Mbps',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.BITRATE_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          toBitrate: 3500000,
        }),
      );
    });

    it('tracks trackResolutionChanged and ignores when required params missing', async () => {
      await analytics.trackResolutionChanged({} as any);
      expect(mockLogEvent).not.toHaveBeenCalled();

      await analytics.trackResolutionChanged({
        playbackSessionId: 'sess_123',
        contentId: 'movie_456',
        toWidth: 1920,
        toHeight: 1080,
        resolutionBadge: '1080p',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        mockFirebaseInstance,
        AnalyticsEvent.RESOLUTION_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'sess_123',
          toWidth: 1920,
          toHeight: 1080,
        }),
      );
    });

    describe('12. Playback Lifecycle Completion & Error Analytics (Day 5)', () => {
      it('tracks trackPlaybackError and ignores when required params missing', async () => {
        await analytics.trackPlaybackError({} as any);
        expect(mockLogEvent).not.toHaveBeenCalled();

        await analytics.trackPlaybackError({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          errorCategory: 'DRM',
          errorCode: '6001',
          errorMessage: 'DRM license failed',
          isFatal: true,
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.PLAYBACK_ERROR,
          expect.objectContaining({
            playbackSessionId: 'sess_123',
            contentId: 'movie_456',
            errorCategory: 'DRM',
            errorCode: '6001',
            errorMessage: 'DRM license failed',
          }),
        );
      });

      it('tracks trackPlaybackPaused and trackPlaybackResumed correctly', async () => {
        await analytics.trackPlaybackPaused({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          position: 150,
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.PLAYBACK_PAUSED,
          expect.objectContaining({
            playbackSessionId: 'sess_123',
            position: 150,
          }),
        );

        await analytics.trackPlaybackResumed({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          position: 150,
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.PLAYBACK_RESUMED,
          expect.objectContaining({
            playbackSessionId: 'sess_123',
            position: 150,
          }),
        );
      });

      it('tracks trackContinueWatchingSelected correctly with safe params', async () => {
        await analytics.trackContinueWatchingSelected({
          content_id: 'kalki-2898',
          content_type: 'movie',
          saved_position_seconds: 1420,
          selection_source: 'continue_watching',
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.CONTINUE_WATCHING_SELECTED,
          expect.objectContaining({
            content_id: 'kalki-2898',
            content_type: 'movie',
            saved_position_seconds: 1420,
            selection_source: 'continue_watching',
          }),
        );
      });

      it('tracks trackResumePlayback correctly with positive position', async () => {
        await analytics.trackResumePlayback({
          playback_session_id: 'sess_cw_1',
          content_id: 'kalki-2898',
          content_type: 'movie',
          resume_position_seconds: 520,
          resume_source: 'continue_watching',
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.RESUME_PLAYBACK,
          expect.objectContaining({
            playback_session_id: 'sess_cw_1',
            content_id: 'kalki-2898',
            resume_position_seconds: 520,
            resume_source: 'continue_watching',
          }),
        );
      });

      it('does NOT track trackResumePlayback if position is zero or negative', async () => {
        await analytics.trackResumePlayback({
          playback_session_id: 'sess_cw_1',
          content_id: 'kalki-2898',
          resume_position_seconds: 0,
        });

        expect(mockLogEvent).not.toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.RESUME_PLAYBACK,
          expect.anything(),
        );
      });

      it('tracks trackPlaybackProgressSaved correctly', async () => {
        await analytics.trackPlaybackProgressSaved({
          playback_session_id: 'sess_cw_1',
          content_id: 'kalki-2898',
          content_type: 'movie',
          position_seconds: 600,
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.PLAYBACK_PROGRESS_SAVED,
          expect.objectContaining({
            playback_session_id: 'sess_cw_1',
            content_id: 'kalki-2898',
            position_seconds: 600,
          }),
        );
      });

      it('tracks canonical completed event and CONTENT_COMPLETED alias maps to completed', async () => {
        await analytics.trackPlaybackCompleted({
          playbackSessionId: 'sess_123',
          contentId: 'movie_456',
          duration: 3600,
        });

        expect(mockLogEvent).toHaveBeenCalledWith(
          mockFirebaseInstance,
          AnalyticsEvent.COMPLETED,
          expect.objectContaining({
            playbackSessionId: 'sess_123',
            contentId: 'movie_456',
            duration: 3600,
          }),
        );

        expect(AnalyticsEvent.CONTENT_COMPLETED).toBe('completed');
      });

      describe('Deep-link Analytics Events', () => {
        it('tracks deeplink_received with normalized privacy-safe parameters', async () => {
          await analytics.trackDeeplinkReceived({
            link_type: 'content',
            link_source: 'cold_start',
            app_state: 'cold_start',
          });

          expect(mockLogEvent).toHaveBeenCalledWith(
            mockFirebaseInstance,
            AnalyticsEvent.DEEPLINK_RECEIVED,
            expect.objectContaining({
              link_type: 'content',
              link_source: 'cold_start',
              app_state: 'cold_start',
            }),
          );
        });

        it('tracks deeplink_resolved with destination and resolution details', async () => {
          await analytics.trackDeeplinkResolved({
            destination_type: 'player',
            content_type: 'movie',
            resolution_source: 'deeplink_resolver',
          });

          expect(mockLogEvent).toHaveBeenCalledWith(
            mockFirebaseInstance,
            AnalyticsEvent.DEEPLINK_RESOLVED,
            expect.objectContaining({
              destination_type: 'player',
              content_type: 'movie',
              resolution_source: 'deeplink_resolver',
            }),
          );
        });

        it('tracks deeplink_failed with normalized failure stage and reason', async () => {
          await analytics.trackDeeplinkFailed({
            failure_stage: 'content_lookup',
            failure_reason: 'content_not_found',
            link_type: 'content',
          });

          expect(mockLogEvent).toHaveBeenCalledWith(
            mockFirebaseInstance,
            AnalyticsEvent.DEEPLINK_FAILED,
            expect.objectContaining({
              failure_stage: 'content_lookup',
              failure_reason: 'content_not_found',
              link_type: 'content',
            }),
          );
        });

        it('tracks deeplink_content_opened with open_source deeplink', async () => {
          await analytics.trackDeeplinkContentOpened({
            destination_type: 'player',
            content_type: 'movie',
            open_source: 'deeplink',
          });

          expect(mockLogEvent).toHaveBeenCalledWith(
            mockFirebaseInstance,
            AnalyticsEvent.DEEPLINK_CONTENT_OPENED,
            expect.objectContaining({
              destination_type: 'player',
              content_type: 'movie',
              open_source: 'deeplink',
            }),
          );
        });
      });
    });
  });
});
