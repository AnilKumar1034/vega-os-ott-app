import 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';

import * as authContext from '../src/context/authContext';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 3600;
    captioning = false;
    audioTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      emitEvent: jest.fn(),
    };
    textTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      emitEvent: jest.fn(),
    };
    initialize = mockInitialize;
    setSurfaceHandle = mockSetSurfaceHandle;
    clearSurfaceHandle = mockClearSurfaceHandle;
    play = mockPlay;
    pause = mockPause;
    deinitialize = jest.fn().mockResolvedValue(undefined);
    deinitializeSync = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
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
      id: 'test-movie',
      title: 'Test Feature Movie',
      genre: 'Action',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    },
  },
};

const mockShakaLoad = jest.fn().mockResolvedValue(undefined);
const mockShakaDestroy = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/shakaplayer/ShakaPlayer', () => ({
  ShakaPlayer: jest.fn().mockImplementation(() => ({
    load: mockShakaLoad,
    destroy: mockShakaDestroy,
    player: {
      getTextTracks: jest.fn().mockReturnValue([]),
      getVariantTracks: jest.fn().mockReturnValue([]),
      setTextTrackVisibility: jest.fn(),
      selectAudioLanguage: jest.fn(),
    },
  })),
}));

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    canGoBack: () => true,
    goBack: jest.fn(),
  }),
  useRoute: () => mockRouteParams,
}));

describe('VideoPlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {
      params: {
        movie: {
          id: 'test-movie',
          title: 'Test Feature Movie',
          genre: 'Action',
          videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        },
      },
    };
    jest.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {uid: 'test-user'} as any,
      loading: false,
    } as any);
    jest.spyOn(profileContext, 'useProfile').mockReturnValue({
      activeProfile: {
        id: 'profile-primary',
        name: 'Primary User',
        isKids: false,
        avatar: 'avatar1',
        createdAt: 1000,
      },
    } as any);
  });

  it('renders VideoPlayerScreen with title, back button, and video surface', async () => {
    const screen = render(<VideoPlayerScreen />);

    expect(screen.getByTestId('video-player-screen')).toBeTruthy();
    await waitFor(() => {
      const surface = screen.getByTestId('w3c-video-surface');
      expect(surface.props.videoPlayer).toBeTruthy();
    });
    expect(screen.getByText('Test Feature Movie')).toBeTruthy();
    expect(screen.getByTestId('player-back-button')).toBeTruthy();
  });

  it('enables the native TV controls after player initialization', async () => {
    const screen = render(<VideoPlayerScreen />);

    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 1100));
    });

    await waitFor(() => {
      const surface = screen.getByTestId('w3c-video-surface');
      expect(surface.props.showControls).toBe(true);
      expect(mockInitialize).toHaveBeenCalled();
      expect(mockPlay).toHaveBeenCalled();
    });
  });

  it('navigates back to Home when back button is pressed', async () => {
    const screen = render(<VideoPlayerScreen />);

    const backBtn = screen.getByTestId('player-back-button');
    fireEvent.press(backBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('enables default player controls and settings for Shaka player (DASH stream)', async () => {
    mockRouteParams = {
      params: {
        movie: {
          id: 'shaka-movie',
          title: 'Shaka Test Movie',
          genre: 'Sci-Fi',
        },
        streamType: 'dash',
        videoUrl:
          'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
      },
    };

    const screen = render(<VideoPlayerScreen />);

    await waitFor(() => {
      const surface = screen.getByTestId('w3c-video-surface');
      expect(surface.props.showControls).toBe(true);
      expect(surface.props.showCaptions).toBe(true);
      expect(mockInitialize).toHaveBeenCalled();
    });
  });

  it('handles TV remote playpause event via useTVEventHandler', async () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    render(<VideoPlayerScreen />);

    expect(useTVEventHandler).toHaveBeenCalled();
    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('isSubtitlesModalOpenRef'));

    expect(tvEventHandler).toBeDefined();

    await act(async () => {
      tvEventHandler({eventType: 'playpause', eventKeyAction: 0});
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it('handles TV remote back event via useTVEventHandler and navigates to Home', async () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    render(<VideoPlayerScreen />);

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('isSubtitlesModalOpenRef'));

    expect(tvEventHandler).toBeDefined();

    await act(async () => {
      tvEventHandler({eventType: 'back', eventKeyAction: 0});
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('handles TV remote navigation and wake-up events', async () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const screen = render(<VideoPlayerScreen />);

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('isSubtitlesModalOpenRef'));

    expect(tvEventHandler).toBeDefined();

    // Simulate key down for directional/menu keys
    await act(async () => {
      tvEventHandler({eventType: 'up', eventKeyAction: 0});
      tvEventHandler({eventType: 'down', eventKeyAction: 0});
      tvEventHandler({eventType: 'left', eventKeyAction: 0});
      tvEventHandler({eventType: 'right', eventKeyAction: 0});
      tvEventHandler({eventType: 'menu', eventKeyAction: 0});
    });

    // Controls overlay should be visible
    expect(screen.getByTestId('player-back-button')).toBeTruthy();
  });

  it('handles TV remote stop event by pausing playback', async () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    render(<VideoPlayerScreen />);

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('isSubtitlesModalOpenRef'));

    expect(tvEventHandler).toBeDefined();

    await act(async () => {
      tvEventHandler({eventType: 'stop', eventKeyAction: 0});
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it('handles TV remote OK / kpenter on back button to navigate to Home', async () => {
    const {useTVEventHandler} = require('@amazon-devices/react-native-kepler');
    const screen = render(<VideoPlayerScreen />);

    // Focus back button
    fireEvent(screen.getByTestId('player-back-button'), 'focus');

    const tvEventHandler = useTVEventHandler.mock.calls
      .map((c: any) => c[0])
      .find((fn: any) => fn?.toString?.().includes('isSubtitlesModalOpenRef'));

    expect(tvEventHandler).toBeDefined();

    await act(async () => {
      tvEventHandler({eventType: 'kpenter', eventKeyAction: 0});
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  it('triggers playback session lifecycle telemetry (playback_started and stopped on back)', async () => {
    const {playbackSessionManager} = require('../src/analytics');
    const startSessionSpy = jest.spyOn(playbackSessionManager, 'startSession');
    const recordStopSpy = jest.spyOn(playbackSessionManager, 'recordStop');

    const screen = render(<VideoPlayerScreen />);

    expect(startSessionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        contentId: 'test-movie',
        contentTitle: 'Test Feature Movie',
        contentType: 'movie',
      }),
    );

    const backButton = screen.getByTestId('player-back-button');
    await act(async () => {
      fireEvent.press(backButton);
    });

    expect(recordStopSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'back_navigation',
      }),
    );
  });
});
