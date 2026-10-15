import React from 'react';
import {render, act, fireEvent, waitFor, cleanup} from '@testing-library/react-native';

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

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: any = {};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    goBack: mockGoBack,
    canGoBack: () => true,
    dispatch: jest.fn(),
  }),
  useRoute: () => mockRouteParams,
}));

let capturedTVEventHandler: ((evt: any) => void) | null = null;
jest.mock('@amazon-devices/react-native-kepler', () => ({
  TVFocusGuideView: ({children, ...props}: any) => {
    const {View} = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useTVEventHandler: (handler: (evt: any) => void) => {
    capturedTVEventHandler = handler;
  },
}));

import {analyticsService, AnalyticsEvents} from '../src/analytics';
import * as watchlistService from '../src/services/watchlistService';
import * as watchProgressService from '../src/services/watchProgressService';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';
import {MyListScreen} from '../src/screens/MyListScreen';
import {MovieDetailScreen} from '../src/screens/MovieDetailScreen';
import {HeroCarousel} from '../src/components/molecules/HeroCarousel';
import {ContentCard} from '../src/components/molecules/ContentCard';

describe('Day 10 — My List / Watchlist Analytics (LogiXstream Specification)', () => {
  const mockMovieA = {
    id: 'kalki',
    title: 'Kalki 2898 AD',
    genre: 'Sci-Fi',
    image: {uri: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg'},
    videoUrl: 'https://test.video/kalki.mp4',
    contentType: 'movie' as const,
    meta: ['2024', 'Sci-Fi', 'Movie'],
  };



  let mockUseAuth: jest.SpyInstance;
  let mockUseProfile: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockRouteParams = {params: {movie: mockMovieA}};

    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});
    mockGetApp.mockReturnValue({name: '[DEFAULT]'});
    mockLogEvent.mockResolvedValue(undefined);

    analyticsService.__resetForTesting();
    await analyticsService.initialize();
    analyticsService.setUser({userId: 'user-day10-test'});
    analyticsService.setProfile({profileId: 'profile-anil', profileType: 'adult'});

    mockUseAuth = jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'user-day10-test'} as any,
      userProfile: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    mockUseProfile = jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: {
        id: 'profile-anil',
        name: 'Anil',
        avatarId: 'avatar-1',
        isKids: false,
        createdAt: 1000,
        updatedAt: 1000,
      },
      profiles: [],
      isLoadingProfiles: false,
      error: null,
      setActiveProfile: jest.fn(),
      switchProfile: jest.fn(),
      refreshProfiles: jest.fn(),
      createProfile: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
      clearActiveProfile: jest.fn(),
      isParentAuthorized: false,
      parentalSettings: null,
      isLoadingParentalSettings: false,
      setParentAuthorized: jest.fn(),
      refreshParentalSettings: jest.fn().mockResolvedValue(null),
      verifyParentPin: jest.fn().mockResolvedValue(true),
      setParentPin: jest.fn().mockResolvedValue(undefined),
      removeParentPin: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    cleanup();
    mockUseAuth.mockRestore();
    mockUseProfile.mockRestore();
  });

  // Requirement 1: Successful addition emits watchlist_added exactly once
  it('1. Successful addition emits watchlist_added exactly once with expected parameters', async () => {
    jest.spyOn(watchlistService, 'getWatchlistItem').mockResolvedValue(null);
    jest.spyOn(watchlistService, 'addToWatchlist').mockResolvedValue(undefined);
    jest.spyOn(watchProgressService, 'fetchContinueWatchForContent').mockResolvedValue(null);

    const screen = render(<MovieDetailScreen />);
    await act(async () => {});

    // Find and press the Add to My List button
    const addButton = screen.getByTestId('my-list-button');
    await act(async () => {
      fireEvent.press(addButton);
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(1);
    expect(addCalls[0][1]).toBe('watchlist_added');
    expect(addCalls[0][2]).toMatchObject({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
      profileId: 'profile-anil',
    });
  });

  // Requirement 2: Failed or cancelled additions do not emit the success event
  it('2. Failed or cancelled additions do not emit watchlist_added', async () => {
    jest.spyOn(watchlistService, 'getWatchlistItem').mockResolvedValue(null);
    jest.spyOn(watchlistService, 'addToWatchlist').mockRejectedValue(new Error('FIRESTORE_WRITE_FAILED'));
    jest.spyOn(watchProgressService, 'fetchContinueWatchForContent').mockResolvedValue(null);

    const screen = render(<MovieDetailScreen />);
    await act(async () => {});

    const addButton = screen.getByTestId('my-list-button');
    await act(async () => {
      fireEvent.press(addButton);
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(0);
  });

  it('2b. Unauthenticated addition attempt does not emit watchlist_added', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      userProfile: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    const screen = render(<MovieDetailScreen />);
    await act(async () => {});

    const addButton = screen.getByTestId('my-list-button');
    await act(async () => {
      fireEvent.press(addButton);
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(0);
  });

  // Requirement 3: Adding an item already present does not count as a new addition
  it('3. Adding an item already present does not emit a duplicate watchlist_added event', async () => {
    // Populate known state with kalki
    analyticsService.syncWatchlistState('profile-anil', ['kalki']);

    await analyticsService.trackWatchlistAdded({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(0);
  });

  // Requirement 4: Successful removal emits watchlist_removed exactly once
  it('4. Successful removal emits watchlist_removed exactly once with expected parameters', async () => {
    jest.spyOn(watchlistService, 'getWatchlistItem').mockResolvedValue({
      contentId: 'kalki',
      title: 'Kalki 2898 AD',
      addedAt: '2026-08-25T12:00:00Z',
    });
    jest.spyOn(watchlistService, 'removeFromWatchlist').mockResolvedValue(undefined);
    jest.spyOn(watchProgressService, 'fetchContinueWatchForContent').mockResolvedValue(null);

    const screen = render(<MovieDetailScreen />);
    await act(async () => {});

    // Button should now be remove button
    const removeButton = screen.getByTestId('my-list-button');
    await act(async () => {
      fireEvent.press(removeButton);
    });

    const removeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_REMOVED,
    );
    expect(removeCalls).toHaveLength(1);
    expect(removeCalls[0][1]).toBe('watchlist_removed');
    expect(removeCalls[0][2]).toMatchObject({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
      profileId: 'profile-anil',
    });
  });

  // Requirement 5: Failed or cancelled removals do not emit the success event
  it('5. Failed or cancelled removals do not emit watchlist_removed', async () => {
    jest.spyOn(watchlistService, 'getWatchlistItem').mockResolvedValue({
      contentId: 'kalki',
      title: 'Kalki 2898 AD',
      addedAt: '2026-08-25T12:00:00Z',
    });
    jest.spyOn(watchlistService, 'removeFromWatchlist').mockRejectedValue(new Error('NETWORK_DISCONNECTED'));
    jest.spyOn(watchProgressService, 'fetchContinueWatchForContent').mockResolvedValue(null);

    const screen = render(<MovieDetailScreen />);
    await act(async () => {});

    const removeButton = screen.getByTestId('my-list-button');
    await act(async () => {
      fireEvent.press(removeButton);
    });

    const removeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_REMOVED,
    );
    expect(removeCalls).toHaveLength(0);
  });

  // Requirement 6: A Firestore listener update does not duplicate an add/remove event
  it('6. Firestore sync / state load does not emit add or remove events', async () => {
    jest.spyOn(watchlistService, 'fetchWatchlist').mockResolvedValue([
      {
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        addedAt: '2026-08-25T12:00:00Z',
      },
      {
        contentId: 'mirzapur',
        title: 'Mirzapur',
        addedAt: '2026-08-25T10:00:00Z',
      },
    ]);

    render(<MyListScreen />);
    await act(async () => {});

    const watchlistEvents = mockLogEvent.mock.calls.filter(
      ([, eventName]) =>
        eventName === AnalyticsEvents.WATCHLIST_ADDED ||
        eventName === AnalyticsEvents.WATCHLIST_REMOVED,
    );
    expect(watchlistEvents).toHaveLength(0);
  });

  // Requirement 7: Selecting an item emits watchlist_item_selected once
  it('7. Selecting an item emits watchlist_item_selected once with details destination', async () => {
    jest.spyOn(watchlistService, 'fetchWatchlist').mockResolvedValue([
      {
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        genre: 'Sci-Fi',
        addedAt: '2026-08-25T12:00:00Z',
      },
    ]);

    const screen = render(<MyListScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('my-list-card-kalki')).toBeTruthy();
    });

    const card = screen.getByTestId('my-list-card-kalki');
    await act(async () => {
      fireEvent.press(card);
    });

    const selectCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ITEM_SELECTED,
    );
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0][2]).toMatchObject({
      content_type: 'movie',
      destination_type: 'details',
      selection_source: 'watchlist',
      content_id: 'kalki',
    });
    expect(mockNavigate).toHaveBeenCalledWith('MovieDetail', expect.anything());
  });

  it('7b. Playing an item via Kepler remote emits watchlist_item_selected with player destination', async () => {
    const card = render(
      <ContentCard
        id="kalki"
        title="Kalki 2898 AD"
        image={{uri: 'https://test.image/kalki.jpg'}}
        videoUrl="https://test.video/kalki.mp4"
        isWatchlist={true}
        selectionSource="watchlist"
        rowId="my-list"
        testID="test-watchlist-card"
      />,
    );

    // Focus the card first
    await act(async () => {
      fireEvent(card.getByTestId('test-watchlist-card'), 'focus');
    });

    // Send remote 'play' key event
    await act(async () => {
      capturedTVEventHandler?.({eventType: 'play', eventKeyAction: 0});
    });

    const selectCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ITEM_SELECTED,
    );
    expect(selectCalls).toHaveLength(1);
    expect(selectCalls[0][2]).toMatchObject({
      content_type: 'movie',
      destination_type: 'player',
      selection_source: 'watchlist',
      content_id: 'kalki',
    });
    expect(mockNavigate).toHaveBeenCalledWith('VideoPlayer', expect.anything());
  });

  // Requirement 8: Rendering or focusing an item does not falsely count as selection
  it('8. Rendering or focusing an item does not falsely count as selection', async () => {
    const screen = render(
      <ContentCard
        id="kalki"
        title="Kalki 2898 AD"
        image={{uri: 'https://test.image/kalki.jpg'}}
        isWatchlist={true}
        selectionSource="watchlist"
        rowId="my-list"
        testID="test-focus-card"
      />,
    );

    // Just rendering
    expect(mockLogEvent).not.toHaveBeenCalledWith(
      expect.anything(),
      AnalyticsEvents.WATCHLIST_ITEM_SELECTED,
      expect.anything(),
    );

    // Focus without selection
    await act(async () => {
      fireEvent(screen.getByTestId('test-focus-card'), 'focus');
    });

    const selectCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ITEM_SELECTED,
    );
    expect(selectCalls).toHaveLength(0);
  });

  // Requirement 9: Repeated callbacks do not generate duplicate events for one action
  it('9. Repeated callbacks do not generate duplicate events for one action', async () => {
    await analyticsService.trackWatchlistAdded({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    // Immediate second call for same item
    await analyticsService.trackWatchlistAdded({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(1);
  });

  it('9b. Genuine remove followed by a later re-add records two distinct addition/removal actions', async () => {
    // 1. Initial add
    await analyticsService.trackWatchlistAdded({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    // 2. Removal
    await analyticsService.trackWatchlistRemoved({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    // 3. Re-add
    await analyticsService.trackWatchlistAdded({
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    const removeCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_REMOVED,
    );

    expect(addCalls).toHaveLength(2);
    expect(removeCalls).toHaveLength(1);
  });

  // Requirement 10: Analytics failures do not interrupt persistence or navigation
  it('10. Analytics failures do not interrupt persistence or navigation', async () => {
    mockLogEvent.mockRejectedValue(new Error('Firebase service offline'));

    jest.spyOn(watchlistService, 'getWatchlistItem').mockResolvedValue(null);
    const mockAdd = jest.spyOn(watchlistService, 'addToWatchlist').mockResolvedValue(undefined);
    jest.spyOn(watchProgressService, 'fetchContinueWatchForContent').mockResolvedValue(null);

    const screen = render(<MovieDetailScreen />);
    await act(async () => {});

    const addButton = screen.getByTestId('my-list-button');
    // Pressing button should complete successfully even if analytics fails
    await expect(
      act(async () => {
        fireEvent.press(addButton);
      }),
    ).resolves.not.toThrow();

    expect(mockAdd).toHaveBeenCalledWith('profile-anil', mockMovieA);
  });

  // Requirement 11: Event payloads follow project privacy and typing conventions
  it('11. Event payloads do not contain sensitive data or full titles', async () => {
    await analyticsService.trackWatchlistAdded({
      content_type: 'series',
      action_source: 'hero',
      content_id: 'mirzapur',
      title: 'Mirzapur Season 3',
      rawProfileToken: 'secret_jwt_token',
      email: 'user@example.com',
    } as any);

    const addCall = mockLogEvent.mock.calls.find(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );

    expect(addCall).toBeDefined();
    const payload = addCall[2];

    expect(payload.content_type).toBe('series');
    expect(payload.action_source).toBe('hero');
    expect(payload.content_id).toBe('mirzapur');
    expect(payload.title).toBeUndefined();
    expect(payload.rawProfileToken).toBeUndefined();
    expect(payload.email).toBeUndefined();
    expect(payload.password).toBeUndefined();
  });

  it('11b. Supports HeroCarousel watchlist addition and removal', async () => {
    jest.spyOn(watchlistService, 'isInWatchlist').mockResolvedValue(false);
    const mockAdd = jest.spyOn(watchlistService, 'addToWatchlist').mockResolvedValue(undefined);

    const screen = render(
      <HeroCarousel
        slides={[mockMovieA as any]}
        onContentFocus={jest.fn()}
      />,
    );
    await act(async () => {});

    const heroButton = screen.getByTestId('hero-mylist-button');
    await act(async () => {
      fireEvent.press(heroButton);
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(1);
    expect(addCalls[0][2]).toMatchObject({
      content_type: 'movie',
      action_source: 'hero',
      content_id: 'kalki',
    });
    expect(mockAdd).toHaveBeenCalledWith('profile-anil', expect.anything());
  });

  it('11c. Watchlist tracking is profile-isolated', async () => {
    // Add for Profile Anil
    await analyticsService.trackWatchlistAdded({
      profile_id: 'profile-anil',
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    // Add for Kids Profile
    await analyticsService.trackWatchlistAdded({
      profile_id: 'profile-kids',
      content_type: 'movie',
      action_source: 'details',
      content_id: 'kalki',
    });

    const addCalls = mockLogEvent.mock.calls.filter(
      ([, eventName]) => eventName === AnalyticsEvents.WATCHLIST_ADDED,
    );
    expect(addCalls).toHaveLength(2);
  });
});
