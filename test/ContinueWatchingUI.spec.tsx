import 'react-native';
import {render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {HomeScreen} from '../src/screens/HomeScreen';
import * as watchProgressService from '../src/services/watchProgressService';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

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
        ReactMock.createElement(Text, null, row.title),
        row.items?.map((item: any) =>
          ReactMock.createElement(
            Text,
            {key: item.id, testID: `item-${item.id}`},
            item.title,
          ),
        ),
      );
    },
  };
});

describe('HomeScreen Continue Watching Profile-Aware Integration', () => {
  let mockFetchContinueWatchItems: jest.SpyInstance;
  let mockUseAuth: jest.SpyInstance;
  let mockUseProfile: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth = jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'test-user-123'} as any,
      userProfile: null,
      loading: false,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      updateProfile: jest.fn(),
    });

    mockFetchContinueWatchItems = jest
      .spyOn(watchProgressService, 'fetchContinueWatchItems')
      .mockResolvedValue([]);
  });

  afterEach(() => {
    mockFetchContinueWatchItems.mockRestore();
    mockUseAuth.mockRestore();
    if (mockUseProfile) {
      mockUseProfile.mockRestore();
    }
  });

  it('fetches continue watching specifically for activeProfile.id', async () => {
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

    mockFetchContinueWatchItems.mockResolvedValueOnce([
      {
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        progress: 0.35,
        currentTime: 3500,
        updatedAt: '2026-08-25T10:00:00.000Z',
      },
    ]);

    const screen = render(<HomeScreen />);

    await waitFor(() => {
      expect(mockFetchContinueWatchItems).toHaveBeenCalledWith('profile-anil');
      expect(screen.getByTestId('row-continue-watching')).toBeTruthy();
      expect(screen.getByTestId('item-kalki')).toBeTruthy();
    });
  });

  it('clears Continue Watching row when activeProfile has no items', async () => {
    mockUseProfile = jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: {
        id: 'profile-kids',
        name: 'Kids',
        avatarId: 'avatar-3',
        isKids: true,
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

    mockFetchContinueWatchItems.mockResolvedValueOnce([]);

    const screen = render(<HomeScreen />);

    await waitFor(() => {
      expect(mockFetchContinueWatchItems).toHaveBeenCalledWith('profile-kids');
      expect(screen.queryByTestId('row-continue-watching')).toBeNull();
    });
  });

  it('prevents stale previous-profile response from overwriting state (race condition)', async () => {
    let resolveProfileA: (val: any) => void = () => {};
    const delayedPromiseA = new Promise((resolve) => {
      resolveProfileA = resolve;
    });

    mockFetchContinueWatchItems.mockImplementation((profileId: string) => {
      if (profileId === 'profile-a') {
        return delayedPromiseA;
      }
      return Promise.resolve([
        {
          contentId: 'jawan',
          title: 'Jawan',
          progress: 0.5,
          currentTime: 5000,
          updatedAt: '2026-08-25T10:00:00.000Z',
        },
      ]);
    });

    let currentProfile = {
      id: 'profile-a',
      name: 'User A',
      avatarId: 'avatar-1',
      isKids: false,
      createdAt: 1000,
      updatedAt: 1000,
    };

    mockUseProfile = jest
      .spyOn(profileContext, 'useProfile')
      .mockImplementation(() => ({
        activeProfile: currentProfile,
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
      }));

    const screen = render(<HomeScreen />);

    // Fast switch to Profile B before Profile A finishes loading
    currentProfile = {
      id: 'profile-b',
      name: 'User B',
      avatarId: 'avatar-2',
      isKids: false,
      createdAt: 2000,
      updatedAt: 2000,
    };

    screen.rerender(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByTestId('item-jawan')).toBeTruthy();
    });

    // Profile A now finishes late
    resolveProfileA([
      {
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        progress: 0.35,
        currentTime: 3500,
        updatedAt: '2026-08-25T10:00:00.000Z',
      },
    ]);

    // Profile A's late response must NOT overwrite Profile B's data
    await waitFor(() => {
      expect(screen.getByTestId('item-jawan')).toBeTruthy();
      expect(screen.queryByTestId('item-kalki')).toBeNull();
    });
  });
});
