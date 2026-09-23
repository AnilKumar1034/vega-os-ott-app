import {AppState} from 'react-native';
import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import {
  formatSeasonEpisodeLabel,
  getLastWatchedEpisode,
  getNextEpisodes,
  getAllEpisodes,
  isAutoplayEnabled,
  saveLastWatchedEpisode,
} from '../src/services/episodeService';
import {
  curatedEpisodesMap,
  getEpisodesForContent,
  getNextEpisodeForContent,
  getNextEpisodesForContent,
  getAllEpisodesForContent,
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

    it('displays and triggers Next Episode button in seekbar for default sample-video', async () => {
      mockRouteParams = {
        params: {
          movie: {
            id: 'sample-video',
            title: 'Sample Video',
          },
        },
      };

      const screen = render(<VideoPlayerScreen />);

      await waitFor(() => {
        expect(screen.getByTestId('player-next-episode-button')).toBeTruthy();
      });

      act(() => {
        fireEvent.press(screen.getByTestId('player-next-episode-button'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('next-episode-modal')).toBeTruthy();
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

  describe('Next Episodes List View Enhancements', () => {
    const mockEp1: EpisodeItem = {
      id: 'ep-test-1',
      seriesId: 'series-test',
      seriesTitle: 'Galactic Odyssey',
      seasonNumber: 1,
      episodeNumber: 1,
      title: 'Departure',
      description: 'The voyage commences into uncharted regions.',
      durationFormatted: '45m',
      videoUrl: 'https://example.com/ep1.mp4',
      image: require('../src/assets/background.png'),
      rating: '⭐ 8.5',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi',
      progress: 0.8,
    };

    const mockEp2: EpisodeItem = {
      id: 'ep-test-2',
      seriesId: 'series-test',
      seriesTitle: 'Galactic Odyssey',
      seasonNumber: 1,
      episodeNumber: 2,
      title: 'First Contact',
      description: 'A strange beacon emanates from a distant nebula.',
      durationFormatted: '48m',
      videoUrl: 'https://example.com/ep2.mp4',
      image: require('../src/assets/background.png'),
      rating: '⭐ 8.9',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi',
    };

    const mockEp3: EpisodeItem = {
      id: 'ep-test-3',
      seriesId: 'series-test',
      seriesTitle: 'Galactic Odyssey',
      seasonNumber: 1,
      episodeNumber: 3,
      title: 'Solar Flare',
      description: 'The ship navigates through an intense cosmic storm.',
      durationFormatted: '44m',
      videoUrl: 'https://example.com/ep3.mp4',
      image: require('../src/assets/background.png'),
      rating: '⭐ 9.1',
      maturityRating: '13_PLUS',
      genre: 'Sci-Fi',
    };

    describe('data and service resolution for upcoming and all episodes', () => {
      it('resolves upcoming episodes correctly following the current episode', () => {
        const upcoming = getNextEpisodesForContent(
          {id: 'angel-one', title: 'Angel One'},
          'angel-one-ep-15',
        );
        expect(upcoming.length).toBeGreaterThanOrEqual(4);
        expect(upcoming[0].id).toBe('angel-one-ep-16');
        expect(upcoming[0].title).toBe('Too Short a Season');
      });

      it('resolves all upcoming episodes from explicit episodes array', () => {
        const upcoming = getNextEpisodesForContent(
          {
            id: 'show-1',
            title: 'Show',
            episodes: [mockEp1, mockEp2, mockEp3],
          },
          'ep-test-1',
        );
        expect(upcoming).toHaveLength(2);
        expect(upcoming[0].id).toBe('ep-test-2');
        expect(upcoming[1].id).toBe('ep-test-3');
      });

      it('returns empty array when current episode is the last one', () => {
        const allEpisodes = curatedEpisodesMap['angel-one'];
        const lastEpisode = allEpisodes[allEpisodes.length - 1];
        const upcoming = getNextEpisodesForContent(
          {id: 'angel-one', title: 'Angel One'},
          lastEpisode.id,
        );
        expect(upcoming).toEqual([]);
      });

      it('generates upcoming episodes for episodic content with seriesId and episodeNumber', () => {
        const upcoming = getNextEpisodesForContent({
          id: 'custom-series-s1-e2',
          seriesId: 'custom-series',
          seriesTitle: 'Custom Series',
          seasonNumber: 1,
          episodeNumber: 2,
        });
        expect(upcoming.length).toBe(3);
        expect(upcoming[0].episodeNumber).toBe(3);
        expect(upcoming[1].episodeNumber).toBe(4);
        expect(upcoming[2].episodeNumber).toBe(5);
      });

      it('returns explicit nextEpisode in array if only nextEpisode is provided', () => {
        const upcoming = getNextEpisodesForContent({
          id: 'movie-1',
          title: 'Movie',
          nextEpisode: mockEp2,
        });
        expect(upcoming).toEqual([mockEp2]);
      });

      it('returns empty array if current content is null or undefined', () => {
        expect(getNextEpisodesForContent(null)).toEqual([]);
        expect(getAllEpisodesForContent(null)).toEqual([]);
      });

      it('resolves all episodes for content from curated catalog', () => {
        const all = getAllEpisodesForContent({
          id: 'angel-one',
          title: 'Angel One',
        });
        expect(all.length).toBeGreaterThanOrEqual(4);
        expect(all[0].id).toBe('angel-one');
      });

      it('getNextEpisodes and getAllEpisodes helpers delegate to resolver functions', () => {
        const nextEps = getNextEpisodes(
          {
            id: 'show',
            episodes: [mockEp1, mockEp2],
          },
          'ep-test-1',
        );
        expect(nextEps).toEqual([mockEp2]);

        const allEps = getAllEpisodes({
          id: 'show',
          episodes: [mockEp1, mockEp2],
        });
        expect(allEps).toEqual([mockEp1, mockEp2]);
      });
    });

    describe('NextEpisodeModal List View UI & Interaction tests', () => {
      it('renders next episodes list view container and section title', () => {
        const {getByTestId} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        expect(getByTestId('next-episodes-section')).toBeTruthy();
        expect(getByTestId('next-episodes-section-title')).toBeTruthy();
        expect(getByTestId('next-episodes-list-view')).toBeTruthy();
      });

      it('renders episode cards for each upcoming episode with badges and metadata', () => {
        const {getByTestId, getByText, getAllByText} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        expect(getByTestId('next-episode-card-ep-test-2')).toBeTruthy();
        expect(getByTestId('next-episode-card-ep-test-3')).toBeTruthy();
        expect(getByText('Ep. 2: First Contact')).toBeTruthy();
        expect(getByText('Ep. 3: Solar Flare')).toBeTruthy();
        expect(getByText('EP 2')).toBeTruthy();
        expect(getByText('EP 3')).toBeTruthy();
        expect(getAllByText('48m').length).toBeGreaterThanOrEqual(1);
        expect(getByText('44m')).toBeTruthy();
        expect(getAllByText('⭐ 8.9').length).toBeGreaterThanOrEqual(1);
        expect(getByText('⭐ 9.1')).toBeTruthy();
      });

      it('displays UP NEXT badge with countdown on the immediate next episode card under autoplay', () => {
        const {getByText} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={4}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        expect(getByText('UP NEXT (4s)')).toBeTruthy();
      });

      it('displays static UP NEXT badge when autoplay is disabled', () => {
        const {getByText, queryByText} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={false}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        expect(getByText('UP NEXT')).toBeTruthy();
        expect(queryByText('UP NEXT (5s)')).toBeNull();
      });

      it('triggers onSelectEpisode with the specific episode when a card is pressed', () => {
        const onSelectEpisode = jest.fn();
        const onPlayNow = jest.fn();
        const {getByTestId} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={onPlayNow}
            onCancel={jest.fn()}
            onSelectEpisode={onSelectEpisode}
          />,
        );

        fireEvent.press(getByTestId('next-episode-card-ep-test-3'));
        expect(onSelectEpisode).toHaveBeenCalledTimes(1);
        expect(onSelectEpisode).toHaveBeenCalledWith(mockEp3);
        expect(onPlayNow).not.toHaveBeenCalled();
      });

      it('falls back to onPlayNow if onSelectEpisode is not provided', () => {
        const onPlayNow = jest.fn();
        const {getByTestId} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={onPlayNow}
            onCancel={jest.fn()}
          />,
        );

        fireEvent.press(getByTestId('next-episode-card-ep-test-3'));
        expect(onPlayNow).toHaveBeenCalledTimes(1);
        expect(onPlayNow).toHaveBeenCalledWith(mockEp3);
      });

      it('handles card focus and blur events properly, applying focus styling and action hint', () => {
        const {getByTestId, getByText, queryByText} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        const card = getByTestId('next-episode-card-ep-test-2');
        expect(queryByText('▶ Press OK to Play')).toBeNull();

        // Focus episode card
        fireEvent(card, 'focus');
        expect(getByText('▶ Press OK to Play')).toBeTruthy();

        // Blur episode card
        fireEvent(card, 'blur');
        expect(queryByText('▶ Press OK to Play')).toBeNull();
      });

      it('configures TV focus guides with autoFocus enabled for seamless D-pad traversal', () => {
        const {getByTestId} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        const episodesSection = getByTestId('next-episodes-section');
        expect(episodesSection.props.autoFocus).toBe(true);
      });

      it('handles tab focus and blur events for TV navigation', () => {
        const {getByTestId} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            allEpisodes={[mockEp1, mockEp2, mockEp3]}
            currentEpisodeId={mockEp1.id}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        const upcomingTab = getByTestId('next-episodes-tab-upcoming');
        fireEvent(upcomingTab, 'focus');
        fireEvent(upcomingTab, 'blur');

        const allTab = getByTestId('next-episodes-tab-all');
        fireEvent(allTab, 'focus');
        fireEvent(allTab, 'blur');
      });

      it('allows toggling between Upcoming and All Episodes tabs', () => {
        const {getByTestId, getByText, queryByTestId} = render(
          <NextEpisodeModal
            isOpen={true}
            nextEpisode={mockEp2}
            nextEpisodes={[mockEp2, mockEp3]}
            allEpisodes={[mockEp1, mockEp2, mockEp3]}
            currentEpisodeId={mockEp1.id}
            countdownSeconds={5}
            autoplayEnabled={true}
            onPlayNow={jest.fn()}
            onCancel={jest.fn()}
          />,
        );

        // Initially on Upcoming tab
        expect(getByTestId('next-episodes-tab-upcoming')).toBeTruthy();
        expect(getByTestId('next-episodes-tab-all')).toBeTruthy();
        expect(queryByTestId('next-episode-card-ep-test-1')).toBeNull();
        expect(getByTestId('next-episode-card-ep-test-2')).toBeTruthy();

        // Switch to All Episodes tab
        fireEvent.press(getByTestId('next-episodes-tab-all'));
        expect(getByTestId('next-episode-card-ep-test-1')).toBeTruthy();
        expect(getByTestId('next-episode-card-ep-test-2')).toBeTruthy();
        expect(getByTestId('next-episode-card-ep-test-3')).toBeTruthy();
        expect(getByText('Watched')).toBeTruthy();
      });
    });

    describe('VideoPlayerScreen Next Episodes List View integration', () => {
      it('opens NextEpisodeModal with next episodes list view when video playback ends', async () => {
        const screen = render(<VideoPlayerScreen />);

        await waitFor(() => {
          expect(mockPlayerInstance).toBeTruthy();
        });

        act(() => {
          mockPlayerInstance.emit('playing');
        });

        act(() => {
          mockPlayerInstance.emit('ended');
        });

        await waitFor(() => {
          expect(screen.getByTestId('next-episodes-list-view')).toBeTruthy();
          expect(
            screen.getByTestId('next-episodes-section-title'),
          ).toBeTruthy();
        });
      });

      it('immediately navigates to selected episode when user selects an upcoming episode card from the list view', async () => {
        const screen = render(<VideoPlayerScreen />);

        await waitFor(() => {
          expect(mockPlayerInstance).toBeTruthy();
        });

        act(() => {
          mockPlayerInstance.emit('ended');
        });

        await waitFor(() => {
          expect(screen.getByTestId('next-episodes-list-view')).toBeTruthy();
          // Find Episode 16 card from Angel One upcoming catalog
          expect(
            screen.getByTestId('next-episode-card-angel-one-ep-16'),
          ).toBeTruthy();
        });

        // Click Episode 16 from the list view
        act(() => {
          fireEvent.press(
            screen.getByTestId('next-episode-card-angel-one-ep-16'),
          );
        });

        expect(mockReplace).toHaveBeenCalledWith(
          Routes.VideoPlayer,
          expect.objectContaining({
            movieId: 'angel-one-ep-16',
            movie: expect.objectContaining({
              id: 'angel-one-ep-16',
              title: 'Too Short a Season',
              episodeNumber: 16,
            }),
            seek: 0,
            isLive: false,
          }),
        );
      });
    });
  });
});
