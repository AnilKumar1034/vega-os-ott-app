import 'react-native';
import {act, render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {HomeScreen} from '../src/screens/HomeScreen';
import {
  parseGenres,
  parseReleaseYear,
  parseRatingNumber,
  matchesLanguage,
  getPersonalizedRecommendations,
  clearRecommendationCache,
} from '../src/services/recommendationService';
import {analyticsService} from '../src/analytics/analyticsService';
import {AnalyticsEvent} from '../src/analytics/analyticsEvents';
import * as watchProgressService from '../src/services/watchProgressService';
import * as watchlistService from '../src/services/watchlistService';
import * as viewingHistoryService from '../src/services/viewingHistoryService';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';
import {HomeContentItem} from '../src/data/home';
import {UserProfile} from '../src/profiles/types/Profile';

jest.mock(
  '@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native',
  () => ({
    default: {
      getItem: jest.fn(async () => null),
      setItem: jest.fn(async () => {}),
      removeItem: jest.fn(async () => {}),
    },
  }),
);

jest.mock('../src/components/molecules/SideMenu', () => ({
  SideMenu: () => null,
}));
jest.mock('../src/components/molecules/CommonHeader', () => ({
  CommonHeader: () => null,
}));
jest.mock('../src/components/molecules/HeroCarousel', () => ({
  HeroCarousel: () => null,
}));
jest.mock('../src/components/molecules/ContentRow', () => {
  const ReactMock = require('react');
  const {Text, View} = require('react-native');
  return {
    ContentRow: ({row}: any) => {
      return ReactMock.createElement(
        View,
        {testID: `row-${row.id}`},
        ReactMock.createElement(Text, {testID: `row-title-${row.id}`}, row.title),
        row.items?.map((item: any, index: number) =>
          ReactMock.createElement(
            Text,
            {
              key: item.id,
              testID: `${row.id}-item-${item.id}`,
              accessibilityLabel: `${row.id}-${index}`,
            },
            item.title,
          ),
        ),
      );
    },
  };
});

describe('Personalized Recommendations Engine & Service', () => {
  beforeEach(() => {
    clearRecommendationCache();
    analyticsService.resetRecommendationImpressions();
  });

  describe('Metadata Parsing Utilities', () => {
    it('parseGenres correctly extracts and normalizes genres', () => {
      expect(parseGenres(undefined)).toEqual([]);
      expect(parseGenres('')).toEqual([]);
      expect(parseGenres('Action • Sci-Fi • Thriller')).toEqual([
        'action',
        'sci-fi',
        'thriller',
      ]);
      expect(parseGenres('Drama, Romance/Comedy')).toEqual([
        'drama',
        'romance',
        'comedy',
      ]);
    });

    it('parseReleaseYear correctly extracts 4-digit release year from meta', () => {
      expect(parseReleaseYear(undefined)).toBe(0);
      expect(parseReleaseYear('2024 • 2h 45m • U/A 16+')).toBe(2024);
      expect(parseReleaseYear('Released in 1999')).toBe(1999);
      expect(parseReleaseYear('No Year Here')).toBe(0);
    });

    it('parseRatingNumber correctly parses ratings', () => {
      expect(parseRatingNumber(undefined)).toBe(0);
      expect(parseRatingNumber('⭐ 8.9')).toBe(8.9);
      expect(parseRatingNumber('7.5 / 10')).toBe(7.5);
      expect(parseRatingNumber('N/A')).toBe(0);
    });

    it('matchesLanguage checks audio tracks and language tags', () => {
      const item: HomeContentItem = {
        id: 'test-1',
        title: 'Test Movie',
        image: {uri: 'https://example.com/test.jpg'},
        meta: ['Telugu', '2024'],
        ...({
          audioTracks: [
            {id: '1', label: 'Telugu [Original]', language: 'te'},
            {id: '2', label: 'Hindi', language: 'hi'},
          ],
        } as any),
      };
      expect(matchesLanguage(item, 'te')).toBe(true);
      expect(matchesLanguage(item, 'Telugu')).toBe(true);
      expect(matchesLanguage(item, 'hi')).toBe(true);
      expect(matchesLanguage(item, 'ta')).toBe(false);
    });
  });

  describe('Recommendation Scoring & Generation', () => {
    const mockCatalog: HomeContentItem[] = [
      {
        id: 'action-hit-1',
        title: 'Action Blast 1',
        genre: 'Action • Thriller',
        meta: ['2024', 'Movie'],
        rating: '⭐ 9.0',
        maturityRating: '13_PLUS',
        image: {uri: 'https://example.com/action1.jpg'},
      },
      {
        id: 'action-hit-2',
        title: 'Action Blast 2',
        genre: 'Action • Adventure',
        meta: ['2023', 'Movie'],
        rating: '⭐ 8.5',
        maturityRating: '13_PLUS',
        image: {uri: 'https://example.com/action2.jpg'},
      },
      {
        id: 'action-hit-3',
        title: 'Action Blast 3',
        genre: 'Action • Sci-Fi',
        meta: ['2023', 'Movie'],
        rating: '⭐ 8.1',
        maturityRating: '13_PLUS',
        image: {uri: 'https://example.com/action3.jpg'},
      },
      {
        id: 'comedy-hit',
        title: 'Laugh Out Loud',
        genre: 'Comedy • Family',
        meta: ['2022', 'Movie'],
        rating: '⭐ 7.0',
        maturityRating: 'ALL',
        image: {uri: 'https://example.com/comedy.jpg'},
      },
      {
        id: 'drama-hit',
        title: 'Deep Emotion',
        genre: 'Drama',
        meta: ['2021', 'Movie'],
        rating: '⭐ 8.0',
        maturityRating: '18_PLUS',
        image: {uri: 'https://example.com/drama.jpg'},
      },
      {
        id: 'kids-cartoon',
        title: 'Cartoon Fun',
        genre: 'Animation • Family',
        meta: ['2024', 'Movie'],
        rating: '⭐ 8.2',
        maturityRating: 'KIDS',
        image: {uri: 'https://example.com/kids.jpg'},
      },
    ];

    const adultProfile: UserProfile = {
      id: 'profile-adult',
      name: 'Adult User',
      avatarId: 'avatar-1',
      isKids: false,
      kidsMaturityLimit: '18_PLUS',
      createdAt: 1000,
      updatedAt: 1000,
    };

    const kidsProfile: UserProfile = {
      id: 'profile-kids',
      name: 'Little Kid',
      avatarId: 'avatar-kids',
      isKids: true,
      kidsMaturityLimit: 'KIDS',
      createdAt: 1000,
      updatedAt: 1000,
    };

    it('ranks items matching viewing history genres highest in Recommended for You', () => {
      const result = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [
          {
            contentId: 'old-action',
            title: 'Old Action',
            genre: 'Action',
            lastWatchedAt: '2026-01-01T00:00:00Z',
            watchCount: 2,
          },
        ],
        continueWatching: [],
        watchlist: [],
      });

      expect(result.recommendedForYou.length).toBeGreaterThan(0);
      expect(result.recommendedForYou[0].id).toBe('action-hit-1');
      expect(result.recommendedForYou[1].id).toBe('action-hit-2');
    });

    it('boosts titles matching watchlist genres and profile preferences', () => {
      const profileWithPref: UserProfile = {
        ...adultProfile,
        preferredGenres: ['comedy'],
      };

      const result = getPersonalizedRecommendations({
        activeProfile: profileWithPref,
        catalog: mockCatalog,
        viewingHistory: [],
        continueWatching: [],
        watchlist: [
          {
            contentId: 'saved-comedy',
            title: 'Saved Comedy',
            genre: 'Comedy',
            addedAt: '2026-01-01T00:00:00Z',
          },
        ],
      });

      expect(result.recommendedForYou[0].id).toBe('comedy-hit');
    });

    it('excludes titles currently in Continue Watching from recommendations', () => {
      const result = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [
          {
            contentId: 'action-hit-1',
            title: 'Action Blast 1',
            genre: 'Action',
            lastWatchedAt: '2026-01-01T00:00:00Z',
            watchCount: 1,
          },
        ],
        continueWatching: [
          {
            contentId: 'action-hit-1',
            title: 'Action Blast 1',
            currentTime: 600,
            duration: 1200,
            progress: 0.5,
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        watchlist: [],
      });

      const recIds = result.recommendedForYou.map((i) => i.id);
      expect(recIds).not.toContain('action-hit-1');
      expect(recIds[0]).toBe('action-hit-2');
    });

    it('strictly filters out mature content when Kids profile is active', () => {
      const result = getPersonalizedRecommendations({
        activeProfile: kidsProfile,
        catalog: mockCatalog,
        viewingHistory: [],
        continueWatching: [],
        watchlist: [],
      });

      const recIds = result.recommendedForYou.map((i) => i.id);
      expect(recIds).not.toContain('drama-hit'); // 18+
      expect(recIds).not.toContain('action-hit-1'); // 13+
      expect(recIds).toContain('kids-cartoon'); // KIDS
    });

    it('generates "Because You Watched" based on recent history when >= 2 matches exist', () => {
      const result = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [
          {
            contentId: 'some-action',
            title: 'Action Blast 1',
            genre: 'Action • Thriller',
            lastWatchedAt: '2026-01-01T00:00:00Z',
            watchCount: 1,
          },
        ],
        continueWatching: [],
        watchlist: [],
      });

      // Reference title is action-hit-1 (matches Action Blast 1)
      expect(result.becauseYouWatched).not.toBeNull();
      expect(result.becauseYouWatched?.sourceTitle).toBe('Action Blast 1');
      // Should not contain the reference item itself
      const bywIds = result.becauseYouWatched?.items.map((i) => i.id);
      expect(bywIds).not.toContain('action-hit-1');
    });

    it('returns null for "Because You Watched" if fewer than 2 distinct matches exist', () => {
      const limitedCatalog: HomeContentItem[] = [
        {
          id: 'solo-genre-1',
          title: 'Documentary A',
          genre: 'Documentary',
          rating: '⭐ 8.0',
          image: {uri: 'https://example.com/doc.jpg'},
        },
        {
          id: 'solo-genre-2',
          title: 'Comedy Movie',
          genre: 'Comedy',
          rating: '⭐ 7.0',
          image: {uri: 'https://example.com/com.jpg'},
        },
      ];

      const result = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: limitedCatalog,
        viewingHistory: [
          {
            contentId: 'solo-genre-1',
            title: 'Documentary A',
            genre: 'Documentary',
            lastWatchedAt: '2026-01-01T00:00:00Z',
            watchCount: 1,
          },
        ],
        continueWatching: [],
        watchlist: [],
      });

      expect(result.becauseYouWatched).toBeNull();
    });

    it('sorts Recently Added by release year descending and prioritizes non-duplicates', () => {
      const result = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [],
        continueWatching: [],
        watchlist: [],
      });

      expect(result.recentlyAdded.length).toBeGreaterThan(0);
      const years = result.recentlyAdded.map((i) => parseReleaseYear(i.meta));
      // First item should have the highest release year (2024)
      expect(years[0]).toBe(2024);
    });

    it('caches recommendations by profile ID and returns cached copy', () => {
      const first = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [],
      });
      const second = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [],
      });
      expect(first).toBe(second);

      clearRecommendationCache(adultProfile.id);
      const third = getPersonalizedRecommendations({
        activeProfile: adultProfile,
        catalog: mockCatalog,
        viewingHistory: [],
      });
      expect(third).not.toBe(first);
    });
  });
});

describe('HomeScreen Personalized Recommendations Integration', () => {
  let mockUseAuth: jest.SpyInstance;
  let mockUseProfile: jest.SpyInstance;
  let mockFetchContinueWatch: jest.SpyInstance;
  let mockFetchWatchlist: jest.SpyInstance;
  let mockFetchViewingHistory: jest.SpyInstance;

  const adultProfile: UserProfile = {
    id: 'user-profile-1',
    name: 'Rajesh',
    avatarId: 'avatar-1',
    isKids: false,
    kidsMaturityLimit: '18_PLUS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'kids-profile-2',
    name: 'Aarav (Kids)',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const createProfileMockContext = (activeProfile: UserProfile): any => ({
    activeProfile,
    profiles: [adultProfile, kidsProfile],
    isLoadingProfiles: false,
    error: null,
    isParentAuthorized: false,
    parentalSettings: {pinEnabled: true, pinHash: 'hash'},
    isLoadingParentalSettings: false,
    setParentAuthorized: jest.fn(),
    setActiveProfile: jest.fn(),
    switchProfile: jest.fn(),
    refreshProfiles: jest.fn(),
    refreshParentalSettings: jest.fn(),
    verifyParentPin: jest.fn(),
    setParentPin: jest.fn(),
    removeParentPin: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    deleteProfile: jest.fn(),
    clearActiveProfile: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearRecommendationCache();
    analyticsService.resetRecommendationImpressions();

    mockUseAuth = jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'firebase-user-123'} as any,
      userProfile: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    mockFetchContinueWatch = jest
      .spyOn(watchProgressService, 'fetchContinueWatchItems')
      .mockResolvedValue([]);

    mockFetchWatchlist = jest
      .spyOn(watchlistService, 'fetchWatchlist')
      .mockResolvedValue([]);

    mockFetchViewingHistory = jest
      .spyOn(viewingHistoryService, 'fetchViewingHistory')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    if (mockUseAuth) {
      mockUseAuth.mockRestore();
    }
    if (mockUseProfile) {
      mockUseProfile.mockRestore();
    }
    if (mockFetchContinueWatch) {
      mockFetchContinueWatch.mockRestore();
    }
    if (mockFetchWatchlist) {
      mockFetchWatchlist.mockRestore();
    }
    if (mockFetchViewingHistory) {
      mockFetchViewingHistory.mockRestore();
    }
  });

  it('renders "Recommended for You" and "Recently Added" rows for active profile', async () => {
    mockUseProfile = jest
      .spyOn(profileContext, 'useProfile')
      .mockReturnValue(createProfileMockContext(adultProfile));

    const screen = render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('home-screen')).toBeTruthy();
      expect(screen.getByTestId('row-recommended-for-you')).toBeTruthy();
      expect(screen.getByTestId('row-recently-added')).toBeTruthy();
    });
  });

  it('renders "Because You Watched" row when viewing history provides a reference title', async () => {
    mockUseProfile = jest
      .spyOn(profileContext, 'useProfile')
      .mockReturnValue(createProfileMockContext(adultProfile));

    mockFetchViewingHistory.mockResolvedValue([
      {
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        genre: 'Sci-Fi • Action • Mythology',
        lastWatchedAt: new Date().toISOString(),
        watchCount: 1,
      },
    ]);

    const screen = render(<HomeScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(screen.getByTestId('row-because-you-watched')).toBeTruthy();
      const titleElem = screen.getByTestId('row-title-because-you-watched');
      expect(titleElem.props.children).toContain('Kalki 2898 AD');
    });
  });

  it('immediately isolates profile data and prevents leakage across profile switches', async () => {
    let currentProfile = adultProfile;

    mockUseProfile = jest
      .spyOn(profileContext, 'useProfile')
      .mockImplementation(() => createProfileMockContext(currentProfile));

    mockFetchViewingHistory.mockResolvedValue([
      {
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        genre: 'Sci-Fi • Action',
        lastWatchedAt: new Date().toISOString(),
        watchCount: 1,
      },
    ]);

    const {rerender, getByTestId, queryByTestId} = render(<HomeScreen />);
    await act(async () => {});

    await waitFor(() => {
      expect(getByTestId('row-because-you-watched')).toBeTruthy();
    });

    // Switch to Kids Profile with empty history
    mockFetchViewingHistory.mockResolvedValue([]);
    currentProfile = kidsProfile;

    act(() => {
      rerender(<HomeScreen />);
    });

    await waitFor(() => {
      // Because You Watched for Kalki must be immediately cleared and gone
      expect(queryByTestId('row-because-you-watched')).toBeNull();
    });
  });

  it('safely ignores stale async responses from previous profile', async () => {
    let resolveFirstCall: (data: any) => void = () => {};
    const firstCallPromise = new Promise((resolve) => {
      resolveFirstCall = resolve;
    });

    mockFetchViewingHistory.mockReturnValueOnce(firstCallPromise);

    let currentProfile = adultProfile;
    mockUseProfile = jest
      .spyOn(profileContext, 'useProfile')
      .mockImplementation(() => createProfileMockContext(currentProfile));

    const {rerender, queryByTestId} = render(<HomeScreen />);

    // Switch profile while first request is pending
    currentProfile = kidsProfile;
    mockFetchViewingHistory.mockResolvedValueOnce([]);

    act(() => {
      rerender(<HomeScreen />);
    });

    // Now resolve first call with adult data
    await act(async () => {
      resolveFirstCall([
        {
          contentId: 'animal-2023',
          title: 'Animal',
          genre: 'Action • Crime',
          watchedAt: Date.now(),
        },
      ]);
    });

    // Kids profile should NOT have the adult "Because You Watched Animal" row
    expect(queryByTestId('row-because-you-watched')).toBeNull();
  });
});

describe('Recommendation Analytics Tracking', () => {
  beforeEach(() => {
    analyticsService.resetRecommendationImpressions();
    jest.clearAllMocks();
  });

  it('emits recommendation_impression event with correct properties', () => {
    const trackSpy = jest.spyOn(analyticsService, 'track');

    analyticsService.trackRecommendationImpression({
      content_id: 'movie-123',
      content_type: 'movie',
      recommendation_source: 'personalized_heuristic',
      section_name: 'Recommended for You',
      position_index: 2,
    });

    expect(trackSpy).toHaveBeenCalledWith(
      AnalyticsEvent.RECOMMENDATION_IMPRESSION,
      expect.objectContaining({
        content_id: 'movie-123',
        recommendation_source: 'personalized_heuristic',
        section_name: 'Recommended for You',
        position_index: 2,
      }),
    );
  });

  it('deduplicates recommendation impressions within the same section', () => {
    const trackSpy = jest.spyOn(analyticsService, 'track');

    analyticsService.trackRecommendationImpression({
      content_id: 'movie-123',
      content_type: 'movie',
      recommendation_source: 'personalized_heuristic',
      section_name: 'Recommended for You',
      position_index: 0,
    });

    // Same item, same section focused again
    analyticsService.trackRecommendationImpression({
      content_id: 'movie-123',
      content_type: 'movie',
      recommendation_source: 'personalized_heuristic',
      section_name: 'Recommended for You',
      position_index: 0,
    });

    expect(trackSpy).toHaveBeenCalledTimes(1);

    // Same item, different section CAN emit
    analyticsService.trackRecommendationImpression({
      content_id: 'movie-123',
      content_type: 'movie',
      recommendation_source: 'recently_added',
      section_name: 'Recently Added',
      position_index: 0,
    });

    expect(trackSpy).toHaveBeenCalledTimes(2);
  });

  it('emits recommendation_selected event when user selects a recommended item', () => {
    const trackSpy = jest.spyOn(analyticsService, 'track');

    analyticsService.trackRecommendationSelected({
      content_id: 'movie-456',
      content_type: 'movie',
      recommendation_source: 'genre_affinity',
      section_name: 'Recommended for You',
      position_index: 1,
    });

    expect(trackSpy).toHaveBeenCalledWith(
      AnalyticsEvent.RECOMMENDATION_SELECTED,
      expect.objectContaining({
        content_id: 'movie-456',
        recommendation_source: 'genre_affinity',
        section_name: 'Recommended for You',
        position_index: 1,
      }),
    );
  });
});
