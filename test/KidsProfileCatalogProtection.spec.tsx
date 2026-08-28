import React from 'react';
import {render, waitFor} from '@testing-library/react-native';
import {HomeScreen} from '../src/screens/HomeScreen';
import {MovieDetailScreen} from '../src/screens/MovieDetailScreen';
import {SearchScreen} from '../src/screens/SearchScreen';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';
import {UserProfile} from '../src/profiles/types/Profile';

import * as watchProgressService from '../src/services/watchProgressService';
import * as watchlistService from '../src/services/watchlistService';

(jest as any).now = Date.now;

const mockNavigate = jest.fn();
const mockReplace = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    canGoBack: () => true,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

describe('Kids Profile Catalog Protection & Access Enforcement', () => {
  const adultProfile: UserProfile = {
    id: 'profile-adult',
    name: 'Adult User',
    avatarId: 'avatar-1',
    isKids: false,
    createdAt: 1000,
    updatedAt: 1000,
  };

  const kidsProfile: UserProfile = {
    id: 'profile-kids',
    name: 'Kids User',
    avatarId: 'avatar-kids',
    isKids: true,
    kidsMaturityLimit: 'KIDS',
    createdAt: 1000,
    updatedAt: 1000,
  };

  const createProfileMockContext = (activeProfile: UserProfile) => ({
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
    jest.spyOn(watchProgressService, 'fetchContinueWatchItems').mockResolvedValue([]);
    jest.spyOn(watchlistService, 'fetchWatchlist').mockResolvedValue([]);
    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'user-123'} as any,
      userProfile: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('HomeScreen Catalog Filtering', () => {
    it('shows full catalog and adult content when adult profile is active', async () => {
      jest
        .spyOn(profileContext, 'useProfile')
        .mockReturnValue(createProfileMockContext(adultProfile));

      const screen = render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
        // Adult items exist
        expect(screen.queryByTestId('content-card-summit')).toBeTruthy();
        expect(screen.queryByTestId('content-card-trending-4')).toBeTruthy();
      });
    });

    it('filters out mature and unclassified content when Kids profile is active', async () => {
      jest
        .spyOn(profileContext, 'useProfile')
        .mockReturnValue(createProfileMockContext(kidsProfile));

      const screen = render(<HomeScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('home-screen')).toBeTruthy();
        // 13+ and 16+ content must NOT appear on Kids (KIDS limit) home screen
        expect(screen.queryByTestId('content-card-summit')).toBeNull();
        expect(screen.queryByTestId('content-card-trending-4')).toBeNull();
        // Kids content should be visible
        expect(
          screen.queryByTestId('content-card-the-lion-king'),
        ).toBeTruthy();
      });
    });
  });

  describe('MovieDetailScreen Access Guard', () => {
    it('renders ContentBlockedBanner when Kids profile views mature content', async () => {
      jest
        .spyOn(profileContext, 'useProfile')
        .mockReturnValue(createProfileMockContext(kidsProfile));

      const adultMovie = {
        id: 'animal-2023',
        title: 'Animal',
        maturityRating: '18_PLUS',
        image: {uri: 'https://example.com/animal.jpg'},
      };

      const routeMock = jest.requireMock('@react-navigation/native');
      routeMock.useRoute = () => ({
        params: {movie: adultMovie, movieId: adultMovie.id},
      });

      const detailScreen = render(<MovieDetailScreen />);

      await waitFor(() => {
        expect(
          detailScreen.getByTestId('movie-detail-blocked-state'),
        ).toBeTruthy();
        expect(
          detailScreen.getAllByText(/Content Restricted/i).length,
        ).toBeGreaterThanOrEqual(1);
      });
    });

    it('renders full MovieDetail view when Kids profile views kid-safe content', async () => {
      jest
        .spyOn(profileContext, 'useProfile')
        .mockReturnValue(createProfileMockContext(kidsProfile));

      const kidsMovie = {
        id: 'the-lion-king',
        title: 'The Lion King',
        maturityRating: 'KIDS',
        image: {uri: 'https://example.com/lionking.jpg'},
      };

      const routeMock = jest.requireMock('@react-navigation/native');
      routeMock.useRoute = () => ({
        params: {movie: kidsMovie, movieId: kidsMovie.id},
      });

      const detailScreen = render(<MovieDetailScreen />);

      await waitFor(() => {
        expect(
          detailScreen.queryByTestId('movie-detail-blocked-state'),
        ).toBeNull();
        expect(detailScreen.getByTestId('movie-detail-screen')).toBeTruthy();
      });
    });
  });
});
