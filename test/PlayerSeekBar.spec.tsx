import 'react-native';
import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  PlayerSeekBar,
  LongPressAboveThumb,
  FastForwardRewindAboveThumb,
  ThumbnailAboveThumb,
  ThumbnailBelowThumb,
} from '../src/components/molecules/PlayerSeekBar';
import {
  getSeekbarThumbnailSource,
  THUMBNAIL_BASE_URL,
  TOTAL_IMAGES,
} from '../src/constants/thumbnails';
import {
  getExactVideoThumbnail,
  fetchDynamicVideoThumbnail,
  buildDynamicVideoThumbnailUrl,
  prefetchDynamicVideoThumbnails,
  clearThumbnailCache,
  getThumbnailCacheSize,
  MOVIE_EXACT_THUMBNAILS,
  ANGEL_ONE_EXACT_VIDEO_FRAMES,
} from '../src/constants/videoThumbnails';
import {homeHeroSlides} from '../src/data/home';
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

    it('immediately updates time display as currentTime prop advances during playback', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={10}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );

      expect(screen.getByText('00:10 / 05:00')).toBeTruthy();

      screen.rerender(
        <PlayerSeekBar
          type="markers"
          currentTime={25}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );
      expect(screen.getByText('00:25 / 05:00')).toBeTruthy();

      screen.rerender(
        <PlayerSeekBar
          type="markers"
          currentTime={90}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );
      expect(screen.getByText('01:30 / 05:00')).toBeTruthy();
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

  describe('Feature 4: Long Press Seekbar', () => {
    it('renders long press seekbar with acceleration badge and long-press pill', () => {
      const screen = render(
        <PlayerSeekBar
          type="long-press"
          currentTime={40}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
          onInteraction={mockOnInteraction}
        />,
      );

      expect(screen.getByTestId('player-seekbar-container')).toBeTruthy();
      expect(screen.getByTestId('player-long-press-badge')).toBeTruthy();
      expect(
        screen.getByText('Long Press: Speed Acceleration (1x, 2x, 3x, 4x, 5x)'),
      ).toBeTruthy();
      expect(screen.getByTestId('type-pill-long-press')).toBeTruthy();
    });

    it('LongPressAboveThumb renders directional labels and progressive speed multipliers', () => {
      // Normal rewind (-10)
      const rewScreen = render(
        <LongPressAboveThumb
          mode="rewind"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(rewScreen.getByText('-10')).toBeTruthy();

      // Normal forward (+10)
      const fwdScreen = render(
        <LongPressAboveThumb
          mode="forward"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(fwdScreen.getByText('+10')).toBeTruthy();

      // Fast forward with acceleration multipliers
      const fastFwd2x = render(
        <LongPressAboveThumb
          mode="fast_forward"
          multiplier={2}
          stepValue={10}
          focused={true}
        />,
      );
      expect(fastFwd2x.getByText('2x')).toBeTruthy();
      expect(fastFwd2x.getByTestId('long-press-forward-img')).toBeTruthy();

      const fastFwd4x = render(
        <LongPressAboveThumb
          mode="fast_forward"
          multiplier={4}
          stepValue={10}
          focused={true}
        />,
      );
      expect(fastFwd4x.getByText('3x')).toBeTruthy();

      // Fast rewind with acceleration multiplier 8 -> '5x'
      const fastRew8x = render(
        <LongPressAboveThumb
          mode="fast_rewind"
          multiplier={8}
          stepValue={10}
          focused={true}
        />,
      );
      expect(fastRew8x.getByText('5x')).toBeTruthy();
      expect(fastRew8x.getByTestId('long-press-rewind-img')).toBeTruthy();
    });
  });

  describe('Feature 5: Fast Forward / Rewind Seekbar', () => {
    it('renders fast forward / rewind seekbar with skip buttons and type pill', () => {
      const screen = render(
        <PlayerSeekBar
          type="fast-forward-rewind"
          currentTime={50}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
          onInteraction={mockOnInteraction}
        />,
      );

      expect(screen.getByTestId('player-skip-controls')).toBeTruthy();
      expect(screen.getByTestId('player-rewind-button')).toBeTruthy();
      expect(screen.getByTestId('player-fast-forward-button')).toBeTruthy();
      expect(screen.getByTestId('type-pill-fast-forward-rewind')).toBeTruthy();
    });

    it('triggers seek backwards and forwards by 10s on skip button presses', () => {
      const screen = render(
        <PlayerSeekBar
          type="fast-forward-rewind"
          currentTime={50}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onInteraction={mockOnInteraction}
        />,
      );

      const rewBtn = screen.getByTestId('player-rewind-button');
      fireEvent.press(rewBtn);
      expect(mockOnSeek).toHaveBeenCalledWith(40);
      expect(mockOnInteraction).toHaveBeenCalled();

      const ffBtn = screen.getByTestId('player-fast-forward-button');
      fireEvent.press(ffBtn);
      expect(mockOnSeek).toHaveBeenCalledWith(50);
      expect(mockOnInteraction).toHaveBeenCalled();
    });

    it('triggers custom onFastForwardPress and onRewindPress callbacks if provided', () => {
      const mockFFPress = jest.fn();
      const mockRewPress = jest.fn();

      const screen = render(
        <PlayerSeekBar
          type="fast-forward-rewind"
          currentTime={50}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onFastForwardPress={mockFFPress}
          onRewindPress={mockRewPress}
          onInteraction={mockOnInteraction}
        />,
      );

      fireEvent.press(screen.getByTestId('player-rewind-button'));
      expect(mockRewPress).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId('player-fast-forward-button'));
      expect(mockFFPress).toHaveBeenCalledTimes(1);
    });

    it('FastForwardRewindAboveThumb renders skip feedback with speed indicator and images', () => {
      // Normal rewind (-10)
      const rewScreen = render(
        <FastForwardRewindAboveThumb
          mode="rewind"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(rewScreen.getByText('-10')).toBeTruthy();

      // Normal forward (+10)
      const fwdScreen = render(
        <FastForwardRewindAboveThumb
          mode="forward"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(fwdScreen.getByText('+10')).toBeTruthy();

      // Fast forward with multiplier 1 -> '1x'
      const ff1x = render(
        <FastForwardRewindAboveThumb
          mode="fast_forward"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(ff1x.getByText('1x')).toBeTruthy();
      expect(ff1x.getByTestId('fast-forward-rewind-ff-img')).toBeTruthy();

      // Fast rewind with multiplier 3 -> '3x'
      const rew3x = render(
        <FastForwardRewindAboveThumb
          mode="fast_rewind"
          multiplier={3}
          stepValue={10}
          focused={true}
        />,
      );
      expect(rew3x.getByText('3x')).toBeTruthy();
      expect(rew3x.getByTestId('fast-forward-rewind-rew-img')).toBeTruthy();
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

      fireEvent.press(screen.getByTestId('type-pill-long-press'));
      expect(mockOnTypeChange).toHaveBeenCalledWith('long-press');

      fireEvent.press(screen.getByTestId('type-pill-fast-forward-rewind'));
      expect(mockOnTypeChange).toHaveBeenCalledWith('fast-forward-rewind');

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

    it('displays SEEKBAR: LONG PRESS for movie with seekbarType: long-press', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'kalki',
            title: 'Kalki 2898 AD',
            genre: 'Sci-Fi',
            seekbarType: 'long-press',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(screen.getByText('SEEKBAR: LONG PRESS')).toBeTruthy();
        expect(screen.getByTestId('player-long-press-badge')).toBeTruthy();
      });
    });

    it('displays SEEKBAR: FAST FORWARD / REWIND for movie with seekbarType: fast-forward-rewind', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'interstellar',
            title: 'Interstellar',
            genre: 'Sci-Fi',
            seekbarType: 'fast-forward-rewind',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(screen.getByText('SEEKBAR: FAST FORWARD / REWIND')).toBeTruthy();
        expect(screen.getByTestId('player-skip-controls')).toBeTruthy();
      });
    });
  });

  describe('Feature 6: Live Streaming Seekbar', () => {
    it('does NOT render forward and backward options in live streaming', () => {
      const screen = render(
        <PlayerSeekBar
          type="fast-forward-rewind"
          currentTime={100}
          duration={0}
          isPaused={false}
          isLive={true}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
          onInteraction={mockOnInteraction}
        />,
      );

      // Must NOT contain forward and backward options
      expect(screen.queryByTestId('player-fast-forward-button')).toBeNull();
      expect(screen.queryByTestId('player-rewind-button')).toBeNull();
      expect(screen.queryByTestId('player-skip-controls')).toBeNull();
      expect(screen.queryByTestId('type-pill-fast-forward-rewind')).toBeNull();
      expect(screen.queryByTestId('seekbar-type-selector')).toBeNull();
      expect(screen.queryByTestId('player-remove-marker-button')).toBeNull();
      expect(screen.queryByTestId('player-add-marker-button')).toBeNull();
      expect(screen.queryByTestId('player-limits-badge')).toBeNull();
      expect(screen.queryByTestId('player-long-press-badge')).toBeNull();
    });

    it('renders only necessary livestream elements: play/pause toggle, live badge, and live stream status', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={50}
          duration={0}
          isPaused={false}
          isLive={true}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
        />,
      );

      // Play / Pause toggle must be present
      expect(screen.getByTestId('player-play-pause-toggle')).toBeTruthy();

      // LIVE badge and indicators must be present
      expect(screen.getByTestId('player-live-badge')).toBeTruthy();
      expect(screen.getByText('LIVE')).toBeTruthy();
      expect(screen.getByTestId('player-time-display')).toBeTruthy();
      expect(screen.getByText('● LIVE')).toBeTruthy();

      // Livestream status tag
      expect(screen.getByTestId('player-live-tag')).toBeTruthy();
      expect(screen.getByText('LIVE STREAM')).toBeTruthy();

      // Live seekbar wrapper
      expect(screen.getByTestId('vega-seekbar-wrapper')).toBeTruthy();
    });

    it('allows toggling play and pause during live streaming', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={50}
          duration={0}
          isPaused={true}
          isLive={true}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
        />,
      );

      const playPauseBtn = screen.getByTestId('player-play-pause-toggle');
      expect(playPauseBtn).toBeTruthy();

      fireEvent.press(playPauseBtn);
      expect(mockOnTogglePlayPause).toHaveBeenCalledTimes(1);
    });

    it('renders LIVE STREAM badge in VideoPlayerScreen for live streams', async () => {
      mockRouteParams = {
        params: {
          isLive: true,
          movie: {
            id: 'live-news-channel',
            title: 'Live 24x7 News',
            genre: 'News',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(
          screen.getAllByText('LIVE STREAM').length,
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByTestId('player-live-badge')).toBeTruthy();
        expect(screen.queryByTestId('player-fast-forward-button')).toBeNull();
        expect(screen.queryByTestId('player-rewind-button')).toBeNull();
      });
    });
  });

  describe('Feature 7: Thumbnail Images (Video preview images during seek interactions)', () => {
    it('renders thumbnail-images seekbar with thumbnail badge, time display, and play/pause button', () => {
      const screen = render(
        <PlayerSeekBar
          type="thumbnail-images"
          currentTime={120}
          duration={600}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onTypeChange={mockOnTypeChange}
          onInteraction={mockOnInteraction}
        />,
      );

      expect(screen.getByTestId('player-seekbar-container')).toBeTruthy();
      expect(screen.getByTestId('player-time-display')).toBeTruthy();
      expect(screen.getByText('02:00 / 10:00')).toBeTruthy();
      expect(screen.getByTestId('player-play-pause-toggle')).toBeTruthy();
      expect(screen.getByTestId('player-thumbnails-badge')).toBeTruthy();
      expect(screen.getByTestId('type-pill-thumbnail-images')).toBeTruthy();
      expect(screen.getByTestId('vega-seekbar-wrapper')).toBeTruthy();
    });

    it('switches to thumbnail-images when clicking thumbnail type pill', () => {
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

      const thumbPill = screen.getByTestId('type-pill-thumbnail-images');
      fireEvent.press(thumbPill);

      expect(mockOnTypeChange).toHaveBeenCalledWith('thumbnail-images');
      expect(mockOnInteraction).toHaveBeenCalled();
    });

    it('ThumbnailAboveThumb renders directional feedback, speed multipliers, and seek icons', () => {
      // 1. Fast forward mode with 2x multiplier
      const screen1 = render(
        <ThumbnailAboveThumb
          mode="fast_forward"
          multiplier={2}
          stepValue={10}
          focused={true}
        />,
      );
      expect(screen1.getByTestId('above-thumb-thumbnail')).toBeTruthy();
      expect(screen1.getByTestId('thumbnail-speed-label')).toBeTruthy();
      expect(screen1.getByText('2x')).toBeTruthy();
      expect(screen1.getByTestId('thumbnail-forward-img')).toBeTruthy();
      expect(screen1.queryByTestId('thumbnail-rewind-img')).toBeNull();

      // 2. Fast rewind mode with 4x multiplier
      const screen2 = render(
        <ThumbnailAboveThumb
          mode="fast_rewind"
          multiplier={4}
          stepValue={10}
          focused={true}
        />,
      );
      expect(screen2.getByText('4x')).toBeTruthy();
      expect(screen2.getByTestId('thumbnail-rewind-img')).toBeTruthy();
      expect(screen2.queryByTestId('thumbnail-forward-img')).toBeNull();

      // 3. Normal rewind mode with 1x multiplier (-10)
      const screen3 = render(
        <ThumbnailAboveThumb
          mode="rewind"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(screen3.getByText('-10')).toBeTruthy();

      // 4. Normal forward mode with 1x multiplier (+10)
      const screen4 = render(
        <ThumbnailAboveThumb
          mode="forward"
          multiplier={1}
          stepValue={10}
          focused={true}
        />,
      );
      expect(screen4.getByText('+10')).toBeTruthy();
    });

    it('ThumbnailBelowThumb renders preview metadata label below thumbnail preview', () => {
      const screen = render(<ThumbnailBelowThumb />);
      expect(screen.getByTestId('below-thumb-thumbnail')).toBeTruthy();
      expect(screen.getByTestId('thumbnail-below-label-text')).toBeTruthy();
      expect(screen.getByText('Preview')).toBeTruthy();
    });

    it('getSeekbarThumbnailSource generates sequentially padded CloudFront image URLs', () => {
      expect(THUMBNAIL_BASE_URL).toBe(
        'https://d1v0fxmwkpxbrg.cloudfront.net/seekbar-assets/images/thumbnail-examples/',
      );
      expect(TOTAL_IMAGES).toBe(68);

      // thumbValue 0 -> index 0 -> 00.jpg
      expect(getSeekbarThumbnailSource(0)).toEqual({
        uri: `${THUMBNAIL_BASE_URL}00.jpg`,
      });

      // thumbValue 10 -> index 1 -> 01.jpg
      expect(getSeekbarThumbnailSource(10)).toEqual({
        uri: `${THUMBNAIL_BASE_URL}01.jpg`,
      });

      // thumbValue 90 -> index 9 -> 09.jpg
      expect(getSeekbarThumbnailSource(90)).toEqual({
        uri: `${THUMBNAIL_BASE_URL}09.jpg`,
      });

      // thumbValue 670 -> index 67 -> 67.jpg
      expect(getSeekbarThumbnailSource(670)).toEqual({
        uri: `${THUMBNAIL_BASE_URL}67.jpg`,
      });

      // thumbValue 680 -> wrap-around back to 00.jpg
      expect(getSeekbarThumbnailSource(680)).toEqual({
        uri: `${THUMBNAIL_BASE_URL}00.jpg`,
      });

      // Negative or invalid input defaults safely to 00.jpg
      expect(getSeekbarThumbnailSource(-20)).toEqual({
        uri: `${THUMBNAIL_BASE_URL}00.jpg`,
      });
    });

    it('displays SEEKBAR: THUMBNAIL IMAGES badge for movie with seekbarType: thumbnail-images', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'movie-thumbnail-demo',
            title: 'Thumbnail Images Demo',
            genre: 'Demo',
            seekbarType: 'thumbnail-images',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(screen.getByText('SEEKBAR: THUMBNAIL IMAGES')).toBeTruthy();
      });
    });

    it('displays SEEKBAR: THUMBNAIL IMAGES badge for movie with id containing thumbnail', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'trickplay-thumbnail-preview',
            title: 'Trickplay Video Preview',
            genre: 'Action',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('player-seekbar-type-badge')).toBeTruthy();
        expect(screen.getByText('SEEKBAR: THUMBNAIL IMAGES')).toBeTruthy();
      });
    });

    it('buildDynamicVideoThumbnailUrl builds dynamic URLs directly from video stream', () => {
      // Dynamic frame sequence derived from the video stream timeline
      const angelStart = buildDynamicVideoThumbnailUrl(
        'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
        0,
        120,
      );
      expect(angelStart).toBe(`${THUMBNAIL_BASE_URL}00.jpg`);

      const angelMid = buildDynamicVideoThumbnailUrl(
        'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
        60,
        120,
      );
      expect(angelMid).toBe(`${THUMBNAIL_BASE_URL}30.jpg`);

      // Template with {time}
      const timeTemplate = buildDynamicVideoThumbnailUrl(
        'https://stream-cdn.com/trickplay?time={time}',
        45,
        120,
      );
      expect(timeTemplate).toBe('https://stream-cdn.com/trickplay?time=45');

      // Template with {index}
      const indexTemplate = buildDynamicVideoThumbnailUrl(
        'https://stream-cdn.com/frames/thumb_{index}.jpg',
        60,
        120,
      );
      expect(indexTemplate).toBe('https://stream-cdn.com/frames/thumb_30.jpg');

      // End of video timeline clamps safely
      const endOfVideo = buildDynamicVideoThumbnailUrl(
        'https://media.w3.org/2010/05/sintel/trailer.mp4',
        120,
        120,
      );
      expect(endOfVideo).toBe(`${THUMBNAIL_BASE_URL}60.jpg`);
    });

    it('getExactVideoThumbnail resolves dynamic uri directly from video stream without static images', () => {
      clearThumbnailCache();

      const result = getExactVideoThumbnail({
        thumbValue: 30,
        duration: 120,
        videoUrl:
          'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
      });

      // Must be a dynamic remote URI, never a local static require() number
      expect(result).toHaveProperty('uri');
      expect((result as any).uri).toBe(`${THUMBNAIL_BASE_URL}15.jpg`);
    });

    it('fetchDynamicVideoThumbnail queries Shaka Player image tracks dynamically if available', async () => {
      clearThumbnailCache();

      const mockPlayer = {
        getImageTracks: jest
          .fn()
          .mockReturnValue([
            {id: 99, width: 320, height: 180, bandwidth: 50000},
          ]),
        getThumbnails: jest.fn().mockResolvedValue({
          uris: [
            'https://stream-provider.com/dynamic-thumb-track-99-time-45.jpg',
          ],
          startTime: 40,
          endTime: 50,
        }),
      };

      const result = await fetchDynamicVideoThumbnail({
        thumbValue: 45,
        duration: 300,
        videoUrl: 'https://stream-provider.com/master.mpd',
        player: mockPlayer,
      });

      expect(mockPlayer.getImageTracks).toHaveBeenCalled();
      expect(mockPlayer.getThumbnails).toHaveBeenCalledWith(99, 45);
      expect(result).toEqual({
        uri: 'https://stream-provider.com/dynamic-thumb-track-99-time-45.jpg',
      });
    });

    it('uses dynamic remote URLs when movie.thumbnails array is provided', () => {
      clearThumbnailCache();

      const customThumbnails = [
        'https://custom-cdn.com/dynamic_frame_01.jpg',
        'https://custom-cdn.com/dynamic_frame_02.jpg',
        'https://custom-cdn.com/dynamic_frame_03.jpg',
      ];

      const thumbMid = getExactVideoThumbnail({
        thumbValue: 150,
        duration: 300,
        movie: {thumbnails: customThumbnails},
      });
      expect(thumbMid).toEqual({
        uri: 'https://custom-cdn.com/dynamic_frame_02.jpg',
      });
    });

    it('caches dynamically fetched thumbnails in memory and supports prefetching', async () => {
      clearThumbnailCache();
      expect(getThumbnailCacheSize()).toBe(0);

      await prefetchDynamicVideoThumbnails(
        'https://media.w3.org/2010/05/bunny/trailer.mp4',
        30,
        60,
        10,
      );

      expect(getThumbnailCacheSize()).toBeGreaterThan(0);

      clearThumbnailCache();
      expect(getThumbnailCacheSize()).toBe(0);
    });

    it('PlayerSeekBar integrates dynamic video thumbnails with videoUrl, movie, and player props', () => {
      const mockPlayer = {
        getImageTracks: jest.fn().mockReturnValue([]),
      };

      const screen = render(
        <PlayerSeekBar
          type="thumbnail-images"
          currentTime={40}
          duration={120}
          isPaused={false}
          videoUrl="https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd"
          movie={{id: 'angel-one-movie', title: 'Angel One'}}
          player={mockPlayer}
          onSeek={mockOnSeek}
        />,
      );

      expect(screen.getByTestId('player-seekbar-container')).toBeTruthy();
      expect(screen.getByTestId('type-pill-thumbnail-images')).toBeTruthy();
      expect(screen.getByTestId('player-thumbnails-badge')).toBeTruthy();
    });

    it('resolves exact dynamic thumbnails for Kalki 2898 AD instead of mock CloudFront data', () => {
      clearThumbnailCache();

      const thumbStart = getExactVideoThumbnail({
        thumbValue: 0,
        duration: 300,
        movie: {
          id: 'kalki',
          title: 'Kalki 2898 AD',
          image: {
            uri: 'https://image.tmdb.org/t/p/w1280/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
          },
        },
      });

      expect(thumbStart).toHaveProperty('uri');
      expect((thumbStart as any).uri).toContain('o8XSR1SONnjcsv84NRu6Mwsl5io');
      expect((thumbStart as any).uri).not.toContain(
        'rstcAnBeCkxNQjNp3YXrF6IP1tW',
      );
      expect((thumbStart as any).uri).not.toBe(`${THUMBNAIL_BASE_URL}00.jpg`);
    });

    it('resolves exact dynamic thumbnails for The Lion King instead of mock CloudFront data', () => {
      clearThumbnailCache();

      const thumb = getExactVideoThumbnail({
        thumbValue: 50,
        duration: 300,
        movie: {
          id: 'the-lion-king-hero',
          title: 'The Lion King',
          image: {
            uri: 'https://image.tmdb.org/t/p/w1280/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
          },
        },
      });

      expect(thumb).toHaveProperty('uri');
      expect((thumb as any).uri).not.toContain('sKCr78MXSLixwmZ8DyJLrpMsd15');
      expect(
        MOVIE_EXACT_THUMBNAILS['the-lion-king-hero'].includes(
          (thumb as any).uri,
        ),
      ).toBe(true);
      expect((thumb as any).uri).not.toBe(`${THUMBNAIL_BASE_URL}10.jpg`);
    });

    it('resolves exact dynamic thumbnails for RRR instead of mock CloudFront data', () => {
      clearThumbnailCache();

      const thumb = getExactVideoThumbnail({
        thumbValue: 120,
        duration: 300,
        movie: {
          id: 'horizon',
          title: 'RRR: Multi-Audio Edition',
          image: {
            uri: 'https://image.tmdb.org/t/p/w1280/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg',
          },
        },
      });

      expect(thumb).toHaveProperty('uri');
      expect((thumb as any).uri).not.toContain('u0XUBNQWlOvrh0Gd97ARGpIkL0');
      expect(MOVIE_EXACT_THUMBNAILS['rrr'].includes((thumb as any).uri)).toBe(
        true,
      );
      expect((thumb as any).uri).not.toBe(`${THUMBNAIL_BASE_URL}27.jpg`);
    });

    it('dynamically changes thumbnails as seek position progresses along video timeline', () => {
      clearThumbnailCache();

      const movie = {
        id: 'kalki-dynamic',
        title: 'Kalki 2898 AD',
        thumbnails: [
          'https://image.tmdb.org/t/p/w780/frame1.jpg',
          'https://image.tmdb.org/t/p/w780/frame2.jpg',
          'https://image.tmdb.org/t/p/w780/frame3.jpg',
          'https://image.tmdb.org/t/p/w780/frame4.jpg',
        ],
      };

      const start = getExactVideoThumbnail({
        thumbValue: 10,
        duration: 400,
        movie,
      });
      const quarter = getExactVideoThumbnail({
        thumbValue: 120,
        duration: 400,
        movie,
      });
      const half = getExactVideoThumbnail({
        thumbValue: 220,
        duration: 400,
        movie,
      });
      const end = getExactVideoThumbnail({
        thumbValue: 390,
        duration: 400,
        movie,
      });

      expect((start as any).uri).toBe(
        'https://image.tmdb.org/t/p/w780/frame1.jpg',
      );
      expect((quarter as any).uri).toBe(
        'https://image.tmdb.org/t/p/w780/frame2.jpg',
      );
      expect((half as any).uri).toBe(
        'https://image.tmdb.org/t/p/w780/frame3.jpg',
      );
      expect((end as any).uri).toBe(
        'https://image.tmdb.org/t/p/w780/frame4.jpg',
      );
    });

    it('isolates cache keys so different movies sharing the same videoUrl show their exact thumbnails', () => {
      clearThumbnailCache();

      const sharedVideoUrl =
        'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd';

      const movieA = {
        id: 'movie-kalki',
        title: 'Kalki 2898 AD',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/rstcAnBeCkxNQjNp3YXrF6IP1tW.jpg',
        },
      };

      const movieB = {
        id: 'movie-lion-king',
        title: 'The Lion King',
        image: {
          uri: 'https://image.tmdb.org/t/p/w780/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg',
        },
      };

      const thumbA = getExactVideoThumbnail({
        thumbValue: 60,
        duration: 300,
        videoUrl: sharedVideoUrl,
        movie: movieA,
      });

      const thumbB = getExactVideoThumbnail({
        thumbValue: 60,
        duration: 300,
        videoUrl: sharedVideoUrl,
        movie: movieB,
      });

      expect((thumbA as any).uri).not.toBe((thumbB as any).uri);
      expect(
        MOVIE_EXACT_THUMBNAILS['kalki'].includes((thumbA as any).uri),
      ).toBe(true);
      expect(
        MOVIE_EXACT_THUMBNAILS['the-lion-king'].includes((thumbB as any).uri),
      ).toBe(true);
    });

    it('resolves exact dynamic thumbnails from movie image when movie has no explicit thumbnails array', () => {
      clearThumbnailCache();

      const movie = {
        id: 'custom-movie-123',
        title: 'Custom Title',
        image: {uri: 'https://image.tmdb.org/t/p/w780/custom_image_hash.jpg'},
      };

      const thumb = getExactVideoThumbnail({
        thumbValue: 30,
        duration: 100,
        movie,
      });

      expect((thumb as any).uri).toContain('custom_image_hash.jpg');
    });
  });

  describe('Mock Video Exact Seeking Previews (1:1 Frame-accurate Seekbar)', () => {
    it('homeHeroSlides[0] is configured as mock video with exact video thumbnails', () => {
      const mockVideo = homeHeroSlides[0];
      expect(mockVideo.id).toBe('mock-video-seek-preview');
      expect(mockVideo.seekbarType).toBe('thumbnail-images');
      expect(mockVideo.videoUrl).toBe(
        'https://storage.googleapis.com/shaka-demo-assets/angel-one/dash.mpd',
      );
      expect(mockVideo.thumbnails).toBe(ANGEL_ONE_EXACT_VIDEO_FRAMES);
      expect(mockVideo.thumbnails?.length).toBe(30);
    });

    it('scrubbing across mock video timeline resolves exact video thumbnails for each seek position', () => {
      clearThumbnailCache();

      const mockVideo = homeHeroSlides[0];
      const duration = 60;

      // Position 0s -> Frame 0 (USS Enterprise in warp)
      const thumb0 = getExactVideoThumbnail({
        thumbValue: 0,
        duration,
        videoUrl: mockVideo.videoUrl,
        movie: mockVideo,
      });
      expect((thumb0 as any).uri).toBe(ANGEL_ONE_EXACT_VIDEO_FRAMES[0]);

      // Position 10s -> Frame 5
      const thumb10 = getExactVideoThumbnail({
        thumbValue: 10,
        duration,
        videoUrl: mockVideo.videoUrl,
        movie: mockVideo,
      });
      expect((thumb10 as any).uri).toBe(ANGEL_ONE_EXACT_VIDEO_FRAMES[5]);

      // Position 20s -> Frame 10 (Captain Picard at bridge viewscreen)
      const thumb20 = getExactVideoThumbnail({
        thumbValue: 20,
        duration,
        videoUrl: mockVideo.videoUrl,
        movie: mockVideo,
      });
      expect((thumb20 as any).uri).toBe(ANGEL_ONE_EXACT_VIDEO_FRAMES[10]);

      // Position 40s -> Frame 20 (Bridge command crew)
      const thumb40 = getExactVideoThumbnail({
        thumbValue: 40,
        duration,
        videoUrl: mockVideo.videoUrl,
        movie: mockVideo,
      });
      expect((thumb40 as any).uri).toBe(ANGEL_ONE_EXACT_VIDEO_FRAMES[20]);

      // Position 58s -> Frame 29 (Final frame)
      const thumb58 = getExactVideoThumbnail({
        thumbValue: 58,
        duration,
        videoUrl: mockVideo.videoUrl,
        movie: mockVideo,
      });
      expect((thumb58 as any).uri).toBe(ANGEL_ONE_EXACT_VIDEO_FRAMES[29]);

      // Confirm that the resolved thumbnails are from the video itself and never unrelated movie stills
      expect((thumb0 as any).uri).not.toContain('rstcAnBeCkxNQjNp3YXrF6IP1tW'); // Not Kalki
      expect((thumb20 as any).uri).not.toContain('jFt1gS4BGHlK8xt76Y81Alp4dbt'); // Not Jawan
      expect((thumb40 as any).uri).not.toContain('sKCr78MXSLixwmZ8DyJLrpMsd15'); // Not Lion King
    });

    it('PlayerSeekBar renders with thumbnail-images and binds mock video thumbnail source', () => {
      const mockVideo = homeHeroSlides[0];
      const screen = render(
        <PlayerSeekBar
          type="thumbnail-images"
          currentTime={20}
          duration={60}
          isPaused={false}
          videoUrl={mockVideo.videoUrl}
          movie={mockVideo}
          onSeek={jest.fn()}
        />,
      );

      expect(screen.getByTestId('player-seekbar-container')).toBeTruthy();
      expect(screen.getByTestId('player-thumbnails-badge')).toBeTruthy();
    });
  });

  describe('Feature 8: Skip Intro and Start from Beginning Options', () => {
    it('renders Start from Beginning and Skip Intro buttons inside seekbar for VOD content', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={40}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
          onInteraction={mockOnInteraction}
        />,
      );

      expect(
        screen.getByTestId('player-start-from-beginning-button'),
      ).toBeTruthy();
      expect(screen.getByTestId('player-skip-intro-button')).toBeTruthy();
      expect(screen.getByText('Start from Beginning')).toBeTruthy();
      expect(screen.getByText('Skip Intro')).toBeTruthy();
      expect(screen.getByTestId('player-quick-playback-controls')).toBeTruthy();
    });

    it('triggers seek to 0 when Start from Beginning button is pressed', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={60}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onInteraction={mockOnInteraction}
        />,
      );

      const startBtn = screen.getByTestId('player-start-from-beginning-button');
      fireEvent.press(startBtn);

      expect(mockOnSeek).toHaveBeenCalledWith(0);
      expect(mockOnInteraction).toHaveBeenCalled();

      screen.rerender(
        <PlayerSeekBar
          type="markers"
          currentTime={0}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );
      expect(screen.getByText('00:00 / 05:00')).toBeTruthy();
    });

    it('triggers seek forward by few seconds (10s) when Skip Intro button is pressed', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={15}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onInteraction={mockOnInteraction}
        />,
      );

      const skipIntroBtn = screen.getByTestId('player-skip-intro-button');
      fireEvent.press(skipIntroBtn);

      expect(mockOnSeek).toHaveBeenCalledWith(25);
      expect(mockOnInteraction).toHaveBeenCalled();

      screen.rerender(
        <PlayerSeekBar
          type="markers"
          currentTime={25}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );
      expect(screen.getByText('00:25 / 05:00')).toBeTruthy();
    });

    it('allows multiple consecutive Skip Intro clicks advancing forward each time', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={0}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onInteraction={mockOnInteraction}
        />,
      );

      const skipIntroBtn = screen.getByTestId('player-skip-intro-button');
      fireEvent.press(skipIntroBtn);
      expect(mockOnSeek).toHaveBeenCalledWith(10);

      fireEvent.press(skipIntroBtn);
      expect(mockOnSeek).toHaveBeenCalledWith(20);
    });

    it('clamps Skip Intro seek time to safeDuration near end of video', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={295}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );

      const skipIntroBtn = screen.getByTestId('player-skip-intro-button');
      fireEvent.press(skipIntroBtn);

      expect(mockOnSeek).toHaveBeenCalledWith(300);

      screen.rerender(
        <PlayerSeekBar
          type="markers"
          currentTime={300}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
        />,
      );
      expect(screen.getByText('05:00 / 05:00')).toBeTruthy();
    });

    it('supports custom skipIntroSeconds prop if provided', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={10}
          duration={300}
          isPaused={false}
          skipIntroSeconds={30}
          onSeek={mockOnSeek}
        />,
      );

      const skipIntroBtn = screen.getByTestId('player-skip-intro-button');
      fireEvent.press(skipIntroBtn);

      expect(mockOnSeek).toHaveBeenCalledWith(40);
    });

    it('supports movie.introDuration if defined on movie item', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={5}
          duration={300}
          isPaused={false}
          movie={{id: 'custom-movie', introDuration: 20}}
          onSeek={mockOnSeek}
        />,
      );

      const skipIntroBtn = screen.getByTestId('player-skip-intro-button');
      fireEvent.press(skipIntroBtn);

      expect(mockOnSeek).toHaveBeenCalledWith(25);
    });

    it('does NOT render Start from Beginning and Skip Intro in live streaming mode', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={50}
          duration={0}
          isPaused={false}
          isLive={true}
          onSeek={mockOnSeek}
          onTogglePlayPause={mockOnTogglePlayPause}
        />,
      );

      expect(
        screen.queryByTestId('player-start-from-beginning-button'),
      ).toBeNull();
      expect(screen.queryByTestId('player-skip-intro-button')).toBeNull();
      expect(screen.queryByTestId('player-quick-playback-controls')).toBeNull();
      expect(screen.queryByText('Start from Beginning')).toBeNull();
      expect(screen.queryByText('Skip Intro')).toBeNull();
    });

    it('triggers custom onStartFromBeginningPress and onSkipIntroPress callbacks if provided', () => {
      const mockStartPress = jest.fn();
      const mockSkipPress = jest.fn();

      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={50}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onStartFromBeginningPress={mockStartPress}
          onSkipIntroPress={mockSkipPress}
        />,
      );

      fireEvent.press(screen.getByTestId('player-start-from-beginning-button'));
      expect(mockStartPress).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId('player-skip-intro-button'));
      expect(mockSkipPress).toHaveBeenCalledTimes(1);
    });

    it('triggers custom onStartFromBeginning and onSkipIntro handlers if provided', () => {
      const mockStartHandler = jest.fn();
      const mockSkipHandler = jest.fn();

      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={40}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onStartFromBeginning={mockStartHandler}
          onSkipIntro={mockSkipHandler}
        />,
      );

      fireEvent.press(screen.getByTestId('player-start-from-beginning-button'));
      expect(mockStartHandler).toHaveBeenCalledTimes(1);

      fireEvent.press(screen.getByTestId('player-skip-intro-button'));
      expect(mockSkipHandler).toHaveBeenCalledWith(10);
    });

    it('handles focus and blur events for Start from Beginning and Skip Intro buttons', () => {
      const screen = render(
        <PlayerSeekBar
          type="markers"
          currentTime={30}
          duration={300}
          isPaused={false}
          onSeek={mockOnSeek}
          onInteraction={mockOnInteraction}
        />,
      );

      const startBtn = screen.getByTestId('player-start-from-beginning-button');
      const skipBtn = screen.getByTestId('player-skip-intro-button');

      fireEvent(startBtn, 'focus');
      expect(mockOnInteraction).toHaveBeenCalled();
      fireEvent(startBtn, 'blur');

      fireEvent(skipBtn, 'focus');
      expect(mockOnInteraction).toHaveBeenCalled();
      fireEvent(skipBtn, 'blur');
    });

    it('integrates with VideoPlayerScreen during VOD playback', () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'movie-vod-test',
            title: 'Inception',
            genre: 'Sci-Fi',
            seekbarType: 'markers',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);

      expect(
        screen.getByTestId('player-start-from-beginning-button'),
      ).toBeTruthy();
      expect(screen.getByTestId('player-skip-intro-button')).toBeTruthy();

      fireEvent.press(screen.getByTestId('player-start-from-beginning-button'));
      fireEvent.press(screen.getByTestId('player-skip-intro-button'));
    });
  });
});
