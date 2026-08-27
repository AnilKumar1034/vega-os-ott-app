import 'react-native';
import {render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {MoviesScreen} from '../src/screens/MoviesScreen';
import * as watchProgressService from '../src/services/watchProgressService';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';
import {strings} from '../src/constants/strings';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    dispatch: jest.fn(),
  }),
}));

const mockContinueWatching = [
  {
    contentId: 'kalki',
    title: 'Kalki 2898 AD (In Progress)',
    imageUri: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
    progress: 0.45,
    currentTime: 1200,
    duration: 3600,
    updatedAt: '2026-08-26T10:00:00.000Z',
  },
];

describe('MoviesScreen (Real Continue Watching integration)', () => {
  let mockFetchContinueWatch: jest.SpyInstance;
  let mockUseAuth: jest.SpyInstance;
  let mockUseProfile: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth = jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'user-123'} as any,
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
    });

    mockFetchContinueWatch = jest
      .spyOn(watchProgressService, 'fetchContinueWatchItems')
      .mockResolvedValue(mockContinueWatching);
  });

  afterEach(() => {
    mockFetchContinueWatch.mockRestore();
    mockUseAuth.mockRestore();
    mockUseProfile.mockRestore();
  });

  it('1. Loads and renders real profile continue watching row when data exists', async () => {
    const screen = render(<MoviesScreen />);

    await waitFor(() => {
      expect(mockFetchContinueWatch).toHaveBeenCalledWith('profile-anil');
      expect(screen.getByText('Kalki 2898 AD (In Progress)')).toBeTruthy();
      expect(screen.getByText(strings.hero.continueWatching)).toBeTruthy();
    });
  });

  it('2. Does not show continue watching row when profile has no saved progress (no mock continue watching)', async () => {
    mockFetchContinueWatch.mockResolvedValueOnce([]);

    const screen = render(<MoviesScreen />);

    await waitFor(() => {
      expect(screen.queryByText('Kalki 2898 AD (In Progress)')).toBeNull();
      expect(screen.queryByText(strings.hero.continueWatching)).toBeNull();
      // Catalog items still render
      expect(screen.getByText('The Dark Knight')).toBeTruthy();
    });
  });

  it('3. Clears and refreshes continue watching when active profile changes', async () => {
    const {rerender} = render(<MoviesScreen />);

    await waitFor(() => {
      expect(mockFetchContinueWatch).toHaveBeenCalledWith('profile-anil');
    });

    mockUseProfile.mockReturnValue({
      activeProfile: {
        id: 'profile-kids',
        name: 'Kids',
        avatarId: 'avatar-kids-1',
        isKids: true,
        createdAt: 2000,
        updatedAt: 2000,
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
    });

    rerender(<MoviesScreen />);

    await waitFor(() => {
      expect(mockFetchContinueWatch).toHaveBeenCalledWith('profile-kids');
    });
  });
});
