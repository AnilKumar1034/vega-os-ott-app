import 'react-native';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import * as React from 'react';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';

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

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => ({
    params: {
      movie: {
        id: 'test-movie',
        title: 'Test Feature Movie',
        genre: 'Action',
      },
    },
  }),
}));

describe('VideoPlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
