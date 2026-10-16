import React from 'react';

const mockLogEvent = jest.fn();
const mockInitializeApp = jest.fn();
const mockGetApps = jest.fn();
const mockGetApp = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args: unknown[]) => mockInitializeApp(...args),
  getApps: () => mockGetApps(),
  getApp: () => mockGetApp(),
}));

jest.mock('firebase/analytics', () => ({
  isSupported: jest.fn().mockResolvedValue(true),
  getAnalytics: jest.fn().mockReturnValue({app: {name: '[DEFAULT]'}}),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
  setUserId: jest.fn().mockResolvedValue(undefined),
  setUserProperties: jest.fn().mockResolvedValue(undefined),
}));

const mockStorage = new Map<string, string>();
jest.mock(
  '@amazon-devices/react-native-async-storage__async-storage/lib/commonjs/AsyncStorage.native',
  () => ({
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        mockStorage.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        mockStorage.delete(key);
      }),
    },
  }),
);

import {
  analyticsService,
  AnalyticsService,
  AnalyticsEvents,
  playbackSessionManager,
  PlaybackSessionManager,
} from '../src/analytics';
import {
  ScreenNavigationTracker,
} from '../src/navigation/navigationAnalytics';
import {Routes} from '../src/constants/routes';
import {deeplinkManager} from '../src/utils/deeplink';

describe('Content Journey & Movie-Level Analytics (LogiXstream)', () => {
  let tracker: ScreenNavigationTracker;
  let mockAnalytics: AnalyticsService;
  let sessionManager: PlaybackSessionManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockGetApps.mockReturnValue([]);
    mockInitializeApp.mockReturnValue({name: '[DEFAULT]'});

    mockAnalytics = new AnalyticsService();
    await mockAnalytics.initialize();
    mockAnalytics.setUser(null);
    mockAnalytics.setProfile(null);
    tracker = new ScreenNavigationTracker(mockAnalytics, deeplinkManager);
    sessionManager = new PlaybackSessionManager(mockAnalytics);
  });

  afterEach(() => {
    sessionManager.__resetForTesting();
  });

  describe('Scenario 1: Screen views carrying content parameters', () => {
    it('enriches screen_view with content_id, content_type, content_title, and source_screen for MovieDetail', async () => {
      await tracker.handleRoute({
        name: Routes.MovieDetail,
        key: 'movie-detail-key',
        params: {
          movie: {
            id: 'interstellar-2014',
            title: 'Interstellar',
            contentType: 'movie',
          },
          sourceScreen: 'Home',
        },
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SCREEN_VIEW,
        expect.objectContaining({
          screen_name: Routes.MovieDetail,
          screen_class: 'MovieDetailScreen',
          content_id: 'interstellar-2014',
          content_type: 'movie',
          content_title: 'Interstellar',
          source_screen: 'Home',
        }),
      );
    });

    it('enriches screen_view with series_id and episode_id when available', async () => {
      await tracker.handleRoute(
        {
          name: Routes.VideoPlayer,
          key: 'video-player-key',
          params: {
            movie: {
              id: 'stranger-things-s01e01',
              title: 'Chapter One: The Vanishing of Will Byers',
              contentType: 'episode',
              seriesId: 'stranger-things',
              episodeId: 'stranger-things-s01e01',
            },
            sourceScreen: 'MovieDetail',
          },
        },
        {user: {id: 'u1'} as any},
      );

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SCREEN_VIEW,
        expect.objectContaining({
          screen_name: Routes.VideoPlayer,
          screen_class: 'VideoPlayerScreen',
          content_id: 'stranger-things-s01e01',
          content_type: 'episode',
          series_id: 'stranger-things',
          episode_id: 'stranger-things-s01e01',
          source_screen: 'MovieDetail',
        }),
      );
    });
  });

  describe('Scenario 2: Content impressions deduplicated', () => {
    it('deduplicates content impressions for the same content_id in a session', async () => {
      await mockAnalytics.trackContentImpression({
        content_id: 'inception-101',
        content_type: 'movie',
        content_title: 'Inception',
        source_screen: 'Home',
        source_component: 'hero_carousel',
      });

      await mockAnalytics.trackContentImpression({
        content_id: 'inception-101',
        content_type: 'movie',
        content_title: 'Inception',
        source_screen: 'Home',
        source_component: 'content_card',
      });

      const impressionCalls = mockLogEvent.mock.calls.filter(
        (call) => call[1] === AnalyticsEvents.CONTENT_IMPRESSION,
      );

      expect(impressionCalls).toHaveLength(1);
      expect(impressionCalls[0][2]).toMatchObject({
        content_id: 'inception-101',
        content_type: 'movie',
        content_title: 'Inception',
        source_screen: 'Home',
        source_component: 'hero_carousel',
      });
    });
  });

  describe('Scenario 3: Content selection with source and destination', () => {
    it('emits content_selected with content parameters, source, destination, and action', async () => {
      await mockAnalytics.trackContentSelected({
        content_id: 'batman-dark-knight',
        content_type: 'movie',
        content_title: 'The Dark Knight',
        source_screen: 'Home',
        source_component: 'trending_row',
        destination_screen: 'MovieDetail',
        action_name: 'open_details',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.CONTENT_SELECTED,
        expect.objectContaining({
          content_id: 'batman-dark-knight',
          content_type: 'movie',
          content_title: 'The Dark Knight',
          source_screen: 'Home',
          source_component: 'trending_row',
          destination_screen: 'MovieDetail',
          action_name: 'open_details',
        }),
      );
    });
  });

  describe('Scenario 4: Content details viewed once per view', () => {
    it('emits content_details_viewed deduplicated per content in the view session', async () => {
      await mockAnalytics.trackContentDetailsViewed({
        content_id: 'matrix-reloaded',
        content_type: 'movie',
        content_title: 'The Matrix Reloaded',
        source_screen: 'Home',
      });

      // Second trigger for same movie (e.g., re-render or tab focus)
      await mockAnalytics.trackContentDetailsViewed({
        content_id: 'matrix-reloaded',
        content_type: 'movie',
        content_title: 'The Matrix Reloaded',
        source_screen: 'Home',
      });

      const detailsCalls = mockLogEvent.mock.calls.filter(
        (call) => call[1] === AnalyticsEvents.CONTENT_DETAILS_VIEWED,
      );

      expect(detailsCalls).toHaveLength(1);
      expect(detailsCalls[0][2]).toMatchObject({
        content_id: 'matrix-reloaded',
        content_type: 'movie',
        content_title: 'The Matrix Reloaded',
        source_screen: 'Home',
      });
    });
  });

  describe('Scenario 5: Watchlist added/removed with content_title and success: true', () => {
    it('emits watchlist_added with content_title, source_screen, source_component, and success: true', async () => {
      await mockAnalytics.trackWatchlistAdded({
        content_id: 'gladiator-2000',
        content_type: 'movie',
        content_title: 'Gladiator',
        source_screen: 'MovieDetail',
        source_component: 'details_action_button',
        action_source: 'details',
        success: true,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.WATCHLIST_ADDED,
        expect.objectContaining({
          content_id: 'gladiator-2000',
          content_type: 'movie',
          content_title: 'Gladiator',
          source_screen: 'MovieDetail',
          source_component: 'details_action_button',
          success: true,
        }),
      );
    });

    it('emits watchlist_removed with content_title, source_screen, source_component, and success: true', async () => {
      await mockAnalytics.trackWatchlistRemoved({
        content_id: 'gladiator-2000',
        content_type: 'movie',
        content_title: 'Gladiator',
        source_screen: 'MovieDetail',
        source_component: 'details_action_button',
        action_source: 'details',
        success: true,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.WATCHLIST_REMOVED,
        expect.objectContaining({
          content_id: 'gladiator-2000',
          content_type: 'movie',
          content_title: 'Gladiator',
          source_screen: 'MovieDetail',
          source_component: 'details_action_button',
          success: true,
        }),
      );
    });
  });

  describe('Scenario 6: Watchlist item selection', () => {
    it('emits watchlist_item_selected with content parameters and component context', async () => {
      await mockAnalytics.trackWatchlistItemSelected({
        content_id: 'arrival-2016',
        content_type: 'movie',
        content_title: 'Arrival',
        source_screen: 'MyList',
        source_component: 'watchlist_grid',
        destination_type: 'details',
        position: 2,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.WATCHLIST_ITEM_SELECTED,
        expect.objectContaining({
          content_id: 'arrival-2016',
          content_type: 'movie',
          content_title: 'Arrival',
          source_screen: 'MyList',
          source_component: 'watchlist_grid',
        }),
      );
    });
  });

  describe('Scenario 7: Continue watching selection', () => {
    it('emits continue_watching_selected with content parameters and source screen', async () => {
      await mockAnalytics.trackContinueWatchingSelected({
        content_id: 'dune-part-two',
        content_type: 'movie',
        content_title: 'Dune: Part Two',
        source_screen: 'Home',
        source_component: 'continue_watching_row',
        position_seconds: 2400,
        progress_percentage: 45,
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.CONTINUE_WATCHING_SELECTED,
        expect.objectContaining({
          content_id: 'dune-part-two',
          content_type: 'movie',
          content_title: 'Dune: Part Two',
          source_screen: 'Home',
        }),
      );
    });
  });

  describe('Scenario 8: Playback session start requested', () => {
    it('emits playback_start_requested with content_id, content_title, and playback_session_id', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'oppenheimer-2023',
        contentTitle: 'Oppenheimer',
        contentType: 'movie',
        sourceScreen: 'MovieDetail',
        streamType: 'vod',
        startPosition: 0,
      });

      expect(sessionId).toBeDefined();
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.PLAYBACK_START_REQUESTED,
        expect.objectContaining({
          content_id: 'oppenheimer-2023',
          content_title: 'Oppenheimer',
          content_type: 'movie',
          source_screen: 'MovieDetail',
          playback_session_id: sessionId,
        }),
      );
    });
  });

  describe('Scenario 9: First frame render with content metadata', () => {
    it('emits first_frame_rendered carrying content_id, content_title, position_ms, and playback_session_id', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'top-gun-maverick',
        contentTitle: 'Top Gun: Maverick',
        contentType: 'movie',
        sourceScreen: 'Home',
        streamType: 'vod',
      });

      await sessionManager.recordPlayerReady();
      await sessionManager.recordPlaybackStarted();
      await sessionManager.recordFirstFrame(1500);

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.FIRST_FRAME_RENDERED,
        expect.objectContaining({
          content_id: 'top-gun-maverick',
          content_title: 'Top Gun: Maverick',
          content_type: 'movie',
          playback_session_id: sessionId,
          position_ms: 0,
        }),
      );
    });
  });

  describe('Scenario 10: Playback pause & resume with content metadata', () => {
    it('emits playback_paused and playback_resumed carrying content metadata and position_ms', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'avatar-way-of-water',
        contentTitle: 'Avatar: The Way of Water',
        contentType: 'movie',
      });

      await sessionManager.recordPlayerReady();
      await sessionManager.recordPlaybackStarted();
      await sessionManager.recordFirstFrame({position: 0});

      await sessionManager.recordPause(120);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.PLAYBACK_PAUSED,
        expect.objectContaining({
          content_id: 'avatar-way-of-water',
          content_title: 'Avatar: The Way of Water',
          content_type: 'movie',
          playback_session_id: sessionId,
          position_ms: 120000,
        }),
      );

      await sessionManager.recordResume(120);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.PLAYBACK_RESUMED,
        expect.objectContaining({
          content_id: 'avatar-way-of-water',
          content_title: 'Avatar: The Way of Water',
          content_type: 'movie',
          playback_session_id: sessionId,
          position_ms: 120000,
        }),
      );
    });
  });

  describe('Scenario 11: Seeking with content metadata', () => {
    it('emits seek_started and seek_completed with content parameters and position_ms', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'spider-man-no-way-home',
        contentTitle: 'Spider-Man: No Way Home',
        contentType: 'movie',
      });

      await sessionManager.recordPlayerReady();
      await sessionManager.recordPlaybackStarted();

      await sessionManager.recordSeekStarted(30, 90);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SEEK_STARTED,
        expect.objectContaining({
          content_id: 'spider-man-no-way-home',
          content_title: 'Spider-Man: No Way Home',
          playback_session_id: sessionId,
          position_ms: 30000,
        }),
      );

      await sessionManager.recordSeekCompleted(90, 60, true);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SEEK_COMPLETED,
        expect.objectContaining({
          content_id: 'spider-man-no-way-home',
          content_title: 'Spider-Man: No Way Home',
          playback_session_id: sessionId,
          position_ms: 90000,
        }),
      );
    });
  });

  describe('Scenario 12: Track & quality changes with content metadata', () => {
    it('emits audio_track_changed, subtitle_track_changed, and quality_selected with content metadata', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'blade-runner-2049',
        contentTitle: 'Blade Runner 2049',
        contentType: 'movie',
      });

      await sessionManager.recordAudioTrackChanged({
        toAudioTrackId: 'es',
        toLanguage: 'Spanish',
        fromAudioTrackId: 'en',
        fromLanguage: 'English',
      });
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.AUDIO_TRACK_CHANGED,
        expect.objectContaining({
          content_id: 'blade-runner-2049',
          content_title: 'Blade Runner 2049',
          playback_session_id: sessionId,
        }),
      );

      await sessionManager.recordSubtitleTrackChanged({
        toSubtitleTrackId: 'en',
        toLanguage: 'English',
        fromSubtitleTrackId: 'off',
      });
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SUBTITLE_TRACK_CHANGED,
        expect.objectContaining({
          content_id: 'blade-runner-2049',
          content_title: 'Blade Runner 2049',
          playback_session_id: sessionId,
        }),
      );

      await sessionManager.recordQualitySelected({
        qualityId: '1080p',
        qualityMode: 'manual',
      });
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.QUALITY_SELECTED,
        expect.objectContaining({
          content_id: 'blade-runner-2049',
          content_title: 'Blade Runner 2049',
          playback_session_id: sessionId,
        }),
      );
    });
  });

  describe('Scenario 13: Completion & stop with content metadata', () => {
    it('emits completed carrying content metadata', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'whiplash-2014',
        contentTitle: 'Whiplash',
        contentType: 'movie',
      });

      await sessionManager.recordComplete(6400, 6400);
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.COMPLETED,
        expect.objectContaining({
          content_id: 'whiplash-2014',
          content_title: 'Whiplash',
          content_type: 'movie',
          playback_session_id: sessionId,
        }),
      );
    });

    it('emits playback_stopped carrying content metadata, position_ms, and duration_ms', async () => {
      const sessionId = await sessionManager.startSession({
        contentId: 'whiplash-2014',
        contentTitle: 'Whiplash',
        contentType: 'movie',
      });

      await sessionManager.recordStop({
        position: 3200,
        duration: 6400,
        reason: 'user_exit',
      });
      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.PLAYBACK_STOPPED,
        expect.objectContaining({
          content_id: 'whiplash-2014',
          content_title: 'Whiplash',
          content_type: 'movie',
          playback_session_id: sessionId,
          position_ms: 3200000,
          duration_ms: 6400000,
        }),
      );
    });
  });

  describe('Scenario 14: Search performed & search result selected (privacy-safe)', () => {
    it('logs search_performed with query length, has_results, count, without raw search text', async () => {
      jest.useFakeTimers();

      const searchPromise = mockAnalytics.trackSearchPerformed({
        search_term_length: 12,
        has_results: true,
        result_count: 5,
        source_screen: 'Search',
      });

      jest.runAllTimers();
      await searchPromise;

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SEARCH_PERFORMED,
        expect.objectContaining({
          search_term_length: 12,
          has_results: true,
          result_count: 5,
          source_screen: 'Search',
        }),
      );

      const payload = mockLogEvent.mock.calls.find(
        (call) => call[1] === AnalyticsEvents.SEARCH_PERFORMED,
      )?.[2];

      expect(payload.search_query).toBeUndefined();
      expect(payload.query).toBeUndefined();
      expect(payload.q).toBeUndefined();
      expect(payload.searchTerm).toBeUndefined();

      jest.useRealTimers();
    });

    it('emits search_result_selected with content parameters and component context', async () => {
      await mockAnalytics.trackSearchResultSelected({
        content_id: 'matrix-1999',
        content_type: 'movie',
        content_title: 'The Matrix',
        source_screen: 'search',
        source_component: 'search_results',
        destination_screen: 'MovieDetail',
      });

      expect(mockLogEvent).toHaveBeenCalledWith(
        expect.anything(),
        AnalyticsEvents.SEARCH_RESULT_SELECTED,
        expect.objectContaining({
          content_id: 'matrix-1999',
          content_type: 'movie',
          content_title: 'The Matrix',
          source_screen: 'search',
          source_component: 'search_results',
          destination_screen: 'MovieDetail',
        }),
      );
    });
  });

  describe('Privacy & Parameter Constraint Enforcement', () => {
    it('bounds content titles and string values to 100 characters', async () => {
      const veryLongTitle = 'A'.repeat(150);

      await mockAnalytics.trackContentSelected({
        content_id: 'long-movie-title',
        content_type: 'movie',
        content_title: veryLongTitle,
        source_screen: 'Home',
        source_component: 'carousel',
      });

      const payload = mockLogEvent.mock.calls.find(
        (call) => call[1] === AnalyticsEvents.CONTENT_SELECTED,
      )?.[2];

      expect(payload.content_title).toHaveLength(100);
      expect(payload.content_title).toBe('A'.repeat(100));
    });

    it('omits passwords, tokens, full URLs, and raw sensitive user IDs from screen_view', async () => {
      await tracker.handleRoute({
        name: Routes.MovieDetail,
        key: 'movie-safe-key',
        params: {
          movie: {
            id: 'safe-movie-1',
            title: 'Safe Title',
            contentType: 'movie',
          },
          video_url: 'https://cdn.secret.com/stream.mpd?token=xyz',
          user_password: 'plainpassword123',
          profile_name: 'Super Admin',
          auth_token: 'bearer-token-12345',
        },
      });

      const screenPayload = mockLogEvent.mock.calls.find(
        (call) => call[1] === AnalyticsEvents.SCREEN_VIEW,
      )?.[2];

      expect(screenPayload.video_url).toBeUndefined();
      expect(screenPayload.user_password).toBeUndefined();
      expect(screenPayload.profile_name).toBeUndefined();
      expect(screenPayload.auth_token).toBeUndefined();
      expect(screenPayload.content_id).toBe('safe-movie-1');
      expect(screenPayload.content_title).toBe('Safe Title');
    });
  });
});
