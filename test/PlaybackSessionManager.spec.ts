import {
  AnalyticsEvent,
  AnalyticsService,
  AnalyticsContextManager,
  PlaybackSessionManager,
  generatePlaybackSessionId,
  normalizePlaybackError,
  sanitizeErrorMessage,
} from '../src/analytics';

describe('PlaybackSessionManager (Playback Telemetry Lifecycle)', () => {
  let mockTrack: jest.Mock;
  let mockAnalytics: AnalyticsService;
  let manager: PlaybackSessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack = jest.fn().mockResolvedValue(undefined);
    mockAnalytics = {
      trackPlaybackStartRequested: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PLAYBACK_START_REQUESTED, params),
      ),
      trackPlayerReady: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PLAYER_READY, params),
      ),
      trackPlaybackStarted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PLAYBACK_STARTED, params),
      ),
      trackFirstFrame: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.FIRST_FRAME, params),
      ),
      trackBufferStarted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.BUFFER_STARTED, params),
      ),
      trackBufferEnded: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.BUFFER_ENDED, params),
      ),
      trackPlaybackPaused: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PAUSED, params),
      ),
      trackPlaybackResumed: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.RESUMED, params),
      ),
      trackPlaybackCompleted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.COMPLETED, params),
      ),
      trackPlaybackStopped: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.STOPPED, params),
      ),
      trackPlaybackError: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.PLAYBACK_ERROR, params),
      ),
      trackSeekStarted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.SEEK_STARTED, params),
      ),
      trackSeekCompleted: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.SEEK_COMPLETED, params),
      ),
      trackAudioTrackChanged: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.AUDIO_TRACK_CHANGED, params),
      ),
      trackSubtitleTrackChanged: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.SUBTITLE_TRACK_CHANGED, params),
      ),
      trackQualitySelected: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.QUALITY_SELECTED, params),
      ),
      trackBitrateChanged: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.BITRATE_CHANGED, params),
      ),
      trackResolutionChanged: jest.fn().mockImplementation((params) =>
        mockTrack(AnalyticsEvent.RESOLUTION_CHANGED, params),
      ),
    } as unknown as AnalyticsService;

    manager = new PlaybackSessionManager(mockAnalytics);
  });

  describe('1. generatePlaybackSessionId', () => {
    it('generates a unique non-empty string starting with "ps_"', () => {
      const id1 = generatePlaybackSessionId();
      const id2 = generatePlaybackSessionId();

      expect(typeof id1).toBe('string');
      expect(id1.startsWith('ps_')).toBe(true);
      expect(id1).not.toBe(id2);
    });
  });

  describe('2. Step 1 & 2: New Content -> Create playbackSessionId -> playback_started', () => {
    it('starts session, creates playbackSessionId, and emits playback_started', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentTitle: 'Interstellar Voyage',
        contentType: 'movie',
        streamType: 'dash',
        isLive: false,
        startPosition: 0,
        duration: 7200,
      });

      expect(sessionId).toBeDefined();
      expect(sessionId.startsWith('ps_')).toBe(true);
      expect(manager.getCurrentSessionId()).toBe(sessionId);
      expect(manager.isSessionActive()).toBe(true);
      expect(manager.hasFirstFrameRendered()).toBe(false);

      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          contentTitle: 'Interstellar Voyage',
          contentType: 'movie',
          streamType: 'dash',
          isLive: false,
          startPosition: 0,
          duration: 7200,
        }),
      );
    });
  });

  describe('3. Day 3: playback_start_requested event', () => {
    it('1. playback_start_requested fires once per session with controlled payload', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentTitle: 'Interstellar Voyage',
        contentType: 'movie',
        streamType: 'dash',
        isLive: false,
        startPosition: 15,
      });

      expect(mockAnalytics.trackPlaybackStartRequested).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStartRequested).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          playbackType: 'movie',
          isLive: false,
          startPosition: 15,
        }),
      );

      // Subsequent call to recordPlaybackStartRequested does not duplicate event
      await manager.recordPlaybackStartRequested({startPosition: 15});
      expect(mockAnalytics.trackPlaybackStartRequested).toHaveBeenCalledTimes(1);
    });
  });

  describe('4. Day 3: player_ready event', () => {
    it('2. player_ready fires once per session when player reaches reliable ready state', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentType: 'movie',
        isLive: false,
      });

      expect(manager.hasPlayerReady()).toBe(false);

      await manager.recordPlayerReady();

      expect(manager.hasPlayerReady()).toBe(true);
      expect(mockAnalytics.trackPlayerReady).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlayerReady).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          playbackType: 'movie',
          isLive: false,
        }),
      );

      // Repeated calls to recordPlayerReady do not duplicate event
      await manager.recordPlayerReady();
      await manager.recordPlayerReady();
      expect(mockAnalytics.trackPlayerReady).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. first_frame and startup metrics', () => {
    it('3. first_frame remains once/session and transitions state', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentTitle: 'Interstellar Voyage',
      });

      await manager.recordFirstFrame({position: 0.1});

      expect(manager.hasFirstFrameRendered()).toBe(true);
      expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 0.1,
          timeToFirstFrameMs: expect.any(Number),
          startup_time_ms: expect.any(Number),
        }),
      );

      // Deduplicates first_frame and ignores subsequent calls for the same session
      await manager.recordFirstFrame({position: 0.5});
      await manager.recordFirstFrame({position: 1.0});
      expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
    });

    it('4. startup_time_ms is calculated correctly as first_frame - playback_start_requested', async () => {
      jest.useFakeTimers();
      try {
        const startTime = 1000000;
        jest.setSystemTime(startTime);

        await manager.startSession({
          contentId: 'movie-101',
        });

        // Fast-forward 1450 ms
        jest.setSystemTime(startTime + 1450);

        await manager.recordFirstFrame({position: 0});

        expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledWith(
          expect.objectContaining({
            startup_time_ms: 1450,
            timeToFirstFrameMs: 1450,
          }),
        );

        const startupMetrics = manager.getStartupMetrics();
        expect(startupMetrics?.startupTimeMs).toBe(1450);
        expect(startupMetrics?.timeToFirstFrameMs).toBe(1450);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('6. Day 3: Buffering Analytics State Machine & Metrics', () => {
    it('5. buffer_started fires once when entering buffering during active playback', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        contentType: 'movie',
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordBufferStarted();

      expect(manager.isCurrentlyBuffering()).toBe(true);
      expect(mockAnalytics.trackBufferStarted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackBufferStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          playbackType: 'movie',
          bufferCount: 1,
        }),
      );
    });

    it('6. repeated buffering callbacks do not duplicate buffer_started', async () => {
      await manager.startSession({contentId: 'movie-101'});
      await manager.recordFirstFrame({position: 0});

      await manager.recordBufferStarted();
      await manager.recordBufferStarted();
      await manager.recordBufferStarted();

      expect(mockAnalytics.trackBufferStarted).toHaveBeenCalledTimes(1);
      expect(manager.getBufferMetrics()?.bufferCount).toBe(1);
    });

    it('7. buffer_ended fires once when leaving buffering', async () => {
      const sessionId = await manager.startSession({contentId: 'movie-101'});
      await manager.recordFirstFrame({position: 0});

      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      expect(manager.isCurrentlyBuffering()).toBe(false);
      expect(mockAnalytics.trackBufferEnded).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackBufferEnded).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          bufferCount: 1,
          bufferDurationMs: expect.any(Number),
        }),
      );
    });

    it('8. repeated playing callbacks do not duplicate buffer_ended', async () => {
      await manager.startSession({contentId: 'movie-101'});
      await manager.recordFirstFrame({position: 0});

      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      // Repeated playing callbacks without an intervening buffering state
      await manager.recordBufferEnded();
      await manager.recordBufferEnded();

      expect(mockAnalytics.trackBufferEnded).toHaveBeenCalledTimes(1);
    });

    it('9. bufferDurationMs is calculated correctly', async () => {
      jest.useFakeTimers();
      try {
        const startTime = 500000;
        jest.setSystemTime(startTime);

        await manager.startSession({contentId: 'movie-101'});
        await manager.recordFirstFrame({position: 0});

        // Buffering starts
        jest.setSystemTime(startTime + 1000);
        await manager.recordBufferStarted();

        // Buffering finishes 2800 ms later
        jest.setSystemTime(startTime + 3800);
        await manager.recordBufferEnded();

        expect(mockAnalytics.trackBufferEnded).toHaveBeenCalledWith(
          expect.objectContaining({
            bufferDurationMs: 2800,
            bufferCount: 1,
          }),
        );
      } finally {
        jest.useRealTimers();
      }
    });

    it('10. bufferCount increments correctly with each buffering episode', async () => {
      await manager.startSession({contentId: 'movie-101'});
      await manager.recordFirstFrame({position: 0});

      // Episode 1
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      // Episode 2
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      // Episode 3
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      expect(mockAnalytics.trackBufferStarted).toHaveBeenCalledTimes(3);
      expect(mockAnalytics.trackBufferEnded).toHaveBeenCalledTimes(3);
      expect(manager.getBufferMetrics()?.bufferCount).toBe(3);
    });

    it('11. totalBufferDurationMs is calculated correctly across multiple episodes', async () => {
      jest.useFakeTimers();
      try {
        let currentTime = 1000000;
        jest.setSystemTime(currentTime);

        await manager.startSession({contentId: 'movie-101'});
        await manager.recordFirstFrame({position: 0});

        // Episode 1: duration = 2000 ms
        await manager.recordBufferStarted();
        currentTime += 2000;
        jest.setSystemTime(currentTime);
        await manager.recordBufferEnded();

        // Episode 2: duration = 3500 ms
        currentTime += 5000;
        jest.setSystemTime(currentTime);
        await manager.recordBufferStarted();
        currentTime += 3500;
        jest.setSystemTime(currentTime);
        await manager.recordBufferEnded();

        const metrics = manager.getBufferMetrics();
        expect(metrics?.bufferCount).toBe(2);
        expect(metrics?.totalBufferDurationMs).toBe(5500);
      } finally {
        jest.useRealTimers();
      }
    });

    it('12. user pause does not generate buffer_started', async () => {
      await manager.startSession({contentId: 'movie-101'});
      await manager.recordFirstFrame({position: 0});

      // User pauses
      await manager.recordPause(30);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackBufferStarted).not.toHaveBeenCalled();

      // While paused, network waiting callback is ignored
      await manager.recordBufferStarted();
      expect(mockAnalytics.trackBufferStarted).not.toHaveBeenCalled();
    });

    it('13. buffering does not generate playback_paused and buffer_ended does not emit resumed', async () => {
      await manager.startSession({contentId: 'movie-101'});
      await manager.recordFirstFrame({position: 0});

      // Buffering episode
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      expect(mockAnalytics.trackPlaybackPaused).not.toHaveBeenCalled();
      expect(mockAnalytics.trackPlaybackResumed).not.toHaveBeenCalled();
    });

    it('14. initial loading does not incorrectly count as rebuffering', async () => {
      await manager.startSession({contentId: 'movie-101'});
      await manager.recordPlayerReady();

      // Attempt buffering before first_frame
      await manager.recordBufferStarted();

      expect(mockAnalytics.trackBufferStarted).not.toHaveBeenCalled();
      expect(manager.getBufferMetrics()?.bufferCount).toBe(0);

      // Now first_frame renders
      await manager.recordFirstFrame({position: 0});

      // Subsequent buffering is valid rebuffering
      await manager.recordBufferStarted();
      expect(mockAnalytics.trackBufferStarted).toHaveBeenCalledTimes(1);
      expect(manager.getBufferMetrics()?.bufferCount).toBe(1);
    });

    it('15. a new playback session resets buffer metrics', async () => {
      await manager.startSession({contentId: 'movie-1'});
      await manager.recordFirstFrame({position: 0});
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      expect(manager.getBufferMetrics()?.bufferCount).toBe(1);

      // Start new session
      await manager.startSession({contentId: 'movie-2'});

      expect(manager.getBufferMetrics()?.bufferCount).toBe(0);
      expect(manager.getBufferMetrics()?.totalBufferDurationMs).toBe(0);
      expect(manager.isCurrentlyBuffering()).toBe(false);
    });

    it('16. completed playback does not continue generating buffer events', async () => {
      await manager.startSession({contentId: 'movie-1', duration: 100});
      await manager.recordFirstFrame({position: 0});
      await manager.recordComplete({duration: 100});

      // Attempt buffering after completion
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      expect(mockAnalytics.trackBufferStarted).not.toHaveBeenCalled();
      expect(mockAnalytics.trackBufferEnded).not.toHaveBeenCalled();
    });

    it('17. stopped playback does not continue generating buffer events', async () => {
      await manager.startSession({contentId: 'movie-1'});
      await manager.recordFirstFrame({position: 0});
      await manager.recordStop({reason: 'user_exit'});

      // Attempt buffering after stop
      await manager.recordBufferStarted();
      await manager.recordBufferEnded();

      expect(mockAnalytics.trackBufferStarted).not.toHaveBeenCalled();
      expect(mockAnalytics.trackBufferEnded).not.toHaveBeenCalled();
    });

    it('18. analytics failure does not affect player behavior', async () => {
      const failingAnalytics = {
        trackPlaybackStartRequested: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackPlayerReady: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackPlaybackStarted: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackFirstFrame: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackBufferStarted: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackBufferEnded: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackPlaybackPaused: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackPlaybackResumed: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackPlaybackCompleted: jest.fn().mockRejectedValue(new Error('Network offline')),
        trackPlaybackStopped: jest.fn().mockRejectedValue(new Error('Network offline')),
      } as unknown as AnalyticsService;

      const robustManager = new PlaybackSessionManager(failingAnalytics);

      // Verify no exceptions throw into player logic
      await expect(robustManager.startSession({contentId: 'movie-1'})).resolves.toBeDefined();
      await expect(robustManager.recordPlayerReady()).resolves.not.toThrow();
      await expect(robustManager.recordFirstFrame()).resolves.not.toThrow();
      await expect(robustManager.recordBufferStarted()).resolves.not.toThrow();
      await expect(robustManager.recordBufferEnded()).resolves.not.toThrow();
      await expect(robustManager.recordPause(10)).resolves.not.toThrow();
      await expect(robustManager.recordResume(10)).resolves.not.toThrow();
      await expect(robustManager.recordComplete()).resolves.not.toThrow();
      await expect(robustManager.recordStop()).resolves.not.toThrow();
    });

    it('19. Live TV session never emits playback_completed', async () => {
      await manager.startSession({
        contentId: 'live-channel-1',
        isLive: true,
      });
      await manager.recordFirstFrame({position: 0});

      // recordComplete should be ignored for Live TV
      await manager.recordComplete({duration: 0});
      expect(mockAnalytics.trackPlaybackCompleted).not.toHaveBeenCalled();
      expect(manager.isSessionActive()).toBe(true);

      // recordStop is emitted upon exit
      await manager.recordStop({reason: 'user_exit'});
      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(manager.isSessionActive()).toBe(false);
    });
  });

  describe('7. Step 4: Pause and Resume loop (paused -> resumed)', () => {
    it('emits paused when video is paused and resumed when video is resumed', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      // Pause playback at 45 seconds
      await manager.recordPause(45);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 45,
        }),
      );

      // Resume playback at 45 seconds
      await manager.recordResume(45);

      expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 45,
          pauseDurationMs: expect.any(Number),
        }),
      );
    });

    it('does not emit resumed if playback was not previously paused', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      // Attempting to resume when state is playing (not paused)
      await manager.recordResume(10);

      expect(mockAnalytics.trackPlaybackResumed).not.toHaveBeenCalled();
    });

    it('does not emit duplicate paused events if already paused', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordPause(30);
      await manager.recordPause(30);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
    });

    it('supports multiple pause and resume cycles within the same session', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });
      await manager.recordFirstFrame({position: 0});

      // Cycle 1
      await manager.recordPause(10);
      await manager.recordResume(10);

      // Cycle 2
      await manager.recordPause(50);
      await manager.recordResume(50);

      expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledTimes(2);
    });
  });

  describe('8. Step 5a: completed event (natural playback finish)', () => {
    it('emits completed and terminates active session', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        duration: 6000,
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordComplete({duration: 6000});

      expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          duration: 6000,
          totalPlayTimeMs: expect.any(Number),
        }),
      );

      expect(manager.isSessionActive()).toBe(false);
      expect(manager.getCurrentSessionId()).toBeNull();
    });

    it('ensures completed and stopped are mutually exclusive (stopped is ignored once completed)', async () => {
      await manager.startSession({
        contentId: 'movie-101',
        duration: 3600,
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordComplete({duration: 3600});
      await manager.recordStop({position: 3600, reason: 'user_exit'});

      expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStopped).not.toHaveBeenCalled();
    });
  });

  describe('9. Step 5b: stopped event (exit / interruption before completion)', () => {
    it('emits stopped when playback ends before completion', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-101',
        duration: 3600,
      });
      await manager.recordFirstFrame({position: 0});

      await manager.recordStop({
        position: 120,
        duration: 3600,
        reason: 'back_navigation',
      });

      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-101',
          position: 120,
          duration: 3600,
          reason: 'back_navigation',
          totalPlayTimeMs: expect.any(Number),
        }),
      );

      expect(manager.isSessionActive()).toBe(false);
    });

    it('does not emit completed once stopped has fired', async () => {
      await manager.startSession({
        contentId: 'movie-101',
      });

      await manager.recordStop({reason: 'user_exit'});
      await manager.recordComplete({duration: 3600});

      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackCompleted).not.toHaveBeenCalled();
    });
  });

  describe('10. Automatic session termination on episode / content change', () => {
    it('automatically stops previous session with reason "episode_switch" when starting a new session', async () => {
      const firstSessionId = await manager.startSession({
        contentId: 'episode-1',
        contentType: 'episode',
      });
      await manager.recordFirstFrame({position: 0});

      // Start new episode without explicitly stopping first episode
      const secondSessionId = await manager.startSession({
        contentId: 'episode-2',
        contentType: 'episode',
      });

      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: firstSessionId,
          contentId: 'episode-1',
          reason: 'episode_switch',
        }),
      );

      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.trackPlaybackStarted).toHaveBeenLastCalledWith(
        expect.objectContaining({
          playbackSessionId: secondSessionId,
          contentId: 'episode-2',
        }),
      );
      expect(secondSessionId).not.toBe(firstSessionId);
    });
  });

  describe('11. AnalyticsService integration methods', () => {
    let service: AnalyticsService;
    let serviceContextManager: AnalyticsContextManager;

    beforeEach(() => {
      serviceContextManager = new AnalyticsContextManager();
      service = new AnalyticsService(serviceContextManager);
    });

    it('safely handles missing required params without crashing', async () => {
      // Missing playbackSessionId / contentId
      await service.trackPlaybackStartRequested({} as any);
      await service.trackPlayerReady({} as any);
      await service.trackPlaybackStarted({} as any);
      await service.trackFirstFrame({} as any);
      await service.trackBufferStarted({} as any);
      await service.trackBufferEnded({} as any);
      await service.trackPlaybackPaused({} as any);
      await service.trackPlaybackResumed({} as any);
      await service.trackPlaybackCompleted({} as any);
      await service.trackPlaybackStopped({} as any);
      await service.trackSeekStarted({} as any);
      await service.trackSeekCompleted({} as any);
      await service.trackAudioTrackChanged({} as any);
      await service.trackSubtitleTrackChanged({} as any);
      await service.trackQualitySelected({} as any);
      await service.trackBitrateChanged({} as any);
      await service.trackResolutionChanged({} as any);
    });

    it('tracks full telemetry payload with valid parameters', async () => {
      const trackSpy = jest.spyOn(service, 'track').mockResolvedValue(undefined);

      await service.trackPlaybackStartRequested({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        playbackType: 'movie',
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.PLAYBACK_START_REQUESTED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
        }),
      );

      await service.trackPlayerReady({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        playbackType: 'movie',
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.PLAYER_READY,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
        }),
      );

      await service.trackBufferStarted({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        playbackType: 'movie',
        bufferCount: 1,
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.BUFFER_STARTED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
          bufferCount: 1,
        }),
      );

      await service.trackBufferEnded({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        playbackType: 'movie',
        bufferDurationMs: 1500,
        bufferCount: 1,
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.BUFFER_ENDED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
          bufferDurationMs: 1500,
          bufferCount: 1,
        }),
      );

      await service.trackSeekStarted({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        seekStartPosition: 10,
        seekTargetPosition: 40,
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.SEEK_STARTED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
          seekStartPosition: 10,
          seekTargetPosition: 40,
        }),
      );

      await service.trackSeekCompleted({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        seekStartPosition: 10,
        seekTargetPosition: 40,
        seekDurationMs: 420,
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.SEEK_COMPLETED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          contentId: 'test_id',
          seekDurationMs: 420,
        }),
      );

      await service.trackAudioTrackChanged({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        toAudioTrackId: 'audio-es',
        toLanguage: 'es',
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.AUDIO_TRACK_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          toAudioTrackId: 'audio-es',
          toLanguage: 'es',
        }),
      );

      await service.trackSubtitleTrackChanged({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        toSubtitleTrackId: 'sub-fr',
        toLanguage: 'fr',
        isOff: false,
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.SUBTITLE_TRACK_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          toSubtitleTrackId: 'sub-fr',
          toLanguage: 'fr',
        }),
      );

      await service.trackQualitySelected({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        qualityId: '1080p',
        qualityMode: 'manual',
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.QUALITY_SELECTED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          qualityId: '1080p',
          qualityMode: 'manual',
        }),
      );

      await service.trackBitrateChanged({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        toBitrate: 3000000,
        bitrateMbps: '3.0 Mbps',
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.BITRATE_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          toBitrate: 3000000,
        }),
      );

      await service.trackResolutionChanged({
        playbackSessionId: 'ps_123',
        contentId: 'test_id',
        toWidth: 1920,
        toHeight: 1080,
      });

      expect(trackSpy).toHaveBeenCalledWith(
        AnalyticsEvent.RESOLUTION_CHANGED,
        expect.objectContaining({
          playbackSessionId: 'ps_123',
          toWidth: 1920,
          toHeight: 1080,
        }),
      );
    });
  });

  describe('12. Day 4: Seek Analytics (seek_started & seek_completed)', () => {
    it('records seek_started and seek_completed with calculated seek_duration_ms', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-seek',
        contentTitle: 'Seek Test Movie',
        contentType: 'movie',
      });

      expect(manager.isSeeking()).toBe(false);

      await manager.recordSeekStarted(10, 50);

      expect(manager.isSeeking()).toBe(true);
      expect(mockAnalytics.trackSeekStarted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackSeekStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-seek',
          seekStartPosition: 10,
          seek_start_position: 10,
          seekTargetPosition: 50,
          seek_target_position: 50,
        }),
      );

      await manager.recordSeekCompleted(50);

      expect(manager.isSeeking()).toBe(false);
      expect(mockAnalytics.trackSeekCompleted).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackSeekCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-seek',
          seekStartPosition: 10,
          seek_start_position: 10,
          seekTargetPosition: 50,
          seek_target_position: 50,
          seekDurationMs: expect.any(Number),
          seek_duration_ms: expect.any(Number),
        }),
      );
    });

    it('updates seek target position without emitting duplicate seek_started on rapid seeks', async () => {
      await manager.startSession({
        contentId: 'movie-seek-rapid',
        contentType: 'movie',
      });

      await manager.recordSeekStarted(10, 20);
      expect(mockAnalytics.trackSeekStarted).toHaveBeenCalledTimes(1);

      // Subsequent rapid keypress
      await manager.recordSeekStarted(10, 30);
      expect(mockAnalytics.trackSeekStarted).toHaveBeenCalledTimes(1);

      await manager.recordSeekCompleted(30);
      expect(mockAnalytics.trackSeekCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          seekStartPosition: 10,
          seekTargetPosition: 30,
        }),
      );
    });

    it('ignores seek_completed if recordSeekStarted was not called', async () => {
      await manager.startSession({
        contentId: 'movie-seek-none',
        contentType: 'movie',
      });

      await manager.recordSeekCompleted(100);
      expect(mockAnalytics.trackSeekCompleted).not.toHaveBeenCalled();
    });

    it('ignores seek events when no active session exists or session stopped', async () => {
      await manager.recordSeekStarted(0, 10);
      await manager.recordSeekCompleted(10);
      expect(mockAnalytics.trackSeekStarted).not.toHaveBeenCalled();
      expect(mockAnalytics.trackSeekCompleted).not.toHaveBeenCalled();

      await manager.startSession({ contentId: 'stopped-session', contentType: 'movie' });
      await manager.recordStop();
      await manager.recordSeekStarted(0, 10);
      expect(mockAnalytics.trackSeekStarted).not.toHaveBeenCalled();
    });
  });

  describe('13. Day 4: Track Change Analytics (audio_track_changed & subtitle_track_changed)', () => {
    it('records audio_track_changed when changing audio track/language', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-audio',
        contentType: 'movie',
      });

      await manager.recordAudioTrackChanged({
        fromAudioTrackId: 'audio-en',
        fromLanguage: 'en',
        fromFormat: 'stereo',
        toAudioTrackId: 'audio-es',
        toLanguage: 'es',
        toFormat: '5.1',
      });

      expect(mockAnalytics.trackAudioTrackChanged).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackAudioTrackChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-audio',
          fromAudioTrackId: 'audio-en',
          fromLanguage: 'en',
          fromFormat: 'stereo',
          toAudioTrackId: 'audio-es',
          toLanguage: 'es',
          toFormat: '5.1',
        }),
      );

      expect(manager.getCurrentAudioTrack()).toEqual(
        expect.objectContaining({
          trackId: 'audio-es',
          language: 'es',
          format: '5.1',
        }),
      );

      // Does not re-emit if trackId is the same
      await manager.recordAudioTrackChanged({
        toAudioTrackId: 'audio-es',
        toLanguage: 'es',
      });
      expect(mockAnalytics.trackAudioTrackChanged).toHaveBeenCalledTimes(1);
    });

    it('records subtitle_track_changed when switching subtitles or disabling them', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-subtitles',
        contentType: 'movie',
      });

      await manager.recordSubtitleTrackChanged({
        fromSubtitleTrackId: 'sub-en',
        fromLanguage: 'en',
        toSubtitleTrackId: 'sub-fr',
        toLanguage: 'fr',
        isOff: false,
      });

      expect(mockAnalytics.trackSubtitleTrackChanged).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackSubtitleTrackChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-subtitles',
          fromSubtitleTrackId: 'sub-en',
          toSubtitleTrackId: 'sub-fr',
          toLanguage: 'fr',
          isOff: false,
        }),
      );

      expect(manager.getCurrentSubtitleTrack()).toEqual(
        expect.objectContaining({
          trackId: 'sub-fr',
          language: 'fr',
        }),
      );

      // Turning subtitles off
      await manager.recordSubtitleTrackChanged({
        toSubtitleTrackId: 'off',
        isOff: true,
      });

      expect(mockAnalytics.trackSubtitleTrackChanged).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.trackSubtitleTrackChanged).toHaveBeenLastCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          toSubtitleTrackId: 'off',
          isOff: true,
        }),
      );

      // Does not re-emit if trackId is the same
      await manager.recordSubtitleTrackChanged({
        toSubtitleTrackId: 'off',
        isOff: true,
      });
      expect(mockAnalytics.trackSubtitleTrackChanged).toHaveBeenCalledTimes(2);
    });
  });

  describe('14. Day 4: Video Quality & ABR Analytics (quality_selected, bitrate_changed, resolution_changed)', () => {
    it('records quality_selected for manual vs auto modes', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-quality',
        contentType: 'movie',
      });

      await manager.recordQualitySelected({
        qualityId: '1080p',
        qualityMode: 'manual',
        targetResolution: '1080p',
        targetBitrate: '5.0 Mbps',
      });

      expect(mockAnalytics.trackQualitySelected).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackQualitySelected).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-quality',
          qualityId: '1080p',
          qualityMode: 'manual',
          targetResolution: '1080p',
          targetBitrate: '5.0 Mbps',
        }),
      );

      expect(manager.getCurrentQuality()).toEqual({
        qualityId: '1080p',
        qualityMode: 'manual',
      });

      // Selecting auto mode
      await manager.recordQualitySelected({
        qualityId: 'auto',
      });

      expect(mockAnalytics.trackQualitySelected).toHaveBeenCalledTimes(2);
      expect(mockAnalytics.trackQualitySelected).toHaveBeenLastCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          qualityId: 'auto',
          qualityMode: 'auto',
        }),
      );
      expect(manager.getCurrentQuality()?.qualityMode).toBe('auto');
    });

    it('records bitrate_changed and deduplicates consecutive duplicate bitrates', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-bitrate',
        contentType: 'movie',
      });

      await manager.recordBitrateChanged({
        toBitrate: 2500000,
        bitrateMbps: '2.5 Mbps',
      });

      expect(mockAnalytics.trackBitrateChanged).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackBitrateChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-bitrate',
          toBitrate: 2500000,
          bitrateMbps: '2.5 Mbps',
        }),
      );

      expect(manager.getCurrentRendition()?.bitrate).toBe(2500000);

      // Same bitrate -> deduplicated
      await manager.recordBitrateChanged({
        toBitrate: 2500000,
      });
      expect(mockAnalytics.trackBitrateChanged).toHaveBeenCalledTimes(1);

      // Higher bitrate adaptation
      await manager.recordBitrateChanged({
        toBitrate: 5000000,
        bitrateMbps: '5.0 Mbps',
      });
      expect(mockAnalytics.trackBitrateChanged).toHaveBeenCalledTimes(2);
    });

    it('records resolution_changed and deduplicates consecutive identical resolutions', async () => {
      const sessionId = await manager.startSession({
        contentId: 'movie-resolution',
        contentType: 'movie',
      });

      await manager.recordResolutionChanged({
        toWidth: 1280,
        toHeight: 720,
        resolutionBadge: '720p',
      });

      expect(mockAnalytics.trackResolutionChanged).toHaveBeenCalledTimes(1);
      expect(mockAnalytics.trackResolutionChanged).toHaveBeenCalledWith(
        expect.objectContaining({
          playbackSessionId: sessionId,
          contentId: 'movie-resolution',
          toWidth: 1280,
          toHeight: 720,
          resolutionBadge: '720p',
        }),
      );

      expect(manager.getCurrentRendition()).toEqual(
        expect.objectContaining({
          width: 1280,
          height: 720,
        }),
      );

      // Same resolution -> deduplicated
      await manager.recordResolutionChanged({
        toWidth: 1280,
        toHeight: 720,
      });
      expect(mockAnalytics.trackResolutionChanged).toHaveBeenCalledTimes(1);

      // Resolution upgrade
      await manager.recordResolutionChanged({
        toWidth: 1920,
        toHeight: 1080,
        resolutionBadge: '1080p',
      });
      expect(mockAnalytics.trackResolutionChanged).toHaveBeenCalledTimes(2);
    });
  });

  describe("15. Today's Playback Lifecycle Completion & Playback Error Analytics", () => {
    describe('playback_started (deferred & single emission)', () => {
      it('defers playback_started when deferPlaybackStarted is true, then emits once on recordPlaybackStarted', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-101',
          contentTitle: 'Feature Movie',
          contentType: 'movie',
          isLive: false,
          deferPlaybackStarted: true,
        });

        // Start requested is emitted, but playback_started is deferred
        expect(mockAnalytics.trackPlaybackStartRequested).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackPlaybackStarted).not.toHaveBeenCalled();
        expect(manager.hasPlaybackStarted()).toBe(false);

        // Actual player starts playback
        await manager.recordPlaybackStarted({ startPosition: 0 });
        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledWith(
          expect.objectContaining({
            playbackSessionId: sessionId,
            contentId: 'vod-101',
            contentType: 'movie',
            playbackType: 'movie',
            isLive: false,
          }),
        );
        expect(manager.hasPlaybackStarted()).toBe(true);

        // Duplicate call is ignored
        await manager.recordPlaybackStarted({ startPosition: 10 });
        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);
      });

      it('emits playback_started immediately by default for backwards compatibility', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-legacy',
          contentTitle: 'Legacy Content',
          contentType: 'movie',
        });

        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);
        expect(manager.hasPlaybackStarted()).toBe(true);
      });
    });

    describe('first_frame (rendered frame & startup timing)', () => {
      it('calculates startup_time_ms and timeToFirstFrameMs accurately and fires once', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-ff',
          contentType: 'movie',
          deferPlaybackStarted: true,
        });

        await manager.recordPlaybackStarted({ startPosition: 0 });
        await manager.recordFirstFrame({ position: 0 });

        expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledWith(
          expect.objectContaining({
            playbackSessionId: sessionId,
            contentId: 'vod-ff',
            timeToFirstFrameMs: expect.any(Number),
            startup_time_ms: expect.any(Number),
          }),
        );

        // Repeated first_frame callbacks are deduplicated
        await manager.recordFirstFrame({ position: 1 });
        expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
      });

      it('automatically triggers recordPlaybackStarted if first_frame renders before explicit start call', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-auto-start',
          contentType: 'movie',
          deferPlaybackStarted: true,
        });

        expect(mockAnalytics.trackPlaybackStarted).not.toHaveBeenCalled();

        await manager.recordFirstFrame({ position: 0 });

        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);
      });
    });

    describe('playback_paused (PLAYING -> PAUSED transition)', () => {
      it('fires playback_paused strictly when transitioning from playing to paused with numeric position', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-pause',
          contentType: 'movie',
        });
        await manager.recordFirstFrame({ position: 0 });

        // Currently playing -> pause at 155s
        await manager.recordPause(155);

        expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledWith(
          expect.objectContaining({
            playbackSessionId: sessionId,
            contentId: 'vod-pause',
            position: 155,
          }),
        );

        // Duplicate pause is deduplicated
        await manager.recordPause(155);
        expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);
      });

      it('does NOT fire playback_paused during initialization before playing', async () => {
        await manager.startSession({
          contentId: 'vod-init-pause',
          contentType: 'movie',
          deferPlaybackStarted: true,
        });

        // Player not in 'playing' state
        await manager.recordPause(0);
        expect(mockAnalytics.trackPlaybackPaused).not.toHaveBeenCalled();
      });

      it('does NOT fire playback_paused during buffering', async () => {
        await manager.startSession({
          contentId: 'vod-buffering-pause',
          contentType: 'movie',
        });
        await manager.recordFirstFrame({ position: 0 });

        // Enter buffering
        await manager.recordBufferStarted();
        expect(manager.isCurrentlyBuffering()).toBe(true);

        // Pause called during buffering should not fire
        await manager.recordPause(10);
        expect(mockAnalytics.trackPlaybackPaused).not.toHaveBeenCalled();
      });
    });

    describe('playback_resumed (PAUSED -> PLAYING transition)', () => {
      it('fires playback_resumed strictly when transitioning from paused to playing with numeric position', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-resume',
          contentType: 'movie',
        });
        await manager.recordFirstFrame({ position: 0 });
        await manager.recordPause(120);
        expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);

        // Resume at 120s
        await manager.recordResume(120);
        expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledWith(
          expect.objectContaining({
            playbackSessionId: sessionId,
            contentId: 'vod-resume',
            position: 120,
          }),
        );
      });

      it('does NOT fire playback_resumed for initial playback start', async () => {
        await manager.startSession({
          contentId: 'vod-initial-resume',
          contentType: 'movie',
        });
        await manager.recordFirstFrame({ position: 0 });

        // Initial play attempt without being paused
        await manager.recordResume(0);
        expect(mockAnalytics.trackPlaybackResumed).not.toHaveBeenCalled();
      });

      it('does NOT fire playback_resumed simply because buffering ended', async () => {
        await manager.startSession({
          contentId: 'vod-buffering-resume',
          contentType: 'movie',
        });
        await manager.recordFirstFrame({ position: 0 });

        await manager.recordBufferStarted();
        await manager.recordBufferEnded();

        // Buffer exit must NOT emit playback_resumed
        expect(mockAnalytics.trackPlaybackResumed).not.toHaveBeenCalled();
      });
    });

    describe('playback_stopped (controlled reasons)', () => {
      it('uses controlled stopReason taxonomy and maps legacy reasons', async () => {
        // user_exit
        await manager.startSession({ contentId: 'vod-stop-1', contentType: 'movie' });
        await manager.recordStop({ position: 50, stopReason: 'user_exit' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
          expect.objectContaining({
            stopReason: 'user_exit',
            position: 50,
          }),
        );

        // navigation (from back_navigation)
        await manager.startSession({ contentId: 'vod-stop-2', contentType: 'movie' });
        await manager.recordStop({ position: 80, reason: 'back_navigation' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
          expect.objectContaining({
            stopReason: 'navigation',
            reason: 'back_navigation',
          }),
        );

        // content_changed (from episode_switch)
        await manager.startSession({ contentId: 'vod-stop-3', contentType: 'movie' });
        await manager.recordStop({ position: 100, reason: 'episode_switch' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
          expect.objectContaining({
            stopReason: 'content_changed',
            reason: 'episode_switch',
          }),
        );

        // player_destroyed
        await manager.startSession({ contentId: 'vod-stop-4', contentType: 'movie' });
        await manager.recordStop({ position: 110, stopReason: 'player_destroyed' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
          expect.objectContaining({
            stopReason: 'player_destroyed',
          }),
        );

        // unknown
        await manager.startSession({ contentId: 'vod-stop-5', contentType: 'movie' });
        await manager.recordStop({ position: 120, stopReason: 'unknown' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledWith(
          expect.objectContaining({
            stopReason: 'unknown',
          }),
        );
      });
    });

    describe('Terminal outcome mutual exclusivity (COMPLETED vs STOPPED vs ERROR)', () => {
      it('completed prevents subsequent stopped and error calls', async () => {
        await manager.startSession({ contentId: 'vod-term-comp', contentType: 'movie' });
        await manager.recordFirstFrame({ position: 0 });

        // Natural completion
        await manager.recordComplete({ duration: 3600 });
        expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledTimes(1);

        // Subsequent stop or error is ignored
        await manager.recordStop({ reason: 'user_exit' });
        expect(mockAnalytics.trackPlaybackStopped).not.toHaveBeenCalled();

        await manager.recordPlaybackError(new Error('late error'), { isFatal: true });
        expect(mockAnalytics.trackPlaybackError).not.toHaveBeenCalled();
      });

      it('stopped prevents subsequent completed and error calls', async () => {
        await manager.startSession({ contentId: 'vod-term-stop', contentType: 'movie' });
        await manager.recordFirstFrame({ position: 0 });

        await manager.recordStop({ stopReason: 'user_exit' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);

        // Subsequent complete or error is ignored
        await manager.recordComplete({ duration: 3600 });
        expect(mockAnalytics.trackPlaybackCompleted).not.toHaveBeenCalled();

        await manager.recordPlaybackError(new Error('late error'), { isFatal: true });
        expect(mockAnalytics.trackPlaybackError).not.toHaveBeenCalled();
      });

      it('fatal error prevents subsequent completed and stopped calls', async () => {
        await manager.startSession({ contentId: 'vod-term-err', contentType: 'movie' });
        await manager.recordFirstFrame({ position: 0 });

        await manager.recordPlaybackError(new Error('Fatal decoder failure'), {
          isFatal: true,
        });
        expect(mockAnalytics.trackPlaybackError).toHaveBeenCalledTimes(1);

        // Subsequent complete or stop is ignored
        await manager.recordComplete({ duration: 3600 });
        expect(mockAnalytics.trackPlaybackCompleted).not.toHaveBeenCalled();

        await manager.recordStop({ stopReason: 'user_exit' });
        expect(mockAnalytics.trackPlaybackStopped).not.toHaveBeenCalled();
      });
    });

    describe('playback_error (normalization & sanitization)', () => {
      it('normalizes W3C MediaErrors correctly', () => {
        expect(normalizePlaybackError({ code: 1, message: 'Aborted' })).toEqual(
          expect.objectContaining({
            errorCategory: 'PLAYER',
            errorCode: '1',
          }),
        );
        expect(normalizePlaybackError({ code: 2, message: 'Network error' })).toEqual(
          expect.objectContaining({
            errorCategory: 'NETWORK',
            errorCode: '2',
          }),
        );
        expect(normalizePlaybackError({ code: 3, message: 'Decode error' })).toEqual(
          expect.objectContaining({
            errorCategory: 'CODEC',
            errorCode: '3',
          }),
        );
        expect(normalizePlaybackError({ code: 4, message: 'Source not supported' })).toEqual(
          expect.objectContaining({
            errorCategory: 'SOURCE',
            errorCode: '4',
          }),
        );
      });

      it('normalizes Shaka categories and DRM errors correctly', () => {
        // Shaka category 6 = DRM
        expect(
          normalizePlaybackError({
            category: 6,
            code: 6001,
            message: 'Widevine license request failed',
          }),
        ).toEqual(
          expect.objectContaining({
            errorCategory: 'DRM',
            errorCode: '6001',
          }),
        );

        // Shaka category 1 = Network
        expect(
          normalizePlaybackError({
            category: 1,
            code: 1002,
            message: 'Segment request timed out',
          }),
        ).toEqual(
          expect.objectContaining({
            errorCategory: 'NETWORK',
            errorCode: '1002',
          }),
        );

        // Shaka category 2 = Manifest
        expect(
          normalizePlaybackError({
            category: 2,
            code: 2001,
            message: 'DASH manifest parsing error',
          }),
        ).toEqual(
          expect.objectContaining({
            errorCategory: 'MANIFEST',
            errorCode: '2001',
          }),
        );
      });

      it('sanitizes sensitive data and tokens from error messages', () => {
        const rawUrlMsg =
          'Error loading https://cdn.ott.com/stream.mpd?apiKey=SECRET_123&token=tok_abc Authorization: Bearer eyJhbGciOi.secret.signature at line 40';
        const sanitizedUrl = sanitizeErrorMessage(rawUrlMsg);

        expect(sanitizedUrl).not.toContain('SECRET_123');
        expect(sanitizedUrl).not.toContain('tok_abc');
        expect(sanitizedUrl).not.toContain('Bearer eyJhbGciOi.secret.signature');
        expect(sanitizedUrl).toContain('https://cdn.ott.com/stream.mpd');

        const rawParamMsg = 'Failed DRM request: token=my_secret_token and key=license_key';
        const sanitizedParams = sanitizeErrorMessage(rawParamMsg);
        expect(sanitizedParams).toContain('token=[REDACTED]');
        expect(sanitizedParams).toContain('key=[REDACTED]');
        expect(sanitizedParams).not.toContain('my_secret_token');
        expect(sanitizedParams).not.toContain('license_key');
      });

      it('records playback_error telemetry through manager', async () => {
        const sessionId = await manager.startSession({
          contentId: 'vod-err-record',
          contentType: 'movie',
        });

        await manager.recordPlaybackError(
          {
            code: 3,
            message: 'MEDIA_ERR_DECODE: Hardware decoder crashed',
          },
          {
            position: 45,
            isFatal: true,
          },
        );

        expect(mockAnalytics.trackPlaybackError).toHaveBeenCalledTimes(1);
        expect(mockAnalytics.trackPlaybackError).toHaveBeenCalledWith(
          expect.objectContaining({
            playbackSessionId: sessionId,
            contentId: 'vod-err-record',
            errorCategory: 'CODEC',
            errorCode: '3',
            errorMessage: expect.stringContaining('MEDIA_ERR_DECODE'),
            isFatal: true,
            position: 45,
          }),
        );
      });

      it('deduplicates identical errors in the same session', async () => {
        await manager.startSession({
          contentId: 'vod-err-dedup',
          contentType: 'movie',
        });

        const errorObj = { code: 2, message: 'Network glitch' };
        await manager.recordPlaybackError(errorObj, { isFatal: false });
        expect(mockAnalytics.trackPlaybackError).toHaveBeenCalledTimes(1);

        // Second non-fatal error with same signature is deduplicated
        await manager.recordPlaybackError(errorObj, { isFatal: false });
        expect(mockAnalytics.trackPlaybackError).toHaveBeenCalledTimes(1);
      });
    });

    describe('Next episode flow', () => {
      it('creates distinct playbackSessionId for next episode after previous episode completes', async () => {
        // Episode 1
        const ep1SessionId = await manager.startSession({
          contentId: 'ep-1',
          contentType: 'episode',
        });
        await manager.recordFirstFrame({ position: 0 });
        await manager.recordComplete({ duration: 1800 });
        expect(mockAnalytics.trackPlaybackCompleted).toHaveBeenCalledWith(
          expect.objectContaining({ playbackSessionId: ep1SessionId }),
        );

        // Next Episode countdown completes -> Episode 2 starts
        const ep2SessionId = await manager.startSession({
          contentId: 'ep-2',
          contentType: 'episode',
          deferPlaybackStarted: true,
        });

        expect(ep2SessionId).not.toBe(ep1SessionId);
        await manager.recordPlaybackStarted({ startPosition: 0 });
        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledWith(
          expect.objectContaining({
            playbackSessionId: ep2SessionId,
            contentId: 'ep-2',
          }),
        );
      });
    });

    describe('Live TV special cases', () => {
      it('supports start, first_frame, pause, resume, stop, error but NEVER emits completed', async () => {
        const liveSessionId = await manager.startSession({
          contentId: 'live-channel-1',
          contentType: 'live',
          isLive: true,
          deferPlaybackStarted: true,
        });

        await manager.recordPlaybackStarted({ startPosition: 0 });
        expect(mockAnalytics.trackPlaybackStarted).toHaveBeenCalledTimes(1);

        await manager.recordFirstFrame({ position: 0 });
        expect(mockAnalytics.trackFirstFrame).toHaveBeenCalledTimes(1);

        await manager.recordPause(0);
        expect(mockAnalytics.trackPlaybackPaused).toHaveBeenCalledTimes(1);

        await manager.recordResume(0);
        expect(mockAnalytics.trackPlaybackResumed).toHaveBeenCalledTimes(1);

        // Live TV must NEVER emit completed
        await manager.recordComplete({ duration: 99999 });
        expect(mockAnalytics.trackPlaybackCompleted).not.toHaveBeenCalled();

        // Stopped is supported
        await manager.recordStop({ stopReason: 'user_exit' });
        expect(mockAnalytics.trackPlaybackStopped).toHaveBeenCalledTimes(1);
      });
    });

    describe('Non-blocking analytics guarantee', () => {
      it('does not crash or throw if analytics tracking throws', async () => {
        const throwingAnalytics = {
          trackPlaybackStartRequested: jest.fn().mockRejectedValue(new Error('Network offline')),
          trackPlaybackStarted: jest.fn().mockRejectedValue(new Error('Analytics service down')),
          trackFirstFrame: jest.fn().mockRejectedValue(new Error('Quota exceeded')),
          trackPlaybackPaused: jest.fn().mockRejectedValue(new Error('Timeout')),
          trackPlaybackResumed: jest.fn().mockRejectedValue(new Error('Timeout')),
          trackPlaybackCompleted: jest.fn().mockRejectedValue(new Error('Server error')),
          trackPlaybackStopped: jest.fn().mockRejectedValue(new Error('Server error')),
          trackPlaybackError: jest.fn().mockRejectedValue(new Error('Fatal error')),
        } as unknown as AnalyticsService;

        const safeManager = new PlaybackSessionManager(throwingAnalytics);

        await expect(
          safeManager.startSession({ contentId: 'safe-movie', contentType: 'movie' }),
        ).resolves.not.toThrow();
        await expect(safeManager.recordFirstFrame({ position: 0 })).resolves.not.toThrow();
        await expect(safeManager.recordPause(10)).resolves.not.toThrow();
        await expect(safeManager.recordResume(10)).resolves.not.toThrow();
        await expect(
          safeManager.recordPlaybackError(new Error('Player broke'), { isFatal: true }),
        ).resolves.not.toThrow();
      });
    });
  });
});
