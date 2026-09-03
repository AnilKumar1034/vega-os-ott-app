import 'react-native';
import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {PlayerSeekBar} from '../src/components/molecules/PlayerSeekBar';
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
    currentTime = 45;
    duration = 300;
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
      id: 'movie-markers',
      title: 'Angel One (HLS Edition)',
      genre: 'Sci-Fi',
      seekbarType: 'markers',
    },
  },
};

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useRoute: () => mockRouteParams,
}));

describe('PlayerSeekBar - Markers, Break Markers & Segments, Seeking Limits', () => {
  const mockOnSeek = jest.fn();
  const mockOnTogglePlayPause = jest.fn();
  const mockOnTypeChange = jest.fn();
  const mockOnInteraction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature 1: Markers Seekbar', () => {
    it('renders markers seekbar with tick markers, time display, and play/pause button', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={60}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
          onInteraction={mockOnInteraction}
        />,
      );

      expect(screen.getByTestId('player-seekbar-container')).toBeTruthy();
      expect(screen.getByTestId('player-time-display')).toBeTruthy();
      expect(screen.getByText('01:00 / 05:00')).toBeTruthy();
      expect(screen.getByTestId('player-play-pause-toggle')).toBeTruthy();
      expect(screen.getByTestId('type-pill-markers')).toBeTruthy();
      expect(screen.getByTestId('vega-seekbar-wrapper')).toBeTruthy();
    });

    it('triggers play/pause toggle when play/pause button is pressed', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={60}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
        />,
      );

      const toggleBtn = screen.getByTestId('player-play-pause-toggle');
      fireEvent.press(toggleBtn);
      expect(mockOnTogglePlayPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('Feature 2: Break Markers & Segments Seekbar', () => {
    it('renders break markers & segments seekbar with add and remove marker controls', () => {
      const screen = render(
        <PlayerSeekBar
          type="break-markers"
          currentTime={90}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
          onInteraction={mockOnInteraction}
        />,
      );

      expect(screen.getByTestId('player-remove-marker-button')).toBeTruthy();
      expect(screen.getByTestId('player-add-marker-button')).toBeTruthy();
      expect(screen.getByTestId('type-pill-break-markers')).toBeTruthy();
    });

    it('allows dynamically adding and removing markers', () => {
      const screen = render(
        <PlayerSeekBar
          type="break-markers"
          currentTime={90}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onInteraction={mockOnInteraction}
        />,
      );

      const removeBtn = screen.getByTestId('player-remove-marker-button');
      fireEvent.press(removeBtn);
      expect(mockOnInteraction).toHaveBeenCalled();

      const addBtn = screen.getByTestId('player-add-marker-button');
      fireEvent.press(addBtn);
      expect(mockOnInteraction).toHaveBeenCalled();
    });
  });

  describe('Feature 3: Seeking Limits Seekbar', () => {
    it('renders seeking limits seekbar with allowed limits badge', () => {
      const screen = render(
        <PlayerSeekBar
          type="limits"
          currentTime={120}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
        />,
      );

      const limitsBadge = screen.getByTestId('player-limits-badge');
      expect(limitsBadge).toBeTruthy();
      expect(screen.getByText(/Limits: 00:45 – 04:15/)).toBeTruthy();
      expect(screen.getByTestId('type-pill-limits')).toBeTruthy();
    });
  });

  describe('Seekbar Type Switching Interaction', () => {
    it('calls onTypeChange when clicking different type pills', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={10}
          duration={200}
          isPaused={false}
          onSeek={mockOnSeek}
          onTypeChange={mockOnTypeChange}
        />,
      );

      fireEvent.press(screen.getByTestId('type-pill-break-markers'));
      expect(mockOnTypeChange).toHaveBeenCalledWith('break-markers');

      fireEvent.press(screen.getByTestId('type-pill-limits'));
      expect(mockOnTypeChange).toHaveBeenCalledWith('limits');

      fireEvent.press(screen.getByTestId('type-pill-markers'));
      expect(mockOnTypeChange).toHaveBeenCalledWith('markers');
    });
  });

  describe('VideoPlayerScreen integration with different seekbar types on different videos', () => {
    it('displays SEEKBAR: MARKERS badge for movie with seekbarType: markers', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'angel-one-hls',
            title: 'Angel One (HLS Multi-Audio)',
            genre: 'Sci-Fi',
            seekbarType: 'markers',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(screen.getByText('SEEKBAR: MARKERS')).toBeTruthy();
        expect(screen.getByTestId('player-seekbar-container')).toBeTruthy();
      });
    });

    it('displays SEEKBAR: BREAK MARKERS & SEGMENTS for movie with seekbarType: break-markers', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'angel-one',
            title: 'Angel One (DASH Multi-Audio)',
            genre: 'Sci-Fi',
            seekbarType: 'break-markers',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(
          screen.getByText('SEEKBAR: BREAK MARKERS & SEGMENTS'),
        ).toBeTruthy();
        expect(screen.getByTestId('player-remove-marker-button')).toBeTruthy();
      });
    });

    it('displays SEEKBAR: SEEKING LIMITS for movie with seekbarType: limits', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'the-lion-king-hero',
            title: 'The Lion King',
            genre: 'Animation',
            seekbarType: 'limits',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(screen.getByText('SEEKBAR: SEEKING LIMITS')).toBeTruthy();
        expect(screen.getByTestId('player-limits-badge')).toBeTruthy();
      });
    });
  });
});
