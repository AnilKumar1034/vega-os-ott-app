import {AppState} from 'react-native';
import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  formatSeasonEpisodeLabel,
  getLastWatchedEpisode,
  isAutoplayEnabled,
  saveLastWatchedEpisode,
} from '../src/services/episodeService';
import {
  curatedEpisodesMap,
  getEpisodesForContent,
  getNextEpisodeForContent,
} from '../src/data/episodes';
import {EpisodeItem} from '../src/types/episode';
import {NextEpisodeModal} from '../src/components/molecules/NextEpisodeModal';
import {VideoPlayerScreen} from '../src/screens/VideoPlayerScreen';
import {Routes} from '../src/constants/routes';
import * as profileContext from '../src/profiles/context/profileContext';

const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockSetSurfaceHandle = jest.fn();
const mockClearSurfaceHandle = jest.fn();
const mockPlay = jest.fn();
const mockPause = jest.fn();
const mockDeinitializeSync = jest.fn();
let mockPlayerInstance: any = null;

jest.mock('@amazon-devices/react-native-w3cmedia', () => {
  const ReactLib = require('react');
  const {View} = require('react-native');

  class MockVideoPlayer {
    autoplay = false;
    src = '';
    currentTime = 0;
    duration = 2700;
    captioning = false;
    audioTracks = {
      length: 0,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      emitEvent: jest.fn(),
    };
    videoTracks = {
      length: 0,
      selectedIndex: 0,
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
    deinitializeSync = mockDeinitializeSync;
    eventListeners: Record<string, Function[]> = {};

    addEventListener = jest.fn((event: string, cb: Function) => {
      if (!this.eventListeners[event]) {
        this.eventListeners[event] = [];
      }
      this.eventListeners[event].push(cb);
    });

    removeEventListener = jest.fn((event: string, cb: Function) => {
      if (this.eventListeners[event]) {
        this.eventListeners[event] = this.eventListeners[event].filter(
          (fn) => fn !== cb,
        );
      }
    });

    emit = (event: string, data?: any) => {
      const listeners = this.eventListeners[event] || [];
      listeners.forEach((fn) => fn(data));
    };

    getVideoPlaybackQuality = jest.fn().mockReturnValue({
      creationTime: 1000,
      droppedVideoFrames: 0,
      totalVideoFrames: 600,
    });

    constructor() {
      // eslint-disable-next-line consistent-this
      mockPlayerInstance = this;
    }
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
      id: 'angel-one',
      title: 'Angel One',
      genre: 'Sci-Fi',
      duration: 2700,
    },
  },
};

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

describe('Next Episode Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayerInstance = null;
    mockRouteParams = {
      params: {
        movie: {
          id: 'angel-one',
          title: 'Angel One',
          genre: 'Sci-Fi',
          duration: 2700,
        },
      },
    };
  });

  describe('episodeService unit tests', () => {
    it('formats season and episode into standard label', () => {
      expect(formatSeasonEpisodeLabel(1, 2)).toBe('S1:E2');
      expect(formatSeasonEpisodeLabel(2, 10)).toBe('S2:E10');
      expect(formatSeasonEpisodeLabel()).toBe('S1:E1');
    });

    it('determines autoplay enabled preference correctly from activeProfile and userProfile', () => {
      // 1. activeProfile.autoplay explicitly true
      expect(
        isAutoplayEnabled({autoplayEnabled: false}, {autoplay: true}),
      ).toBe(true);

      // 2. activeProfile.autoplay explicitly false
      expect(
        isAutoplayEnabled({autoplayEnabled: true}, {autoplay: false}),
      ).toBe(false);

      // 3. activeProfile.autoplay undefined, falls back to userProfile.autoplayEnabled
      expect(isAutoplayEnabled({autoplayEnabled: false}, {})).toBe(false);
      expect(isAutoplayEnabled({autoplayEnabled: true}, {})).toBe(true);

      // 4. Neither set, defaults to true
      expect(isAutoplayEnabled(null, null)).toBe(true);
      expect(isAutoplayEnabled({}, {})).toBe(true);
    });

    it('saves and retrieves last watched episode from storage', async () => {
      await saveLastWatchedEpisode('prof-1', 'series-tng', 'angel-one-ep-15');
      const retrieved = await getLastWatchedEpisode('prof-1', 'series-tng');
      expect(retrieved).toBe('angel-one-ep-15');
    });
  });

  describe('data/episodes resolution tests', () => {
    it('resolves curated episodes for Angel One series', () => {
      const episodes = getEpisodesForContent('angel-one');
      expect(episodes.length).toBeGreaterThanOrEqual(4);
      expect(episodes[0].id).toBe('angel-one');
      expect(episodes[1].id).toBe('angel-one-ep-15');
      expect(episodes[1].title).toBe('11001001');
    });

    it('resolves the next episode for Angel One as Episode 15 (11001001)', () => {
      const nextEp = getNextEpisodeForContent({
        id: 'angel-one',
        title: 'Angel One',
      });
      expect(nextEp).not.toBeNull();
      expect(nextEp?.id).toBe('angel-one-ep-15');
      expect(nextEp?.title).toBe('11001001');
      expect(nextEp?.episodeNumber).toBe(15);
      expect(nextEp?.seasonNumber).toBe(1);
    });

    it('resolves subsequent episode when current episode is Episode 15', () => {
      const nextEp = getNextEpisodeForContent(
        {id: 'angel-one', title: 'Angel One'},
        'angel-one-ep-15',
      );
      expect(nextEp).not.toBeNull();
      expect(nextEp?.id).toBe('angel-one-ep-16');
      expect(nextEp?.title).toBe('Too Short a Season');
    });

    it('returns null when current episode is the last episode in a series', () => {
      const allEpisodes = curatedEpisodesMap['angel-one'];
      const lastEpisode = allEpisodes[allEpisodes.length - 1];
      const nextEp = getNextEpisodeForContent(
        {id: 'angel-one', title: 'Angel One'},
        lastEpisode.id,
      );
      expect(nextEp).toBeNull();
    });

    it('resolves explicit nextEpisode if defined on movie or route params', () => {
      const customNext: EpisodeItem = {
        id: 'custom-ep-2',
        seriesId: 'custom-series',
        seasonNumber: 2,
        episodeNumber: 1,
        title: 'Custom Next Adventure',
        videoUrl: 'https://example.com/custom.mp4',
      };
      const result = getNextEpisodeForContent({
        id: 'custom-movie',
        title: 'Custom Movie',
        nextEpisode: customNext,
      });
      expect(result).toEqual(customNext);
    });

    it('resolves next episode from an explicit episodes array on the item', () => {
      const ep1: EpisodeItem = {
        id: 'ep-1',
        seriesId: 's-1',
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'Episode 1',
        videoUrl: 'https://example.com/1.mp4',
      };
      const ep2: EpisodeItem = {
        id: 'ep-2',
        seriesId: 's-1',
        seasonNumber: 1,
        episodeNumber: 2,
        title: 'Episode 2',
        videoUrl: 'https://example.com/2.mp4',
      };
      const result = getNextEpisodeForContent(
        {id: 'show-1', title: 'Show 1', episodes: [ep1, ep2]},
        'ep-1',
      );
      expect(result?.id).toBe('ep-2');
    });

    it('generates next episode for item with seriesId and episodeNumber metadata', () => {
      const result = getNextEpisodeForContent({
        id: 'random-series-ep-3',
        seriesId: 'my-sci-fi-show',
        seriesTitle: 'My Sci-Fi Show',
        seasonNumber: 1,
        episodeNumber: 3,
        title: 'Episode 3',
      });
      expect(result).not.toBeNull();
      expect(result?.episodeNumber).toBe(4);
      expect(result?.seasonNumber).toBe(1);
      expect(result?.seriesId).toBe('my-sci-fi-show');
    });
  });

  describe('NextEpisodeModal component tests', () => {
    const mockEpisode: EpisodeItem = {
      id: 'ep-next',
      seriesId: 'series-test',
      seriesTitle: 'Test Series',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'The Next Adventure',
      description: 'An thrilling journey awaits our heroes.',
      durationFormatted: '45m',
      videoUrl: 'https://example.com/ep2.mp4',
      image: require('../src/assets/background.png'),
      rating: '⭐ 9.0',
      maturityRating: '13_PLUS',
      genre: 'Action',
    };

    it('returns null when isOpen is false', () => {
      const {queryByTestId} = render(
        <NextEpisodeModal
          isOpen={false}
          nextEpisode={mockEpisode}
          countdownSeconds={5}
          autoplayEnabled={true}
          onPlayNow={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
      expect(queryByTestId('next-episode-modal')).toBeNull();
    });

    it('returns null when nextEpisode is null', () => {
      const {queryByTestId} = render(
        <NextEpisodeModal
          isOpen={true}
          nextEpisode={null}
          countdownSeconds={5}
          autoplayEnabled={true}
          onPlayNow={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
      expect(queryByTestId('next-episode-modal')).toBeNull();
    });

    it('renders NextEpisodeModal with badge, episode title, description, and countdown', () => {
      const {getByTestId, getByText} = render(
        <NextEpisodeModal
          isOpen={true}
          nextEpisode={mockEpisode}
          countdownSeconds={5}
          autoplayEnabled={true}
          onPlayNow={jest.fn()}
          onCancel={jest.fn()}
        />,
      );

      expect(getByTestId('next-episode-modal')).toBeTruthy();
      expect(getByTestId('next-episode-title')).toBeTruthy();
      expect(getByText('The Next Adventure')).toBeTruthy();
      expect(getByText('Test Series')).toBeTruthy();
      expect(getByText('S1:E2')).toBeTruthy();
      expect(getByText('An thrilling journey awaits our heroes.')).toBeTruthy();
      expect(getByTestId('next-episode-thumbnail')).toBeTruthy();
      expect(getByTestId('next-episode-play-now-btn')).toBeTruthy();
      expect(getByTestId('next-episode-cancel-btn')).toBeTruthy();
      expect(getByText('Playing next episode in 5s')).toBeTruthy();
    });

    it('shows autoplay disabled message when autoplayEnabled is false', () => {
      const {getByText, queryByText} = render(
        <NextEpisodeModal
          isOpen={true}
          nextEpisode={mockEpisode}
          countdownSeconds={5}
          autoplayEnabled={false}
          onPlayNow={jest.fn()}
          onCancel={jest.fn()}
        />,
      );

      expect(queryByText('Playing next episode in 5s')).toBeNull();
      expect(
        getByText('Autoplay is turned off in profile settings'),
      ).toBeTruthy();
    });

    it('triggers onPlayNow callback when Play Now button is pressed', () => {
      const onPlayNow = jest.fn();
      const {getByTestId} = render(
        <NextEpisodeModal
          isOpen={true}
          nextEpisode={mockEpisode}
          countdownSeconds={3}
          autoplayEnabled={true}
          onPlayNow={onPlayNow}
          onCancel={jest.fn()}
        />,
      );

      fireEvent.press(getByTestId('next-episode-play-now-btn'));
      expect(onPlayNow).toHaveBeenCalledTimes(1);
    });

    it('triggers onCancel callback when Cancel button is pressed', () => {
      const onCancel = jest.fn();
      const {getByTestId} = render(
        <NextEpisodeModal
          isOpen={true}
          nextEpisode={mockEpisode}
          countdownSeconds={3}
          autoplayEnabled={true}
          onPlayNow={jest.fn()}
          onCancel={onCancel}
        />,
      );

      fireEvent.press(getByTestId('next-episode-cancel-btn'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('VideoPlayerScreen Next Episode Integration', () => {
    it('does NOT open NextEpisodeModal initially during active playback', async () => {
      const screen = render(<VideoPlayerScreen />);
      await waitFor(() => {
        expect(screen.queryByTestId('next-episode-modal')).toBeNull();
      });
    });

    it('opens NextEpisodeModal and starts countdown when episode ends', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(mockPlayerInstance).toBeTruthy();
      });

      // Simulate video playing then ending
      act(() => {
        mockPlayerInstance.emit('playing');
      });

      // Simulate episode end
      act(() => {
        mockPlayerInstance.emit('ended');
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-modal')).toBeTruthy();
        expect(screen.getByTestId('next-episode-title')).toBeTruthy();
        expect(screen.getByText('11001001')).toBeTruthy();
        expect(screen.getByText('Playing next episode in 5s')).toBeTruthy();
      });
    });

    it('automatically plays next episode when countdown finishes (5s -> 0s) under autoplay', () => {
      jest.useFakeTimers();
      try {
        render(<VideoPlayerScreen />);
        expect(mockPlayerInstance).toBeTruthy();

        act(() => {
          mockPlayerInstance.emit('ended');
        });

        // Advance countdown timer by 6 seconds (5s countdown + 1s buffer)
        act(() => {
          jest.advanceTimersByTime(6000);
        });

        expect(mockReplace).toHaveBeenCalledWith(
          Routes.VideoPlayer,
          expect.objectContaining({
            movieId: 'angel-one-ep-15',
            movie: expect.objectContaining({
              id: 'angel-one-ep-15',
              title: '11001001',
            }),
            seek: 0,
            isLive: false,
          }),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('immediately plays next episode when user presses Play Now button', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(mockPlayerInstance).toBeTruthy();
      });

      act(() => {
        mockPlayerInstance.emit('ended');
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-play-now-btn')).toBeTruthy();
      });

      act(() => {
        fireEvent.press(screen.getByTestId('next-episode-play-now-btn'));
      });

      expect(mockReplace).toHaveBeenCalledWith(
        Routes.VideoPlayer,
        expect.objectContaining({
          movieId: 'angel-one-ep-15',
          movie: expect.objectContaining({
            id: 'angel-one-ep-15',
            title: '11001001',
          }),
        }),
      );
    });

    it('cancels countdown and dismisses modal when Cancel button is pressed', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(mockPlayerInstance).toBeTruthy();
      });

      act(() => {
        mockPlayerInstance.emit('ended');
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-cancel-btn')).toBeTruthy();
      });

      act(() => {
        fireEvent.press(screen.getByTestId('next-episode-cancel-btn'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('next-episode-modal')).toBeNull();
      });

      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does NOT start countdown or autoplay if autoplay is disabled in profile settings', async () => {
      jest.spyOn(profileContext, 'useProfile').mockReturnValue({
        activeProfile: {
          id: 'prof-no-autoplay',
          name: 'Manual Viewer',
          avatar: 'initial',
          autoplay: false,
        },
        profiles: [],
        selectProfile: jest.fn(),
        createProfile: jest.fn(),
        updateProfile: jest.fn(),
        deleteProfile: jest.fn(),
        hasActiveProfile: true,
      } as any);

      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(mockPlayerInstance).toBeTruthy();
      });

      act(() => {
        mockPlayerInstance.emit('ended');
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-modal')).toBeTruthy();
        expect(
          screen.getByText('Autoplay is turned off in profile settings'),
        ).toBeTruthy();
      });

      // Must NOT automatically navigate
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does NOT trigger next episode flow for Live TV streams', async () => {
      mockRouteParams = {
        params: {
          isLive: true,
          movieId: 'live-channel-1',
          movie: {id: 'live-channel-1', title: 'Live News', isLive: true},
        },
      };

      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(mockPlayerInstance).toBeTruthy();
      });

      act(() => {
        mockPlayerInstance.emit('ended');
      });

      expect(screen.queryByTestId('next-episode-modal')).toBeNull();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('triggers next episode modal via Next Episode button on seekbar', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-next-episode-button')).toBeTruthy();
      });

      act(() => {
        fireEvent.press(screen.getByTestId('player-next-episode-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-modal')).toBeTruthy();
        expect(screen.getByText('11001001')).toBeTruthy();
      });
    });

    it('cancels countdown timer when AppState transitions to background', async () => {
      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(mockPlayerInstance).toBeTruthy();
      });

      act(() => {
        mockPlayerInstance.emit('ended');
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-modal')).toBeTruthy();
      });

      // App transitions to background
      const appStateCall = (
        AppState.addEventListener as jest.Mock
      ).mock.calls.find((call: any) => call[0] === 'change');
      expect(appStateCall).toBeTruthy();
      const changeHandler = appStateCall[1];

      act(() => {
        changeHandler('background');
      });

      // Must NOT navigate in background
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
