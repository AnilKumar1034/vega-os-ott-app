import 'react-native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {MyListScreen} from '../src/screens/MyListScreen';
import * as watchlistService from '../src/services/watchlistService';
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

const mockWatchlist = [
  {
    contentId: 'kalki',
    title: 'Kalki 2898 AD',
    genre: 'Sci-Fi',
    image: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
    type: 'movie',
    addedAt: '2026-08-25T12:00:00.000Z',
  },
  {
    contentId: 'jawan',
    title: 'Jawan',
    genre: 'Action',
    image: 'https://image.tmdb.org/t/p/w780/jFt1gS4BGHlK8xt76Y81Alp4dbt.jpg',
    type: 'movie',
    addedAt: '2026-08-25T10:00:00.000Z',
  },
];

describe('MyListScreen', () => {
  let mockFetchWatchlist: jest.SpyInstance;
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

    mockFetchWatchlist = jest
      .spyOn(watchlistService, 'fetchWatchlist')
      .mockResolvedValue(mockWatchlist);
  });

  afterEach(() => {
    mockFetchWatchlist.mockRestore();
    mockUseAuth.mockRestore();
    mockUseProfile.mockRestore();
  });

  it('1. Renders My List screen and loads active profile watchlist items', async () => {
    const screen = render(<MyListScreen />);

    await waitFor(() => {
      expect(mockFetchWatchlist).toHaveBeenCalledWith('profile-anil');
      expect(screen.getByText('Kalki 2898 AD')).toBeTruthy();
      expect(screen.getByText('Jawan')).toBeTruthy();
      expect(screen.getByText('2 Saved Titles')).toBeTruthy();
    });
  });

  it('2. Renders empty state when watchlist is empty and navigates to Movies on Explore click', async () => {
    mockFetchWatchlist.mockResolvedValueOnce([]);

    const screen = render(<MyListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('my-list-empty-state')).toBeTruthy();
      expect(screen.getByText(strings.myList.emptyTitle)).toBeTruthy();
      expect(screen.getByTestId('my-list-explore-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('my-list-explore-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Movies');
  });

  it('3. Renders error state with Retry button on load failure', async () => {
    mockFetchWatchlist.mockRejectedValueOnce(new Error('NETWORK_ERROR'));

    const screen = render(<MyListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('my-list-error-state')).toBeTruthy();
      expect(screen.getByTestId('my-list-retry-button')).toBeTruthy();
    });

    mockFetchWatchlist.mockResolvedValueOnce(mockWatchlist);
    fireEvent.press(screen.getByTestId('my-list-retry-button'));

    await waitFor(() => {
      expect(mockFetchWatchlist).toHaveBeenCalledTimes(2);
    });
  });

  it('4. Switching profiles queries new profile watchlist immediately', async () => {
    const {rerender} = render(<MyListScreen />);

    await waitFor(() => {
      expect(mockFetchWatchlist).toHaveBeenCalledWith('profile-anil');
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

    rerender(<MyListScreen />);

    await waitFor(() => {
      expect(mockFetchWatchlist).toHaveBeenCalledWith('profile-kids');
    });
  });

  it('5. Allows searching and navigating from empty state action buttons', async () => {
    mockFetchWatchlist.mockResolvedValueOnce([]);

    const screen = render(<MyListScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('my-list-empty-state')).toBeTruthy();
      expect(screen.getByTestId('my-list-search-button')).toBeTruthy();
      expect(screen.getByTestId('my-list-home-button')).toBeTruthy();
    });

    // Press Search button
    fireEvent.press(screen.getByTestId('my-list-search-button'));
    expect(screen.getByTestId('common-search-input')).toBeTruthy();

    // Press Home button
    fireEvent.press(screen.getByTestId('my-list-home-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('6. Shows clear search button when search query has no matching items', async () => {
    const screen = render(<MyListScreen />);

    await waitFor(() => {
      expect(screen.getByText('Kalki 2898 AD')).toBeTruthy();
    });

    const searchInput = screen.getByTestId('common-search-input');
    fireEvent.changeText(searchInput, 'NonExistentTitle');

    await waitFor(() => {
      expect(screen.getByTestId('my-list-empty-state')).toBeTruthy();
      expect(screen.getByTestId('my-list-clear-search-button')).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId('my-list-clear-search-button'));
    await waitFor(() => {
      expect(screen.getByText('Kalki 2898 AD')).toBeTruthy();
    });
  });
});
