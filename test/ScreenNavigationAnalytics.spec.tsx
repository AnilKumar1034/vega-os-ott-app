import React from 'react';
import {render, act, fireEvent} from '@testing-library/react-native';

const mockLogEvent = jest.fn();
const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn();
const mockGetApp = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

jest.mock('firebase/analytics', () => ({
  isSupported: jest.fn().mockResolvedValue(true),
  getAnalytics: jest.fn().mockReturnValue({app: {name: '[DEFAULT]'}}),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  setUserId: jest.fn().mockResolvedValue(undefined),
  setUserProperties: jest.fn().mockResolvedValue(undefined),
}));

const mockStorage = new Map<string, string>();
jest.mock(
  '@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native',
  () => ({
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        mockStorage.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        mockStorage.delete(key);
      }),
    },
  }),
);

import {
  analyticsService,
  AnalyticsService,
  AnalyticsEvent,
} from '../src/analytics';
import {
  ScreenNavigationTracker,
  screenNavigationTracker,
  getActiveRouteInfo,
  SCREEN_CLASS_MAP,
} from '../src/navigation/navigationAnalytics';
import {Routes} from '../src/constants/routes';
import {deeplinkManager} from '../src/utils/deeplink';
import {App} from '../src/App';
import {SPLASH_DURATION} from '../src/screens/SplashScreen';

describe('Day 11 — Screen Navigation Analytics (LogiXstream)', () => {
  let tracker: ScreenNavigationTracker;
  let mockAnalytics: AnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});

    mockAnalytics = new AnalyticsService();
    mockAnalytics.setUser(null);
    mockAnalytics.setProfile(null);
    tracker = new ScreenNavigationTracker(mockAnalytics, deeplinkManager);
    screenNavigationTracker.reset();
    deeplinkManager.resetForTesting();
  });

  afterEach(() => {
    tracker.reset();
    screenNavigationTracker.reset();
    deeplinkManager.resetForTesting();
  });

  describe('1. Initial navigation emits the expected screen-view event once', () => {
    it('emits screen_view event once on initial cold-start launch without previous_screen', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      await tracker.handleRoute(
        {name: Routes.Splash, key: 'Splash-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          screen_name: Routes.Splash,
          screen_class: 'SplashScreen',
          navigation_source: 'initial_launch',
          previous_screen: undefined,
        }),
      );

      // Verify previous_screen is not populated for initial launch
      const lastCallParams = trackSpy.mock.calls[0][0];
      expect(lastCallParams.previous_screen).toBeUndefined();
    });

    it('does not emit duplicate event if initial route re-reports before transition', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      await tracker.handleRoute(
        {name: Routes.Splash, key: 'Splash-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      // Duplicate report for the exact same route key
      await tracker.handleRoute(
        {name: Routes.Splash, key: 'Splash-1'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Navigating to another screen emits the correct event', () => {
    it('emits screen_view with correct screen_name, screen_class, and previous_screen', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      // 1. Initial on Splash
      await tracker.handleRoute(
        {name: Routes.Splash, key: 'Splash-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      // 2. Transition to Home
      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-2'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(2);
      expect(trackSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          screen_name: Routes.Home,
          screen_class: 'HomeScreen',
          previous_screen: Routes.Splash,
          navigation_source: 'user_action',
        }),
      );

      // 3. Transition to Movies
      await tracker.handleRoute(
        {name: Routes.Movies, key: 'Movies-3'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(3);
      expect(trackSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          screen_name: Routes.Movies,
          screen_class: 'MoviesScreen',
          previous_screen: Routes.Home,
          navigation_source: 'user_action',
        }),
      );
    });

    it('maps all app routes to standard normalized screen_class', () => {
      for (const [routeName, expectedClass] of Object.entries(SCREEN_CLASS_MAP)) {
        expect(SCREEN_CLASS_MAP[routeName]).toBe(expectedClass);
      }
      expect(SCREEN_CLASS_MAP[Routes.Home]).toBe('HomeScreen');
      expect(SCREEN_CLASS_MAP[Routes.Movies]).toBe('MoviesScreen');
      expect(SCREEN_CLASS_MAP[Routes.LiveTV]).toBe('LiveTVScreen');
      expect(SCREEN_CLASS_MAP[Routes.Search]).toBe('SearchScreen');
      expect(SCREEN_CLASS_MAP[Routes.MovieDetail]).toBe('MovieDetailScreen');
      expect(SCREEN_CLASS_MAP[Routes.VideoPlayer]).toBe('VideoPlayerScreen');
      expect(SCREEN_CLASS_MAP[Routes.MyList]).toBe('MyListScreen');
      expect(SCREEN_CLASS_MAP[Routes.Settings]).toBe('SettingsScreen');
      expect(SCREEN_CLASS_MAP[Routes.Profile]).toBe('ProfileScreen');
      expect(SCREEN_CLASS_MAP[Routes.ProfileSelection]).toBe('ProfileSelectionScreen');
      expect(SCREEN_CLASS_MAP[Routes.CreateProfile]).toBe('CreateProfileScreen');
      expect(SCREEN_CLASS_MAP[Routes.EditProfile]).toBe('EditProfileScreen');
      expect(SCREEN_CLASS_MAP[Routes.Login]).toBe('LoginScreen');
      expect(SCREEN_CLASS_MAP[Routes.Register]).toBe('RegisterScreen');
    });
  });

  describe('3. Returning to a previously visited screen is tracked correctly', () => {
    it('tracks returning to a screen after navigating away as a new view with updated previous_screen', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      // Home -> Movies -> Home
      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      await tracker.handleRoute(
        {name: Routes.Movies, key: 'Movies-2'},
        {user: null, authLoading: false, isInitial: false},
      );

      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-3'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(3);
      expect(trackSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          screen_name: Routes.Home,
          screen_class: 'HomeScreen',
          previous_screen: Routes.Movies,
          navigation_source: 'user_action',
        }),
      );
    });
  });

  describe('4. Component re-renders do not emit duplicate events', () => {
    it('does not emit duplicate event when screen component re-renders with the same route key', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);

      // Re-renders (state changes, focus events, props updates)
      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: false},
      );
      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. Nested navigator changes are handled consistently', () => {
    it('correctly resolves leaf active route from nested navigation states', () => {
      const nestedState = {
        routes: [
          {
            name: 'RootStack',
            key: 'RootStack-1',
            state: {
              index: 1,
              routes: [
                {name: Routes.Home, key: 'Home-nested-1'},
                {
                  name: 'TabNavigator',
                  key: 'TabNavigator-2',
                  state: {
                    index: 0,
                    routes: [
                      {name: Routes.LiveTV, key: 'LiveTV-leaf-1'},
                      {name: Routes.MyList, key: 'MyList-leaf-2'},
                    ],
                  },
                },
              ],
            },
          },
        ],
      } as any;

      const leafRoute = getActiveRouteInfo(nestedState);
      expect(leafRoute).not.toBeNull();
      expect(leafRoute?.name).toBe(Routes.LiveTV);
      expect(leafRoute?.key).toBe('LiveTV-leaf-1');
    });

    it('returns null safely for empty or invalid navigation state', () => {
      expect(getActiveRouteInfo(undefined)).toBeNull();
      expect(getActiveRouteInfo({} as any)).toBeNull();
      expect(getActiveRouteInfo({routes: []} as any)).toBeNull();
    });
  });

  describe('6. Opening a destination through a deep link does not cause duplicate screen views', () => {
    it('tracks deep-link destination with navigation_source deep_link exactly once', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      // Set up pending deep link via deeplinkManager
      await deeplinkManager.handleIncomingUrl('logixstream://movies', 'cold_start');

      await tracker.handleRoute(
        {name: Routes.Movies, key: 'Movies-deeplink-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          screen_name: Routes.Movies,
          screen_class: 'MoviesScreen',
          navigation_source: 'deep_link',
        }),
      );

      // Subsequent re-render
      await tracker.handleRoute(
        {name: Routes.Movies, key: 'Movies-deeplink-1'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('7. Authentication redirects do not report inaccessible screens as active', () => {
    it('suppresses tracking of protected route when user is unauthenticated', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      // Home is active
      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);

      // User attempts to access protected Profile route while unauthenticated
      await tracker.handleRoute(
        {name: Routes.Profile, key: 'Profile-2'},
        {user: null, authLoading: false, isInitial: false},
      );

      // Profile MUST NOT be tracked!
      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(tracker.getLastTrackedScreen()).toBe(Routes.Home);

      // App redirects to Login with redirectTo param
      await tracker.handleRoute(
        {
          name: Routes.Login,
          key: 'Login-3',
          params: {redirectTo: {routeName: Routes.Profile}},
        },
        {user: null, authLoading: false, isInitial: false},
      );

      // Login IS tracked, with previous_screen Home and navigation_source auth_redirect
      expect(trackSpy).toHaveBeenCalledTimes(2);
      expect(trackSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          screen_name: Routes.Login,
          screen_class: 'LoginScreen',
          previous_screen: Routes.Home,
          navigation_source: 'auth_redirect',
        }),
      );
    });

    it('tracks protected route after successful authentication redirect return', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      // User on Login screen
      await tracker.handleRoute(
        {
          name: Routes.Login,
          key: 'Login-1',
          params: {redirectTo: {routeName: Routes.Profile}},
        },
        {user: null, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);

      // User authenticates and redirects to Profile
      const mockUser = {uid: 'user-auth-123'};
      await tracker.handleRoute(
        {name: Routes.Profile, key: 'Profile-2'},
        {user: mockUser, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(2);
      expect(trackSpy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          screen_name: Routes.Profile,
          screen_class: 'ProfileScreen',
          previous_screen: Routes.Login,
          navigation_source: 'auth_redirect',
        }),
      );
    });

    it('holds off tracking protected route while authLoading is true', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      // Route arrived while auth is still loading
      await tracker.handleRoute(
        {name: Routes.VideoPlayer, key: 'Player-1'},
        {user: null, authLoading: true, isInitial: true},
      );

      // Must not track yet
      expect(trackSpy).not.toHaveBeenCalled();

      // Auth resolves to authenticated user
      const mockUser = {uid: 'user-777'};
      await tracker.handleRoute(
        {name: Routes.VideoPlayer, key: 'Player-1'},
        {user: mockUser, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          screen_name: Routes.VideoPlayer,
          screen_class: 'VideoPlayerScreen',
        }),
      );
    });
  });

  describe('8. Re-selecting the current route does not create a false transition', () => {
    it('ignores re-selecting the currently active screen', async () => {
      const trackSpy = jest.spyOn(mockAnalytics, 'trackScreenView');

      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: true},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);

      // User presses Home on SideMenu while already on Home
      await tracker.handleRoute(
        {name: Routes.Home, key: 'Home-1'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(trackSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('9. Previous-screen attribution is correct', () => {
    it('accurately maintains previous screen through a multi-step user journey', async () => {
      const recordedCalls: any[] = [];
      jest.spyOn(mockAnalytics, 'trackScreenView').mockImplementation(async (params) => {
        recordedCalls.push(params);
      });

      // 1. Splash
      await tracker.handleRoute(
        {name: Routes.Splash, key: 'k1'},
        {user: null, authLoading: false, isInitial: true},
      );
      // 2. Home
      await tracker.handleRoute(
        {name: Routes.Home, key: 'k2'},
        {user: null, authLoading: false, isInitial: false},
      );
      // 3. Search
      await tracker.handleRoute(
        {name: Routes.Search, key: 'k3'},
        {user: null, authLoading: false, isInitial: false},
      );
      // 4. MovieDetail
      await tracker.handleRoute(
        {name: Routes.MovieDetail, key: 'k4'},
        {user: null, authLoading: false, isInitial: false},
      );
      // 5. Back to Search
      await tracker.handleRoute(
        {name: Routes.Search, key: 'k5'},
        {user: null, authLoading: false, isInitial: false},
      );

      expect(recordedCalls).toHaveLength(5);
      expect(recordedCalls[0]).toMatchObject({
        screen_name: Routes.Splash,
        previous_screen: undefined,
      });
      expect(recordedCalls[1]).toMatchObject({
        screen_name: Routes.Home,
        previous_screen: Routes.Splash,
      });
      expect(recordedCalls[2]).toMatchObject({
        screen_name: Routes.Search,
        previous_screen: Routes.Home,
      });
      expect(recordedCalls[3]).toMatchObject({
        screen_name: Routes.MovieDetail,
        previous_screen: Routes.Search,
      });
      expect(recordedCalls[4]).toMatchObject({
        screen_name: Routes.Search,
        previous_screen: Routes.MovieDetail,
      });
    });
  });

  describe('10. Analytics failures do not interrupt navigation', () => {
    it('gracefully handles trackScreenView rejections without throwing', async () => {
      jest.spyOn(mockAnalytics, 'trackScreenView').mockRejectedValue(new Error('Network error'));

      await expect(
        tracker.handleRoute(
          {name: Routes.Home, key: 'Home-1'},
          {user: null, authLoading: false, isInitial: true},
        ),
      ).resolves.not.toThrow();

      expect(tracker.getLastTrackedScreen()).toBe(Routes.Home);
    });
  });

  describe('11. Screen names and parameters contain no sensitive information', () => {
    it('filters out search queries, URLs, titles, user IDs, and passwords from screen_view', async () => {
      await mockAnalytics.initialize();
      mockAnalytics.setUser({userId: 'raw_sensitive_user_123'});
      mockAnalytics.setProfile({profileId: 'raw_prof_456', profileType: 'adult'});

      await mockAnalytics.trackScreenView({
        screen_name: Routes.Search,
        screen_class: 'SearchScreen',
        search_query: 'comedy movies',
        query: 'action',
        title: 'Secret Content',
        video_url: 'https://cdn.example.com/stream.mpd',
        user_password: 'supersecretpassword',
        profile_name: 'Anil Personal',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvent.SCREEN_VIEW,
        expect.objectContaining({
          screen_name: Routes.Search,
          screen_class: 'SearchScreen',
        }),
      );

      const payload = mockLogEvent.mock.calls[0][2];
      expect(payload.search_query).toBeUndefined();
      expect(payload.query).toBeUndefined();
      expect(payload.title).toBeUndefined();
      expect(payload.video_url).toBeUndefined();
      expect(payload.user_password).toBeUndefined();
      expect(payload.profile_name).toBeUndefined();
      expect(payload.userId).toBeUndefined();
      expect(payload.profileId).toBeUndefined();
    });
  });

  describe('12. End-to-End App Navigation Integration', () => {
    it('emits screen_view for Splash, Home, and SideMenu navigation within real App', async () => {
      jest.useFakeTimers();
      const trackSpy = jest.spyOn(analyticsService, 'trackScreenView');

      const screen = render(<App />);

      // Initial Splash view
      expect(screen.getByTestId('splash-screen')).toBeTruthy();
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          screen_name: Routes.Splash,
          screen_class: 'SplashScreen',
          navigation_source: 'initial_launch',
        }),
      );

      // Advance timers to finish Splash
      await act(async () => {
        jest.advanceTimersByTime(SPLASH_DURATION);
      });

      expect(screen.getByTestId('home-screen')).toBeTruthy();
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          screen_name: Routes.Home,
          screen_class: 'HomeScreen',
          previous_screen: Routes.Splash,
          navigation_source: 'user_action',
        }),
      );

      // Navigate via SideMenu to Movies
      fireEvent.press(screen.getByTestId('side-menu-Movies'));

      expect(screen.getByTestId('movies-screen')).toBeTruthy();
      expect(trackSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          screen_name: Routes.Movies,
          screen_class: 'MoviesScreen',
          previous_screen: Routes.Home,
          navigation_source: 'user_action',
        }),
      );

      jest.useRealTimers();
    });
  });
});
