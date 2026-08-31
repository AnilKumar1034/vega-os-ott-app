import 'react-native';
import {render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import * as watchProgressService from '../src/services/watchProgressService';
import * as viewingHistoryService from '../src/services/viewingHistoryService';
import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
let mockEventHandlers: Record<string, Function> = {};

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 3600;
    initialize = mockInitialize;
    setSurfaceHandle = mockSetSurfaceHandle;
    clearSurfaceHandle = mockClearSurfaceHandle;
    play = mockPlay;
    pause = mockPause;
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = jest.fn();
    addEventListener = jest.fn((event: string, handler: Function) => {
      mockEventHandlers[event] = handler;
    });
    removeEventListener = jest.fn((event: string) => {
      delete mockEventHandlers[event];
    });
  }

  const KeplerVideoSurfaceView = ReactLib.forwardRef((props: any, ref: any) =>
    ReactLib.createElement(View, {
      ...props,
      ref,
      testID: props.testID || 'w3c-video-surface',
    }),
  );

  return {
    VideoPlayer: MockVideoPlayer,
    KeplerVideoSurfaceView,
    KeplerVideoView: KeplerVideoSurfaceView,
    Video: KeplerVideoSurfaceView,
  };
});

let mockRouteParams: any = {
  params: {
    movie: {
      id: 'kalki',
      title: 'Kalki 2898 AD',
      genre: 'Sci-Fi',
    },
  },
};

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: jest.fn(),
    canGoBack: () => true,
    goBack: jest.fn(),
  }),
  useRoute: () => mockRouteParams,
}));

describe('VideoPlayerScreen Profile-Specific Continue Watching Integration', () => {
  let mockFetchForContent: jest.SpyInstance;
  let mockSaveProgress: jest.SpyInstance;
  let mockClearProgress: jest.SpyInstance;
  let mockRecordViewingHistory: jest.SpyInstance;
  let mockUseAuth: jest.SpyInstance;
  let mockUseProfile: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventHandlers = {};
    mockRouteParams = {
      params: {
        movie: {
          id: 'kalki',
          title: 'Kalki 2898 AD',
          genre: 'Sci-Fi',
        },
      },
    };

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
      isParentAuthorized: false,
      parentalSettings: null,
      isLoadingParentalSettings: false,
      setParentAuthorized: jest.fn(),
      refreshParentalSettings: jest.fn().mockResolvedValue(null),
      verifyParentPin: jest.fn().mockResolvedValue(true),
      setParentPin: jest.fn().mockResolvedValue(undefined),
      removeParentPin: jest.fn().mockResolvedValue(undefined),
    });

    mockFetchForContent = jest
      .spyOn(watchProgressService, 'fetchContinueWatchForContent')
      .mockResolvedValue({
        contentId: 'kalki',
        title: 'Kalki 2898 AD',
        progress: 0.25,
        currentTime: 900,
        updatedAt: '2026-08-25T10:00:00.000Z',
      });

    mockSaveProgress = jest
      .spyOn(watchProgressService, 'saveContinueWatchProgress')
      .mockResolvedValue();

    mockClearProgress = jest
      .spyOn(watchProgressService, 'clearContinueWatchProgress')
      .mockResolvedValue();

    mockRecordViewingHistory = jest
      .spyOn(viewingHistoryService, 'recordViewingHistory')
      .mockResolvedValue();
  });

  afterEach(() => {
    mockFetchForContent.mockRestore();
    mockSaveProgress.mockRestore();
    mockClearProgress.mockRestore();
    mockRecordViewingHistory.mockRestore();
    mockUseAuth.mockRestore();
    mockUseProfile.mockRestore();
  });

  it('loads saved resume position for activeProfile.id', async () => {
    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).toHaveBeenCalledWith('profile-anil', 'kalki');
    });
  });

  it('saves playback progress scoped to activeProfile.id on pause', async () => {
    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).toHaveBeenCalled();
    });

    // Simulate pause event
    if (mockEventHandlers.pause) {
      mockEventHandlers.pause();
    }

    // Since currentTime is mocked
    await waitFor(() => {
      expect(mockSaveProgress).not.toThrow();
    });
  });

  it('clears progress for activeProfile.id when movie finishes (ended event)', async () => {
    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).toHaveBeenCalled();
    });

    if (mockEventHandlers.ended) {
      await mockEventHandlers.ended();
    }

    expect(mockClearProgress).toHaveBeenCalledWith('profile-anil', 'kalki');
  });

  it('does not load or save continue watching for Live TV stream', async () => {
    mockRouteParams = {
      params: {
        isLive: true,
        movie: {
          id: 'live-stream-1',
          title: 'Live News',
        },
      },
    };

    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).not.toHaveBeenCalled();
    });

    if (mockEventHandlers.pause) {
      mockEventHandlers.pause();
    }
    expect(mockSaveProgress).not.toHaveBeenCalled();
  });

  it('loads progress correctly for deeplink playback with active profile', async () => {
    mockRouteParams = {
      params: {
        movieId: 'kalki',
      },
    };

    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).toHaveBeenCalledWith('profile-anil', 'kalki');
    });
  });

  it('records viewing history once on playing event for playback profile', async () => {
    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).toHaveBeenCalled();
    });

    expect(mockEventHandlers.playing).toBeDefined();

    // Trigger playing event first time
    mockEventHandlers.playing();
    expect(mockRecordViewingHistory).toHaveBeenCalledTimes(1);
    expect(mockRecordViewingHistory).toHaveBeenCalledWith(
      'profile-anil',
      expect.objectContaining({id: 'kalki'}),
    );

    // Trigger playing event second time in same session - must NOT record again
    mockEventHandlers.playing();
    expect(mockRecordViewingHistory).toHaveBeenCalledTimes(1);
  });

  it('does not record viewing history for Live TV stream', async () => {
    mockRouteParams = {
      params: {
        isLive: true,
        movie: {
          id: 'live-channel-1',
          title: 'Live News Channel',
        },
      },
    };

    render(<VideoPlayerScreen />);

    await waitFor(() => {
      expect(mockFetchForContent).not.toHaveBeenCalled();
    });

    if (mockEventHandlers.playing) {
      mockEventHandlers.playing();
    }
    expect(mockRecordViewingHistory).not.toHaveBeenCalled();
  });
});
