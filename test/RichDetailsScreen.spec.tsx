import 'react-native';
import {fireEvent, render, waitFor, act} from '@testing-library/react-native';
import * as React from 'react';
import {MovieDetailScreen} from '../src/screens/MovieDetailScreen';
import {Routes} from '../src/constants/routes';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

let mockRouteParams: any = {
  params: {
    movie: {
      id: 'kalki-movie',
      title: 'Kalki 2898 AD',
      description: 'Futuristic dystopian sci-fi epic set in the post-apocalyptic world of Kasi.',
      image: {uri: 'https://example.com/kalki.jpg'},
      rating: '⭐ 8.6 / 10',
      badge: 'TELUGU • HINDI • ENGLISH',
      cast: 'Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone',
      director: 'Nag Ashwin',
      meta: ['2024', '4K UHD', '3h 1m'],
      contentType: 'movie',
      videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    },
  },
};

let mockUser: any = {uid: 'test-user-123', email: 'test@example.com'};
let mockUserProfile: any = {
  uid: 'test-user-123',
  subscription: 'Premium',
  subscriptionStatus: 'active',
};
let mockActiveProfile: any = {
  id: 'profile-adult-1',
  name: 'Adult User',
  isKids: false,
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    canGoBack: () => true,
  }),
  useRoute: () => mockRouteParams,
}));

jest.mock('../src/context/authContext', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    logout: jest.fn(),
  }),
}));

jest.mock('../src/profiles/hooks/useProfile', () => ({
  useProfile: () => ({
    activeProfile: mockActiveProfile,
  }),
}));

const mockAddToWatchlist = jest.fn().mockResolvedValue(true);
const mockRemoveFromWatchlist = jest.fn().mockResolvedValue(true);
const mockGetWatchlistItem = jest.fn().mockResolvedValue(null);

jest.mock('../src/services/watchlistService', () => ({
  addToWatchlist: (...args: any[]) => mockAddToWatchlist(...args),
  removeFromWatchlist: (...args: any[]) => mockRemoveFromWatchlist(...args),
  getWatchlistItem: (...args: any[]) => mockGetWatchlistItem(...args),
}));

const mockFetchContinueWatchForContent = jest.fn().mockResolvedValue(null);
const mockClearContinueWatchProgress = jest.fn().mockResolvedValue(true);

jest.mock('../src/services/watchProgressService', () => ({
  fetchContinueWatchForContent: (...args: any[]) =>
    mockFetchContinueWatchForContent(...args),
  clearContinueWatchProgress: (...args: any[]) =>
    mockClearContinueWatchProgress(...args),
}));

describe('RichDetailsScreen Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {uid: 'test-user-123', email: 'test@example.com'};
    mockUserProfile = {
      uid: 'test-user-123',
      subscription: 'Premium',
      subscriptionStatus: 'active',
    };
    mockActiveProfile = {
      id: 'profile-adult-1',
      name: 'Adult User',
      isKids: false,
    };
    mockRouteParams = {
      params: {
        movie: {
          id: 'kalki-movie',
          title: 'Kalki 2898 AD',
          description:
            'Futuristic dystopian sci-fi epic set in the post-apocalyptic world of Kasi.',
          image: {uri: 'https://example.com/kalki.jpg'},
          rating: '⭐ 8.6 / 10',
          badge: 'TELUGU • HINDI • ENGLISH',
          cast: 'Prabhas, Amitabh Bachchan, Kamal Haasan, Deepika Padukone',
          director: 'Nag Ashwin',
          meta: ['2024', '4K UHD', '3h 1m'],
          contentType: 'movie',
          videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        },
      },
    };
  });

  describe('Movie Details UI', () => {
    it('renders movie title, synopsis, badge, rating, and meta tags correctly', () => {
      const screen = render(<MovieDetailScreen />);

      expect(screen.getByTestId('movie-detail-screen')).toBeTruthy();
      expect(screen.getAllByText('Kalki 2898 AD').length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          'Futuristic dystopian sci-fi epic set in the post-apocalyptic world of Kasi.',
        ),
      ).toBeTruthy();
      expect(screen.getAllByText('TELUGU • HINDI • ENGLISH').length).toBeGreaterThan(0);
      expect(screen.getAllByText('⭐ 8.6 / 10').length).toBeGreaterThan(0);
      expect(screen.getByText('3h 1m')).toBeTruthy();
    });

    it('renders cast and crew members with names and roles in carousel', () => {
      const screen = render(<MovieDetailScreen />);

      expect(screen.getByTestId('cast-crew-list')).toBeTruthy();
      expect(screen.getByText('Nag Ashwin')).toBeTruthy();
      expect(screen.getByText('Prabhas')).toBeTruthy();
      expect(screen.getByText('Amitabh Bachchan')).toBeTruthy();
      expect(screen.getByText('Kamal Haasan')).toBeTruthy();
      expect(screen.getByText('Director')).toBeTruthy();
      expect(screen.getAllByText('Cast').length).toBeGreaterThan(0);
    });

    it('renders recommendation items in More Like This carousel', () => {
      const screen = render(<MovieDetailScreen />);

      expect(screen.getByTestId('recommendations-list')).toBeTruthy();
      expect(screen.getByText('More Like This')).toBeTruthy();
    });

    it('handles Watch button press and navigates to VideoPlayer with movie content', () => {
      const screen = render(<MovieDetailScreen />);

      const playBtn = screen.getByTestId('detail-play-button');
      fireEvent.press(playBtn);

      expect(mockNavigate).toHaveBeenCalledWith(
        Routes.VideoPlayer,
        expect.objectContaining({
          movie: expect.objectContaining({id: 'kalki-movie'}),
          videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        }),
      );
    });

    it('renders trailer button when trailer videoUrl is present and plays trailer', () => {
      const screen = render(<MovieDetailScreen />);

      const trailerBtn = screen.getByTestId('detail-trailer-button');
      expect(trailerBtn).toBeTruthy();

      fireEvent.press(trailerBtn);
      expect(mockNavigate).toHaveBeenCalledWith(
        Routes.VideoPlayer,
        expect.objectContaining({
          isTrailer: true,
          videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
        }),
      );
    });
  });

  describe('Series Details UI, Season Selector & Episode List', () => {
    beforeEach(() => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'angel-one',
            title: 'Star Trek: The Next Generation',
            description: 'The Enterprise visits the planet Angel One.',
            image: {uri: 'https://example.com/trek.jpg'},
            rating: '⭐ 8.9 / 10',
            genre: 'Sci-Fi • Adventure',
            cast: 'Patrick Stewart, Jonathan Frakes, LeVar Burton',
            director: 'Gene Roddenberry',
            meta: ['2024', 'Series', 'HD'],
            contentType: 'series',
          },
        },
      };
    });

    it('renders series header with Season count in metadata', () => {
      const screen = render(<MovieDetailScreen />);

      expect(screen.getByText('Star Trek: The Next Generation')).toBeTruthy();
      expect(screen.getByText('1 Season')).toBeTruthy();
    });

    it('renders season selector and episode list for series content', () => {
      const screen = render(<MovieDetailScreen />);

      expect(screen.getByTestId('season-selector')).toBeTruthy();
      expect(screen.getByTestId('season-tab-1')).toBeTruthy();
      expect(screen.getByTestId('episode-list')).toBeTruthy();
      expect(screen.getByText('Season 1 Episodes')).toBeTruthy();
    });

    it('renders episode card metadata: episode badge, title, and runtime', () => {
      const screen = render(<MovieDetailScreen />);

      expect(screen.getByTestId('episode-card-angel-one')).toBeTruthy();
      expect(screen.getByText('EP 14')).toBeTruthy();
      expect(screen.getByText('Angel One')).toBeTruthy();
    });

    it('selecting an episode navigates to VideoPlayer with episode content and episode ID', () => {
      const screen = render(<MovieDetailScreen />);

      const epCard = screen.getByTestId('episode-card-angel-one-ep-15');
      fireEvent.press(epCard);

      expect(mockNavigate).toHaveBeenCalledWith(
        Routes.VideoPlayer,
        expect.objectContaining({
          movie: expect.objectContaining({
            id: 'angel-one-ep-15',
            contentType: 'episode',
            episodeNumber: 15,
          }),
          source: 'details',
        }),
      );
    });
  });

  describe('Watchlist and Continue Watching Integration', () => {
    it('allows toggling Watchlist state from Add to In My List and back', async () => {
      const screen = render(<MovieDetailScreen />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 50));
      });

      await waitFor(() => {
        expect(screen.getByTestId('my-list-button')).toBeTruthy();
      });

      const watchlistBtn = screen.getByTestId('my-list-button');
      expect(screen.getByText('+ Add to My List')).toBeTruthy();

      await act(async () => {
        fireEvent.press(watchlistBtn);
      });

      await waitFor(() => {
        expect(mockAddToWatchlist).toHaveBeenCalledWith(
          'profile-adult-1',
          expect.objectContaining({id: 'kalki-movie'}),
        );
        expect(screen.getByText('✓ In My List')).toBeTruthy();
      });

      await act(async () => {
        fireEvent.press(screen.getByTestId('my-list-button'));
      });

      await waitFor(() => {
        expect(mockRemoveFromWatchlist).toHaveBeenCalledWith(
          'profile-adult-1',
          'kalki-movie',
        );
        expect(screen.getByText('+ Add to My List')).toBeTruthy();
      });
    });

    it('shows Resume button and progress bar when continue watch progress exists', async () => {
      mockFetchContinueWatchForContent.mockResolvedValue({
        contentId: 'kalki-movie',
        title: 'Kalki 2898 AD',
        progress: 0.65,
        currentTime: 7000,
        updatedAt: new Date().toISOString(),
      });

      const screen = render(<MovieDetailScreen />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 50));
      });

      await waitFor(() => {
        expect(screen.getByText('Continue Watching')).toBeTruthy();
        expect(screen.getByText('65%')).toBeTruthy();
        expect(screen.getByTestId('remove-watchlist-button')).toBeTruthy();
      });

      // Pressing remove continue watching clears it
      const removeCwBtn = screen.getByTestId('remove-watchlist-button');
      await act(async () => {
        fireEvent.press(removeCwBtn);
      });

      expect(mockClearContinueWatchProgress).toHaveBeenCalledWith(
        'profile-adult-1',
        'kalki-movie',
      );
    });
  });

  describe('Entitlement and Subscription Enforcement', () => {
    it('shows ContentBlockedBanner when active profile is restricted by parental controls', () => {
      mockActiveProfile = {
        id: 'kids-prof-1',
        name: 'Little Kid',
        isKids: true,
        kidsMaturityLimit: 'KIDS',
      };
      mockRouteParams = {
        params: {
          movie: {
            id: 'restricted-action-movie',
            title: 'Violent Action Flick',
            maturityRating: '18_PLUS',
            image: {uri: 'https://example.com/violent.jpg'},
          },
        },
      };

      const screen = render(<MovieDetailScreen />);

      expect(screen.getByTestId('movie-detail-blocked-state')).toBeTruthy();
      expect(screen.queryByTestId('detail-play-button')).toBeNull();
    });

    it('navigates to Subscription screen when Choose Plan is pressed for unentitled content', () => {
      mockUserProfile = {
        uid: 'user-free-1',
        subscription: 'Free',
        subscriptionStatus: 'active',
      };
      mockRouteParams = {
        params: {
          movie: {
            id: 'global-blockbusters-avatar',
            title: 'Avatar The Way of Water',
            badge: '4K UHD',
            image: {uri: 'https://example.com/avatar.jpg'},
            videoUrl: 'https://example.com/protected.mpd',
          },
        },
      };

      const screen = render(<MovieDetailScreen />);

      const subscribeBtn = screen.getByTestId('entitlement-action-button');
      expect(subscribeBtn).toBeTruthy();

      fireEvent.press(subscribeBtn);
      expect(mockNavigate).toHaveBeenCalledWith(Routes.Subscription, {
        sourceScreen: 'MovieDetail',
      });
    });
  });

  describe('Error, Loading, and Stale State Handling', () => {
    it('renders Content Not Found error card with Retry and Home options when ID cannot be resolved', async () => {
      mockRouteParams = {
        params: {
          movieId: 'totally-invalid-movie-id-999',
        },
      };

      const screen = render(<MovieDetailScreen />);

      await act(async () => {
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 50));
      });

      await waitFor(() => {
        expect(screen.getByTestId('detail-error-state')).toBeTruthy();
        expect(screen.getByText('CONTENT NOT FOUND')).toBeTruthy();
        expect(screen.getByTestId('detail-retry-button')).toBeTruthy();
        expect(screen.getByTestId('detail-error-home-button')).toBeTruthy();
      });

      fireEvent.press(screen.getByTestId('detail-error-home-button'));
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });

    it('navigates back to Home when Back button is pressed on the details screen', () => {
      const screen = render(<MovieDetailScreen />);

      const backBtn = screen.getByTestId('detail-back-button');
      fireEvent.press(backBtn);

      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  describe('Amazon Vega OS TV Remote Handling', () => {
    it('handles remote play/pause event to start playback', () => {
      const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
      render(<MovieDetailScreen />);

      const handlers = useTVEventHandler.mock.calls.map((c: any) => c[0]);
      handlers.forEach((h: any) => {
        try {
          h({eventType: 'playpause', eventKeyAction: 0});
        } catch {}
      });

      expect(mockNavigate).toHaveBeenCalledWith(
        Routes.VideoPlayer,
        expect.objectContaining({
          movie: expect.objectContaining({id: 'kalki-movie'}),
        }),
      );
    });

    it('handles remote back event to return to Home', () => {
      const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
      render(<MovieDetailScreen />);

      const handlers = useTVEventHandler.mock.calls.map((c: any) => c[0]);
      handlers.forEach((h: any) => {
        try {
          h({eventType: 'back', eventKeyAction: 0});
        } catch {}
      });

      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });
});
